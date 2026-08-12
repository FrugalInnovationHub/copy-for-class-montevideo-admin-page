import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const materialsCollection = collection(db, 'materials');

const slugify = value => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const normalizeSubMaterials = value => (
  Array.isArray(value)
    ? value.map(item => ({
        id: item.id || slugify(item.name || crypto.randomUUID()),
        name: item.name || item.id || '',
        status: item.status || 'active',
      }))
    : []
);

const normalizeMaterial = snapshot => {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    name: data.name || snapshot.id,
    status: data.status || 'active',
    subMaterials: normalizeSubMaterials(data.subMaterials),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

export const getMaterials = async () => {
  const snapshot = await getDocs(materialsCollection);
  return snapshot.docs
    .map(normalizeMaterial)
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
};

export const createMaterial = async name => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('El nombre del material es obligatorio');
  const id = slugify(trimmedName);
  if (!id) throw new Error('El nombre del material debe contener letras o números');

  const reference = doc(materialsCollection, id);
  if ((await getDoc(reference)).exists()) throw new Error('Ya existe un material con este nombre');

  const material = {
    name: trimmedName,
    status: 'active',
    subMaterials: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(reference, material);
  return { id, ...material, createdAt: null, updatedAt: null };
};

export const updateMaterial = async (id, changes) => {
  const patch = { ...changes, updatedAt: serverTimestamp() };
  await updateDoc(doc(materialsCollection, id), patch);
  return patch;
};

export const setMaterialStatus = (id, status) => updateMaterial(id, { status });

export const addSubMaterial = async (material, name) => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('El nombre del submaterial es obligatorio');
  const id = slugify(trimmedName);
  if (!id) throw new Error('El nombre del submaterial debe contener letras o números');
  if (material.subMaterials.some(item => item.id === id)) throw new Error('Ya existe un submaterial con este nombre');

  const subMaterials = [
    ...material.subMaterials,
    { id, name: trimmedName, status: 'active' },
  ];
  await updateMaterial(material.id, { subMaterials });
  return subMaterials;
};

export const updateSubMaterial = async (material, subMaterialId, changes) => {
  const subMaterials = material.subMaterials.map(item => (
    item.id === subMaterialId ? { ...item, ...changes } : item
  ));
  await updateMaterial(material.id, { subMaterials });
  return subMaterials;
};
