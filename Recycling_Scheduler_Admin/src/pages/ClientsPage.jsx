import React, { useEffect, useState } from 'react';
import { createClient, editClient, getClassifications, getClients, getCollectionsByIds } from '../api/calls';
import Spinner from '../components/Navigation/Spinner';
import NavigationWrapper from '../components/Navigation/NavigationWrapper';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ClientsPage = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showAddClientMenu, setShowAddClientMenu] = useState(false);
  const [createClientFormData, setCreateClientFormData] = useState({
    id: crypto.randomUUID(),
    client_name: '',
    pickup_frequency: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    logo_file: '',
    locations: [],
  });

  const handleFetchClients = async () => {
    try {
      setLoading(true);
      await getClients(setClients);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAddClientMenu = () => setShowAddClientMenu(true);

  const handleCloseAddClientMenu = () => {
    setShowAddClientMenu(false);
    setCreateClientFormData({
      id: crypto.randomUUID(),
      client_name: '',
      pickup_frequency: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      logo_file: '',
      locations: [],
    });
  };

  const handleSaveAddClient = async (e) => {
    try {
      e.preventDefault();
      const { client_name } = createClientFormData;
      if (!client_name) return;

      const newClient = { ...createClientFormData };
      setClients(prev => [newClient, ...prev]);

      await createClient(
        {
          id: createClientFormData.id,
          client_name: createClientFormData.client_name,
          pickup_frequency: createClientFormData.pickup_frequency,
          contact_name: createClientFormData.contact_name,
          contact_email: createClientFormData.contact_email,
          contact_phone: createClientFormData.contact_phone,
          logo_file: createClientFormData.logo_file || '',
          locations: createClientFormData.locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            address: loc.address,
            contact_name: loc.contact_name,
            contact_phone: loc.contact_phone,
          })),
        }
      );

      handleCloseAddClientMenu();
    } catch (err) {
      console.error(err);
      setClients(prev => prev.filter(client => client.id !== createClientFormData.id));
      alert('No se pudo crear el cliente. Inténtalo de nuevo.');
    }
  };

  const handleUpdateClient = async (id, updatedData) => {
    const previousClient = clients.find(client => client.id === id);
    try {
      setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updatedData } : c)));
      await editClient(updatedData, id);
    } catch (e) {
      console.error(e);
      if (previousClient) {
        setClients(prev => prev.map(client => (client.id === id ? previousClient : client)));
      }
      alert('No se pudo actualizar el cliente. Inténtalo de nuevo.');
    }
  };

  const downloadCSV = (rows, { filename = 'reporte.csv' } = {}) => {
    if (!rows || !rows.length) return;

    const columns = Array.from(
      rows.reduce((set, r) => {
        Object.keys(r).forEach(k => set.add(k));
        return set;
      }, new Set())
    );

    const esc = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      return /[",\r\n]/.test(s) ? `"${s}"` : s;
    };

    const header = columns.map(esc).join(',');
    const body = rows
      .map(r => columns.map(c => esc(r[c])).join(','))
      .join('\r\n');

    const csv = '\uFEFF' + header + '\r\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tsToISO = (ts) => {
    if (!ts) return '';
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const DEFAULT_EXCLUDE_COLUMNS = [
    'collectionId',
    'updatedAt',
    'id',
    'location',
    'timeStamp',
    'clientId',
  ];

  const prepareReportRows = (classDocs, collById, { exclude = DEFAULT_EXCLUDE_COLUMNS } = {}) => {
    const excludeSet = new Set(exclude);
    const subKeysSet = new Set();
    const classMatIdsSet = new Set();
    const collMatIdsSet = new Set();

    classDocs.forEach(doc => {
      const arr = Array.isArray(doc.classifications) ? doc.classifications : [];
      arr.forEach(({ materialId, subMaterialId }) => {
        if (!materialId || !subMaterialId) return;
        subKeysSet.add(`${materialId}.${subMaterialId}`);
        classMatIdsSet.add(materialId);
      });
    });

    Object.values(collById || {}).forEach(coll => {
      const carr = Array.isArray(coll.collections) ? coll.collections : [];
      carr.forEach(({ materialId }) => {
        if (materialId) collMatIdsSet.add(materialId);
      });
    });

    const subKeys = Array.from(subKeysSet).sort();
    const classMatIds = Array.from(classMatIdsSet).sort();
    const collMatIds = Array.from(collMatIdsSet).sort();

    const safeNum = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);
    const fmt = (n) => (safeNum(n)).toFixed(2);

    return classDocs.map(doc => {
      const row = {};

      Object.entries(doc)
        .filter(([k]) => k !== 'classifications' && !excludeSet.has(k))
        .forEach(([k, v]) => {
          row[k] = (v && typeof v.toDate === 'function') ? tsToISO(v) : v;
        });

      const subTotals = {};
      const matTotals = {};
      let grand = 0;

      const arr = Array.isArray(doc.classifications) ? doc.classifications : [];
      arr.forEach(({ materialId, subMaterialId, weight }) => {
        const w = safeNum(weight);
        const key = `${materialId}.${subMaterialId}`;
        subTotals[key] = (subTotals[key] || 0) + w;
        matTotals[materialId] = (matTotals[materialId] || 0) + w;
        grand += w;
      });

      subKeys.forEach(k => { row[k] = fmt(subTotals[k] || 0); });
      classMatIds.forEach(m => { row[`TOTAL:${m}`] = fmt(matTotals[m] || 0); });
      row['TOTAL:ALL'] = fmt(grand);

      const coll = collById?.[doc.collectionId];
      const collTotals = {};
      let collGrand = 0;
      if (coll && Array.isArray(coll.collections)) {
        coll.collections.forEach(({ materialId, weight }) => {
          const w = safeNum(weight);
          if (!materialId) return;
          collTotals[materialId] = (collTotals[materialId] || 0) + w;
          collGrand += w;
        });
      }

      collMatIds.forEach(m => { row[`COLLECTED:${m}`] = fmt(collTotals[m] || 0); });
      row['COLLECTED:ALL'] = fmt(collGrand);
      row['DIFF:COLLECTED-CLASSIFIED'] = fmt(collGrand - grand);

      excludeSet.forEach(k => { if (k in row) delete row[k]; });

      return row;
    });
  };

  const handleGenerateReport = async (clientId) => {
    try {
      setLoadingReport(true);
      const classDocs = await getClassifications(clientId);

      const collectionIds = Array.from(
        new Set(
          classDocs
            .map(d => d.collectionId)
            .filter(Boolean)
        )
      );
      const collDocs = collectionIds.length
        ? await getCollectionsByIds(collectionIds)
        : [];
      const collById = Object.fromEntries(collDocs.map(c => [c.id, c]));

      const rows = prepareReportRows(classDocs, collById, { exclude: DEFAULT_EXCLUDE_COLUMNS });
      const prettyRows = prettifyRows(rows, { withUnits: false });

      const today = new Date().toISOString().slice(0, 10);
      downloadCSV(prettyRows, {
        filename: `reporte_classifications_${clientId}_${today}.csv`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    handleFetchClients();
  }, []);

  const MATERIAL_LABELS = {
    papel_carton: 'Papel y cartón',
    plasticos: 'Plásticos',
    descarte: 'Descarte',
    organico: 'Orgánico',
    otros: 'Otros',
    otros_reciclables: 'Otros reciclables',
    mezclado: 'Mezclado',
  };

  const SUBMATERIAL_LABELS = {
    papel_carton: {
      carton_color: 'Cartón color',
      carton_corrugado: 'Cartón corrugado',
      papel_blanco: 'Papel blanco',
      papel_color: 'Papel color',
      revista_diario: 'Revista/Diario',
    },
    plasticos: {
      pet_natural: 'PET natural',
    },
    organico: { organico: 'Orgánico' },
    descarte: { descarte: 'Descarte' },
    otros: {
      electronicos: 'Electrónicos',
      latas_aluminio: 'Latas de aluminio',
    },
    mezclado: { mezclado: 'Mezclado' },
  };

  const TOP_FIELD_LABELS = {
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    timeStamp: 'Fecha',
    location: 'Ubicación',
    clientId: 'Cliente',
    collectionId: 'Colección',
    id: 'ID',
  };

  const titleize = (s) =>
    String(s)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const materialLabel = (id) => MATERIAL_LABELS[id] || titleize(id);
  const subMaterialLabel = (mat, sub) =>
    (SUBMATERIAL_LABELS[mat] && SUBMATERIAL_LABELS[mat][sub]) || titleize(sub);

  const prettyColName = (key, { withUnits = false } = {}) => {
    const unit = withUnits ? ' [kg]' : '';

    if (key === 'TOTAL:ALL') return `Clasificado (Total)${unit}`;
    if (key === 'COLLECTED:ALL') return `Recolectado (Total)${unit}`;
    if (key === 'DIFF:COLLECTED-CLASSIFIED') return `Diferencia (Recolectado − Clasificado)${unit}`;

    if (key.startsWith('TOTAL:')) {
      const m = key.split(':')[1];
      return `Clasificado (${materialLabel(m)})${unit}`;
    }
    if (key.startsWith('COLLECTED:')) {
      const m = key.split(':')[1];
      return `Recolectado (${materialLabel(m)})${unit}`;
    }
    if (key.includes('.')) {
      const [m, s] = key.split('.');
      return `${materialLabel(m)} — ${subMaterialLabel(m, s)}${unit}`;
    }

    return TOP_FIELD_LABELS[key] || titleize(key);
  };

  const prettifyRows = (rows, opts = {}) =>
    rows.map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [prettyColName(k, opts), v]))
    );

  return (
    <NavigationWrapper>
      <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-10 relative z-10 w-full">
        {/* Header Block */}
        <div className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Clientes</h1>
              {!loading && (
                <span className="bg-blue-100/80 border border-blue-200/50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {clients.length} Activos
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Administra las cuentas de clientes corporativos, sus frecuencias de recogida y sus sucursales autorizadas.
            </p>
          </div>

          <button
            onClick={handleShowAddClientMenu}
            className="flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Agregar Cliente</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12">
              <Spinner />
            </div>
            <span className="text-sm font-medium text-gray-400">Cargando lista de clientes...</span>
          </div>
        ) : (
          /* Main Card */
          <div className="w-full max-w-5xl bg-white/70 border border-white/60 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden mb-32">
            {clients.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M21 21V12a3 3 0 0 0-3-3h-3.75" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700">No hay clientes registrados</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Utiliza el botón superior para agregar a tus empresas clientes y sus respectivos puntos de recolección.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/70">
                {clients.map(client => (
                  <ClientEntry
                    key={client.id}
                    client={client}
                    loadingReport={loadingReport}
                    generateReport={handleGenerateReport}
                    onUpdate={handleUpdateClient}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Client Modal */}
        {showAddClientMenu && (
          <UpsertClientsModal
            title="Agregar Cliente"
            form={createClientFormData}
            setForm={setCreateClientFormData}
            handleCancel={handleCloseAddClientMenu}
            handleSave={handleSaveAddClient}
          />
        )}
      </div>
    </NavigationWrapper>
  );
};

const ClientEntry = ({ client, generateReport, loadingReport, onUpdate }) => {
  const [showEditUser, setShowEditUser] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...client });
  const [isDownloading, setIsDownloading] = useState(false);

  const handleShowUpdateUserMenu = () => setShowEditUser(true);
  const handleCloseUpdateUserMenu = () => {
    setShowEditUser(false);
    setEditFormData({ ...client });
  };

  const handleSaveEditClient = async (e) => {
    e.preventDefault();
    await onUpdate(client.id, editFormData);
    setShowEditUser(false);
  };

  const handleGenerateReport = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    await generateReport(client.id);
    setIsDownloading(false);
  };

  const getCompanyInitial = () => (client.client_name?.[0] || 'C').toUpperCase();

  const logoUrl = client.logo_file
    ? (client.logo_file.startsWith('http://') || client.logo_file.startsWith('https://')
      ? client.logo_file
      : `${window.location.origin}/${client.logo_file}`)
    : null;

  return (
    <div id={client.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-white/40 transition-colors duration-150">
      {/* Brand & Contact Info */}
      <div className="flex items-start gap-4 min-w-0 md:w-2/5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-lg shadow-md flex-shrink-0 overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={client.client_name}
              className="w-full h-full object-contain p-1 bg-white"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = getCompanyInitial();
              }}
            />
          ) : (
            getCompanyInitial()
          )}
        </div>
        <div className="flex flex-col min-w-0 gap-1">
          <span className="font-extrabold text-gray-800 text-lg tracking-wide leading-snug">
            {client.client_name}
          </span>
          {client.pickup_frequency && (
            <span className="inline-flex items-center self-start bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2 py-0.5 rounded-md mt-0.5">
              Freq: {client.pickup_frequency}
            </span>
          )}
          {client.contact_name && (
            <div className="flex flex-col gap-0.5 mt-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
              <span>Contacto</span>
              <span className="text-gray-600 font-medium normal-case tracking-normal">
                {client.contact_name}
              </span>
            </div>
          )}
          {(client.contact_email || client.contact_phone) && (
            <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
              {client.contact_email && <span className="truncate">{client.contact_email}</span>}
              {client.contact_phone && <span>{client.contact_phone}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Locations Sub-Section */}
      <div className="flex-grow md:w-2/5">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span>Puntos de Recogida ({client?.locations?.length || 0})</span>
        </div>
        {client?.locations?.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {client.locations.map(loc => (
              <div key={loc.id} className="p-2.5 rounded-xl border border-gray-100 bg-white/50 shadow-sm flex flex-col gap-1 text-xs">
                <span className="font-bold text-gray-700 tracking-wide">{loc.name}</span>
                {loc.address && <span className="text-gray-500 leading-normal">{loc.address}</span>}
                {(loc.contact_name || loc.contact_phone) && (
                  <span className="text-gray-400 font-medium">
                    {loc.contact_name} {loc.contact_phone ? `(${loc.contact_phone})` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs italic text-gray-400 block mt-1">No hay sucursales configuradas</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex md:flex-col items-center justify-end gap-3 flex-shrink-0 md:w-1/5 self-center">
        {/* Report Button */}
        <button
          onClick={handleGenerateReport}
          disabled={isDownloading || loadingReport}
          className="p-2.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200/50 shadow-sm flex items-center justify-center cursor-pointer transition-all duration-150"
          title="Descargar Reporte de Clasificación"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          )}
        </button>

        {/* Edit Button */}
        <button
          onClick={handleShowUpdateUserMenu}
          className="p-2.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl border border-gray-100 bg-white hover:border-blue-200/50 shadow-sm flex items-center justify-center cursor-pointer transition-all duration-150"
          title="Editar Cliente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.088a2.25 2.25 0 0 1-1.023.594l-3.32.8 1.012-3.32a2.25 2.25 0 0 1 .593-1.022L16.862 4.487Zm0 0L19.5 7.125" />
          </svg>
        </button>
      </div>

      {/* Edit Client Modal */}
      {showEditUser && (
        <UpsertClientsModal
          title="Actualizar Cliente"
          form={editFormData}
          setForm={setEditFormData}
          handleCancel={handleCloseUpdateUserMenu}
          handleSave={handleSaveEditClient}
        />
      )}
    </div>
  );
};

const UpsertClientsModal = ({ title, form, setForm, handleCancel, handleSave }) => {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleChange = (field) => (e) => {
    setForm({
      ...form,
      [field]: e.target.value,
    });
  };

  const handleLocationChange = (index, field) => (e) => {
    const updatedLocations = form.locations.map((loc, i) =>
      i === index ? { ...loc, [field]: e.target.value } : loc
    );
    setForm({ ...form, locations: updatedLocations });
  };

  const addLocation = () => {
    const newLocation = {
      id: crypto.randomUUID(),
      name: '',
      address: '',
      contact_name: '',
      contact_phone: '',
      client: form.id,
    };
    setForm({ ...form, locations: [...form.locations, newLocation] });
  };

  const removeLocation = (index) => {
    const updated = form.locations.filter((_, i) => i !== index);
    setForm({ ...form, locations: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form
        className="bg-white/95 border border-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-6 md:p-8 w-full max-w-xl relative flex flex-col gap-6 animate-slide-up max-h-[85vh] overflow-y-auto"
        onSubmit={handleSave}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Nombre del Cliente
              <input
                type="text"
                required
                value={form.client_name}
                onChange={handleChange('client_name')}
                placeholder="Ej. McDonald's Montevideo"
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Frecuencia de Recogida
              <input
                type="text"
                value={form.pickup_frequency}
                onChange={handleChange('pickup_frequency')}
                placeholder="Ej. Lun Mar Mié"
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Nombre de Contacto
              <input
                type="text"
                value={form.contact_name}
                onChange={handleChange('contact_name')}
                placeholder="Ej. Carlos Ortiz"
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Correo Electrónico
              <input
                type="email"
                value={form.contact_email || ''}
                onChange={handleChange('contact_email')}
                placeholder="carlos@empresa.com"
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Teléfono de Contacto
              <input
                type="tel"
                value={form.contact_phone || ''}
                onChange={handleChange('contact_phone')}
                placeholder="099 123 456"
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Logo Personalizado del Cliente
              <select
                value={
                  form.logo_file
                    ? (form.logo_file.startsWith('http') ? 'url' : form.logo_file)
                    : ''
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'url') {
                    setForm({ ...form, logo_file: 'https://' });
                  } else {
                    setForm({ ...form, logo_file: val });
                  }
                }}
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold cursor-pointer"
              >
                <option value="">Ninguno (Solo Logo Principal)</option>
                <option value="banco-itau-logo.png">Banco Itaú (banco-itau-logo.png)</option>
                <option value="colegio-san-ignacio-logo.png">Colegio San Ignacio (colegio-san-ignacio-logo.png)</option>
                <option value="scu_logo.png">SCU (scu_logo.png)</option>
                <option value="wtc-logo.png">World Trade Center (wtc-logo.png)</option>
                <option value="url">Dirección URL de Storage...</option>
              </select>
            </label>

            {/* Direct Upload Feature */}
            <div className="bg-gray-50/40 border border-gray-200/60 rounded-2xl p-4 flex flex-col gap-2.5">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Subir Logo Directamente a Firebase Storage</span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      setIsUploadingLogo(true);
                      const timestamp = Date.now();
                      const filename = `logo_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
                      const storageRef = ref(storage, `logos/${filename}`);

                      const snapshot = await uploadBytes(storageRef, file);
                      const downloadURL = await getDownloadURL(snapshot.ref);

                      setForm({ ...form, logo_file: downloadURL });
                      alert("¡Logo subido con éxito a Firebase Storage!");
                    } catch (err) {
                      console.error("Error uploading logo:", err);
                      alert("Error al subir el logo: " + err.message);
                    } finally {
                      setIsUploadingLogo(false);
                    }
                  }}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  disabled={isUploadingLogo}
                />

                {isUploadingLogo && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold animate-pulse shrink-0">
                    <svg className="animate-spin h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subiendo...
                  </span>
                )}
              </div>
            </div>

            {form.logo_file && (form.logo_file.startsWith('http://') || form.logo_file.startsWith('https://')) && (
              <div className="flex flex-col gap-2.5 bg-blue-50/20 border border-blue-100/60 rounded-2xl p-4 mt-1">
                <label className="flex flex-col gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wide">
                  Enlace del Logo en Firebase Storage / Servidor
                  <input
                    type="url"
                    required
                    value={form.logo_file}
                    onChange={handleChange('logo_file')}
                    placeholder="https://firebasestorage.googleapis.com/..."
                    className="w-full bg-white border border-blue-200/80 rounded-xl px-3.5 py-2.5 text-sm text-blue-950 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
                  />
                </label>

                <div className="flex items-center gap-3 bg-white border border-gray-150 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Vista Previa:</span>
                  <img
                    src={form.logo_file}
                    alt="Logo Preview"
                    className="h-10 w-auto object-contain rounded border border-gray-100 p-0.5 bg-gray-50/50"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Locations Section */}
          <div className="mt-4 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-700 tracking-wide">Ubicaciones / Sucursales</span>
              <button
                type="button"
                onClick={addLocation}
                className="flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl px-3.5 py-2 border border-blue-150 transition-all duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Agregar Ubicación</span>
              </button>
            </div>

            {form.locations.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-150 p-6 text-center text-xs italic text-gray-400">
                Ninguna ubicación configurada. Haz clic en "Agregar Ubicación" para registrar una sucursal de entrega.
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[30vh] overflow-y-auto pr-1">
                {form.locations.map((loc, idx) => (
                  <div key={loc.id} className="p-4 bg-gray-50/60 border border-gray-150 rounded-2xl flex flex-col gap-3 relative">
                    <button
                      type="button"
                      onClick={() => removeLocation(idx)}
                      className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors duration-150"
                      title="Eliminar Ubicación"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4.5 w-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m6.956-1.154 1.15 19.517m-14.071 0L1.8 7.846m15.811 0a3 3 0 0 0-3-3M3.7m0 0a3 3 0 0 1 3-3h10.6a3 3 0 0 1 3 3M3.7 9h16.6M10.25 4.5h3.5" />
                      </svg>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-11/12">
                      <label className="flex flex-col gap-1 text-[11px] font-bold text-gray-500 uppercase">
                        Nombre de Ubicación
                        <input
                          type="text"
                          required
                          value={loc.name}
                          onChange={handleLocationChange(idx, 'name')}
                          placeholder="Ej. Sucursal Centro"
                          className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all duration-200 font-semibold"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-[11px] font-bold text-gray-500 uppercase">
                        Dirección
                        <input
                          type="text"
                          required
                          value={loc.address}
                          onChange={handleLocationChange(idx, 'address')}
                          placeholder="Ej. Av. 18 de Julio 1234"
                          className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all duration-200 font-semibold"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-11/12">
                      <label className="flex flex-col gap-1 text-[11px] font-bold text-gray-500 uppercase">
                        Nombre de Contacto
                        <input
                          type="text"
                          value={loc.contact_name}
                          onChange={handleLocationChange(idx, 'contact_name')}
                          placeholder="Ej. Mariana López"
                          className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all duration-200 font-semibold"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-[11px] font-bold text-gray-500 uppercase">
                        Teléfono del Contacto
                        <input
                          type="tel"
                          value={loc.contact_phone || ''}
                          onChange={handleLocationChange(idx, 'contact_phone')}
                          placeholder="Ej. 098 765 432"
                          className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all duration-200 font-semibold"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-150"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-md shadow-blue-500/10 transition-all duration-150"
          >
            {title.includes('Agregar') ? 'Crear' : 'Actualizar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientsPage;
