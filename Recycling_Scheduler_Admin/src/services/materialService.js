import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../firebase.js';
import { MONTEVIDEO_MATERIAL_PRESETS } from '../data/montevideoMaterialPresets.js';

const materialsCollection = collection(db, 'materials');

const slugify = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const aliases = {
  papel_carton: ['papel_carton', 'papel_y_carton', 'paper_cardboard'],
  plasticos: ['plasticos', 'plastics', 'plastic'],
  otros: ['otros', 'other', 'others', 'otros_reciclables', 'other_recyclables'],
  organico: ['organico', 'organicos', 'organic', 'organics'],
  descarte: ['descarte', 'discard', 'mezclado', 'mixed', 'mixed_waste'],
};

export const localizedName = (data, language) => {
  const names = data.names || (typeof data.name === 'object' ? data.name : null);
  return names?.[language] || names?.es || names?.en || data.name || data.label || '';
};

const statusFromData = data => (
  data.status || (data.archived === true ? 'archived' : data.active === false ? 'inactive' : 'active')
);

export const uploadMaterialPhoto = async (file, materialName) => {
  if (!file) return '';
  if (!file.type?.startsWith('image/')) throw new Error('El archivo debe ser una imagen');

  const safeName = slugify(materialName) || 'material';
  const safeFileName = file.name.replace(/\s+/g, '_');
  const storageRef = ref(storage, `materials/photos/${safeName}_${Date.now()}_${safeFileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

const normalizeEmbeddedSubMaterials = (value, language) => (
  Array.isArray(value)
    ? value.map(item => ({
        id: item.id || slugify(localizedName(item, language) || crypto.randomUUID()),
        documentId: null,
        name: localizedName(item, language) || item.id || '',
        names: item.names || null,
        status: statusFromData(item),
        storage: 'embedded',
      }))
    : []
);

const normalizeDocument = (snapshot, language) => {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    canonicalId: data.canonicalId || null,
    parentId: data.parentId || data.parentMaterialId || null,
    name: localizedName(data, language) || snapshot.id,
    names: data.names || null,
    status: statusFromData(data),
    photoUrl: data.photoUrl || data.imageUrl || '',
    subMaterials: normalizeEmbeddedSubMaterials(data.subMaterials, language),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

export const getMaterials = async (language = 'es') => {
  const snapshot = await getDocs(materialsCollection);
  const documents = snapshot.docs.map(item => normalizeDocument(item, language));
  const roots = documents.filter(item => !item.parentId);
  const children = documents.filter(item => item.parentId);

  return roots
    .map(material => {
      const acceptedParentIds = new Set([material.id, material.canonicalId].filter(Boolean));
      const flatChildren = children
        .filter(item => acceptedParentIds.has(item.parentId))
        .map(item => ({
          id: item.id,
          documentId: item.id,
          name: item.name,
          names: item.names,
          status: item.status,
          storage: 'flat',
        }));
      const merged = [...material.subMaterials];
      flatChildren.forEach(child => {
        const index = merged.findIndex(item => item.id === child.id);
        if (index >= 0) merged[index] = child;
        else merged.push(child);
      });
      return { ...material, subMaterials: merged };
    })
    .sort((a, b) => a.name.localeCompare(b.name, language, { sensitivity: 'base' }));
};

const normalizeRequiredNames = names => {
  const es = String(names?.es || '').trim();
  const en = String(names?.en || '').trim();
  if (!es || !en) throw new Error('Los nombres en español e inglés son obligatorios');
  return { es, en };
};

export const createMaterial = async (names, photoUrl = '') => {
  const localizedNames = normalizeRequiredNames(names);
  if (!photoUrl) throw new Error('La foto del material es obligatoria');
  const id = slugify(localizedNames.es || localizedNames.en);
  if (!id) throw new Error('El nombre del material debe contener letras o números');

  const reference = doc(materialsCollection, id);
  if ((await getDoc(reference)).exists()) throw new Error('Ya existe un material con este nombre');

  const material = {
    name: localizedNames.es,
    names: localizedNames,
    status: 'active',
    active: true,
    archived: false,
    photoUrl,
    imageUrl: photoUrl,
    workflows: ['both'],
    hasSubMaterials: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(reference, material);
  return { id, ...material, subMaterials: [], createdAt: null, updatedAt: null };
};

export const updateMaterial = async (id, changes) => {
  const compatibleChanges = { ...changes };
  if (changes.status) {
    compatibleChanges.active = changes.status === 'active';
    compatibleChanges.archived = changes.status === 'archived';
  }
  const patch = { ...compatibleChanges, updatedAt: serverTimestamp() };
  await updateDoc(doc(materialsCollection, id), patch);
  return patch;
};

export const updateMaterialNames = async (id, names) => {
  const reference = doc(materialsCollection, id);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) throw new Error('No se encontró el material');
  const current = snapshot.data() || {};
  const mergedNames = { ...(current.names || {}), ...names };
  const patch = {
    names: mergedNames,
    name: mergedNames.es || mergedNames.en || current.name || id,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(reference, patch);
  return patch;
};

export const setMaterialStatus = (id, status) => updateMaterial(id, { status });

export const addSubMaterial = async (material, names) => {
  const localizedNames = normalizeRequiredNames(names);
  const id = slugify(localizedNames.es || localizedNames.en);
  if (!id) throw new Error('El nombre del submaterial debe contener letras o números');
  if (material.subMaterials.some(item => item.id === id) || (await getDoc(doc(materialsCollection, id))).exists()) {
    throw new Error('Ya existe un submaterial con este nombre');
  }

  await setDoc(doc(materialsCollection, id), {
    names: localizedNames,
    name: localizedNames.es,
    parentId: material.canonicalId || material.id,
    status: 'active',
    active: true,
    archived: false,
    workflows: ['classify'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(materialsCollection, material.id), {
    hasSubMaterials: true,
    updatedAt: serverTimestamp(),
  });
  return [...material.subMaterials, {
    id,
    documentId: id,
    name: localizedNames.es,
    names: localizedNames,
    status: 'active',
    storage: 'flat',
  }];
};

export const updateSubMaterial = async (material, subMaterialId, changes) => {
  const target = material.subMaterials.find(item => item.id === subMaterialId);
  if (target?.storage === 'flat') {
    await updateMaterial(target.documentId || target.id, changes);
  } else {
    const embedded = material.subMaterials.map(item => (
      item.id === subMaterialId ? { ...item, ...changes } : item
    ));
    await updateMaterial(material.id, {
      subMaterials: embedded.map(({ documentId, storage, ...item }) => item),
    });
  }
  return material.subMaterials.map(item => (
    item.id === subMaterialId ? { ...item, ...changes } : item
  ));
};

const findExistingRoot = (documents, presetId) => {
  const accepted = new Set(aliases[presetId] || [presetId]);
  return documents.find(item => {
    if (item.parentId) return false;
    return [item.id, item.canonicalId, item.name, item.names?.es, item.names?.en]
      .some(value => accepted.has(slugify(value)));
  });
};

export const syncMontevideoMaterialPresets = async () => {
  const snapshot = await getDocs(materialsCollection);
  const documents = snapshot.docs.map(item => normalizeDocument(item, 'es'));
  const batch = writeBatch(db);

  MONTEVIDEO_MATERIAL_PRESETS.forEach((preset, materialIndex) => {
    const existingRoot = findExistingRoot(documents, preset.id);
    const rootDocumentId = existingRoot?.id || preset.id;
    batch.set(doc(materialsCollection, rootDocumentId), {
      canonicalId: preset.id,
      names: preset.names,
      color: preset.color,
      status: existingRoot?.status || 'active',
      active: existingRoot?.status !== 'inactive' && existingRoot?.status !== 'archived',
      archived: existingRoot?.status === 'archived',
      workflows: ['both'],
      hasSubMaterials: preset.subMaterials.length > 0,
      sortOrder: materialIndex,
      updatedAt: serverTimestamp(),
      ...(!existingRoot ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });

    preset.subMaterials.forEach((subMaterial, subIndex) => {
      // Organic and discard use the parent ID itself as their no-subcategory value.
      if (subMaterial.id === preset.id) return;
      const existingChild = documents.find(item => item.id === subMaterial.id);
      batch.set(doc(materialsCollection, subMaterial.id), {
        names: subMaterial.names,
        color: subMaterial.color,
        parentId: preset.id,
        status: existingChild?.status || 'active',
        active: existingChild?.status !== 'inactive' && existingChild?.status !== 'archived',
        archived: existingChild?.status === 'archived',
        workflows: ['classify'],
        sortOrder: subIndex,
        updatedAt: serverTimestamp(),
        ...(!existingChild ? { createdAt: serverTimestamp() } : {}),
      }, { merge: true });
    });
  });

  await batch.commit();
};
