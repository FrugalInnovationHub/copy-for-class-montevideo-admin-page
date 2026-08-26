import { useEffect, useMemo, useRef, useState } from 'react';
import NavigationWrapper from '../components/Navigation/NavigationWrapper';
import Spinner from '../components/Navigation/Spinner';
import { useLanguage } from '../i18n/LanguageContext';
import {
  addSubMaterial,
  createMaterial,
  getMaterials,
  setMaterialStatus,
  syncMontevideoMaterialPresets,
  updateMaterial,
  updateSubMaterial,
  uploadMaterialPhoto,
} from '../services/materialService';

const statusStyles = {
  active: 'border-emerald-600 bg-emerald-600 text-white',
  inactive: 'border-amber-500 bg-amber-500 text-white',
  archived: 'border-gray-600 bg-gray-600 text-white',
};

const ActiveMaterials = () => {
  const { language, t } = useLanguage();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialPhoto, setNewMaterialPhoto] = useState(null);
  const newMaterialPhotoInputRef = useRef(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editMaterialName, setEditMaterialName] = useState('');
  const [editMaterialPhoto, setEditMaterialPhoto] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [subMaterialNames, setSubMaterialNames] = useState({});

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      setMaterials(await getMaterials(language));
    } catch (loadError) {
      console.error(loadError);
      setError(t('No se pudieron cargar los materiales.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const visibleMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();
    return materials.filter(material => {
      if (filter !== 'all' && material.status !== filter) return false;
      if (!query) return true;
      return material.name.toLowerCase().includes(query)
        || material.subMaterials.some(item => item.name.toLowerCase().includes(query));
    });
  }, [filter, materials, search]);

  const runAction = async (key, action) => {
    try {
      setSaving(key);
      setError('');
      setNotice('');
      await action();
    } catch (actionError) {
      console.error(actionError);
      setError(t(actionError.message || 'No se pudo completar la operación.'));
    } finally {
      setSaving('');
    }
  };

  const handleLoadPresets = () => {
    if (!window.confirm(t('¿Agregar y sincronizar las categorías predefinidas de Montevideo App?'))) return;
    runAction('sync-presets', async () => {
      await syncMontevideoMaterialPresets();
      await loadMaterials();
      setNotice(t('Las categorías predefinidas de Montevideo App se sincronizaron correctamente.'));
    });
  };

  const handleCreateMaterial = event => {
    event.preventDefault();
    const name = newMaterialName.trim();
    if (!name) return;
    runAction('create-material', async () => {
      const photoUrl = newMaterialPhoto ? await uploadMaterialPhoto(newMaterialPhoto, name) : '';
      await createMaterial(name, photoUrl);
      setNewMaterialName('');
      setNewMaterialPhoto(null);
      if (newMaterialPhotoInputRef.current) newMaterialPhotoInputRef.current.value = '';
      await loadMaterials();
    });
  };

  const handleStartEditMaterial = material => {
    setEditingMaterial(material);
    setEditMaterialName(material.name);
    setEditMaterialPhoto(null);
  };

  const handleCancelMaterialEdit = () => {
    setEditingMaterial(null);
    setEditMaterialName('');
    setEditMaterialPhoto(null);
  };

  const handleSaveMaterialEdit = event => {
    event.preventDefault();
    if (!editingMaterial) return;
    const name = editMaterialName.trim();
    if (!name) return;

    runAction(`material-${editingMaterial.id}`, async () => {
      const changes = {};
      if (name !== editingMaterial.name) changes.name = name;
      if (editMaterialPhoto) {
        const uploadedPhotoUrl = await uploadMaterialPhoto(editMaterialPhoto, name);
        Object.assign(changes, { photoUrl: uploadedPhotoUrl, imageUrl: uploadedPhotoUrl });
      }
      if (Object.keys(changes).length === 0) {
        handleCancelMaterialEdit();
        return;
      }
      await updateMaterial(editingMaterial.id, changes);
      setMaterials(current => current.map(item => item.id === editingMaterial.id ? { ...item, ...changes } : item));
      handleCancelMaterialEdit();
    });
  };

  const handleMaterialStatus = (material, status) => {
    const action = status === 'archived' ? t('archivar') : status === 'active' ? t('activar') : t('pausar');
    if (!window.confirm(`${t('¿Desea')} ${action} “${material.name}”?`)) return;
    runAction(`material-${material.id}`, async () => {
      await setMaterialStatus(material.id, status);
      setMaterials(current => current.map(item => item.id === material.id ? { ...item, status } : item));
    });
  };

  const handleAddSubMaterial = material => {
    const name = (subMaterialNames[material.id] || '').trim();
    if (!name) return;
    runAction(`sub-create-${material.id}`, async () => {
      const subMaterials = await addSubMaterial(material, name);
      setMaterials(current => current.map(item => item.id === material.id ? { ...item, subMaterials } : item));
      setSubMaterialNames(current => ({ ...current, [material.id]: '' }));
    });
  };

  const handleRenameSubMaterial = (material, subMaterial) => {
    const name = window.prompt(t('Nuevo nombre del submaterial'), subMaterial.name)?.trim();
    if (!name || name === subMaterial.name) return;
    runAction(`sub-${material.id}-${subMaterial.id}`, async () => {
      const subMaterials = await updateSubMaterial(material, subMaterial.id, { name });
      setMaterials(current => current.map(item => item.id === material.id ? { ...item, subMaterials } : item));
    });
  };

  const handleSubMaterialStatus = (material, subMaterial, status) => {
    runAction(`sub-${material.id}-${subMaterial.id}`, async () => {
      const subMaterials = await updateSubMaterial(material, subMaterial.id, { status });
      setMaterials(current => current.map(item => item.id === material.id ? { ...item, subMaterials } : item));
    });
  };

  return (
    <NavigationWrapper>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-8">
        <header className="mb-8 flex flex-col gap-4 pr-28 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">{t('Gestión de Materiales')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              {t('Administre materiales y submateriales sin eliminar el historial de recolección.')}
            </p>
          </div>
          <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {materials.filter(item => item.status === 'active').length} {t('activos')}
          </span>
        </header>

        <section className="mb-6 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur-md">
          <form onSubmit={handleCreateMaterial} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newMaterialName}
              onChange={event => setNewMaterialName(event.target.value)}
              placeholder={t('Nombre del nuevo material')}
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500 transition hover:border-blue-200 hover:bg-blue-50/40">
              <input
                ref={newMaterialPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={event => setNewMaterialPhoto(event.target.files?.[0] || null)}
                className="sr-only"
              />
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{t('Subir foto')}</span>
              <span className="max-w-28 truncate text-xs">{newMaterialPhoto?.name || t('Sin foto')}</span>
            </label>
            <button
              type="submit"
              disabled={!newMaterialName.trim() || saving === 'create-material'}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving === 'create-material' ? t('Guardando...') : `+ ${t('Agregar Material')}`}
            </button>
          </form>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              {t('Use los mismos identificadores y subcategorías predefinidas que Montevideo App.')}
            </p>
            <button
              type="button"
              onClick={handleLoadPresets}
              disabled={saving === 'sync-presets'}
              className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              {saving === 'sync-presets' ? t('Sincronizando...') : t('Cargar valores predefinidos de la App')}
            </button>
          </div>
        </section>

        <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('Buscar materiales o submateriales...')}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <label htmlFor="category-status-filter" className="shrink-0">
            <select
              id="category-status-filter"
              value={filter}
              onChange={event => setFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-gray-700"
            >
              <option value="all">{t('Todos los estados')}</option>
              <option value="active">{t('Activos')}</option>
              <option value="inactive">{t('Pausados')}</option>
              <option value="archived">{t('Archivados')}</option>
            </select>
          </label>
        </section>

        {error && (
          <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><div className="h-12 w-12"><Spinner /></div></div>
        ) : visibleMaterials.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/70 p-12 text-center text-gray-500 shadow-lg">
            {t('No se encontraron materiales.')}
          </div>
        ) : (
          <div className="space-y-4 pb-24">
            {visibleMaterials.map(material => {
              const isExpanded = expanded[material.id];
              const isSaving = saving === `material-${material.id}`;
              return (
                <article
                  key={material.id}
                  className={`overflow-hidden rounded-3xl border shadow-lg backdrop-blur-md ${material.status === 'active' ? 'border-emerald-200 bg-emerald-100/80' : 'border-white/70 bg-white/80'}`}
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setExpanded(current => ({ ...current, [material.id]: !isExpanded }))}
                      className="flex min-w-0 items-center gap-3 text-left"
                      aria-expanded={Boolean(isExpanded)}
                    >
                      <span className={`text-gray-400 transition ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate text-lg font-bold text-gray-800">{material.name}</span>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm ${statusStyles[material.status]}`}>
                            {t(material.status === 'active' ? 'Activo' : material.status === 'inactive' ? 'Pausado' : 'Archivado')}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">{material.subMaterials.length} {t('submateriales')}</span>
                      </span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <button disabled={isSaving} onClick={() => handleStartEditMaterial(material)} className="rounded-lg px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">{t('Editar')}</button>
                      {material.status !== 'active' && <button disabled={isSaving} onClick={() => handleMaterialStatus(material, 'active')} className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">{t('Activar')}</button>}
                      {material.status === 'active' && <button disabled={isSaving} onClick={() => handleMaterialStatus(material, 'inactive')} className="rounded-lg px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50">{t('Pausar')}</button>}
                      {material.status !== 'archived' && <button disabled={isSaving} onClick={() => handleMaterialStatus(material, 'archived')} className="rounded-lg px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100">{t('Archivar')}</button>}
                    </div>
                  </div>

                  {editingMaterial?.id === material.id && (
                    <form onSubmit={handleSaveMaterialEdit} className="border-t border-blue-100 bg-blue-50/60 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          value={editMaterialName}
                          onChange={event => setEditMaterialName(event.target.value)}
                          placeholder={t('Nuevo nombre del material')}
                          maxLength={80}
                          className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                        <label className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-gray-500 transition hover:border-blue-200">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={event => setEditMaterialPhoto(event.target.files?.[0] || null)}
                            className="sr-only"
                          />
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{t('Cambiar foto')}</span>
                          <span className="max-w-32 truncate text-xs">{editMaterialPhoto?.name || t('Mantener foto actual')}</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!editMaterialName.trim() || isSaving}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {isSaving ? t('Guardando...') : t('Guardar')}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleCancelMaterialEdit}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
                          >
                            {t('Cancelar')}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/60 p-5">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={subMaterialNames[material.id] || ''}
                          onChange={event => setSubMaterialNames(current => ({ ...current, [material.id]: event.target.value }))}
                          placeholder={t('Nombre del nuevo submaterial')}
                          maxLength={80}
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubMaterial(material)}
                          disabled={!subMaterialNames[material.id]?.trim() || saving === `sub-create-${material.id}`}
                          className="rounded-xl bg-gray-800 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          + {t('Agregar Submaterial')}
                        </button>
                      </div>

                      {material.subMaterials.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">{t('Este material no tiene submateriales.')}</p>
                      ) : (
                        <ul className="space-y-2">
                          {material.subMaterials.map(subMaterial => (
                            <li key={subMaterial.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`h-2.5 w-2.5 rounded-full ${subMaterial.status === 'active' ? 'bg-emerald-500' : subMaterial.status === 'inactive' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                                <span className="font-semibold text-gray-700">{subMaterial.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleRenameSubMaterial(material, subMaterial)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">{t('Editar')}</button>
                                {subMaterial.status === 'active'
                                  ? <button onClick={() => handleSubMaterialStatus(material, subMaterial, 'inactive')} className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50">{t('Pausar')}</button>
                                  : <button onClick={() => handleSubMaterialStatus(material, subMaterial, 'active')} className="rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">{t('Activar')}</button>}
                                {subMaterial.status !== 'archived' && <button onClick={() => handleSubMaterialStatus(material, subMaterial, 'archived')} className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100">{t('Archivar')}</button>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </NavigationWrapper>
  );
};

export default ActiveMaterials;
