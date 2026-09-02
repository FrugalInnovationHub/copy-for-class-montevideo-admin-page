import React, { useState, useEffect } from 'react';
import NavigationWrapper from '../components/Navigation/NavigationWrapper';
import evidenceService from '../services/evidenceService';
import { getClients } from '../api/calls';
import { useLanguage } from '../i18n/LanguageContext';

const toLocalDateTimeInput = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const EvidencePage = () => {
    const { language, t } = useLanguage();
    const locale = language === 'en' ? 'en-US' : 'es-UY';
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    // Form states
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => toLocalDateTimeInput());
    const [notes, setNotes] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Modal state
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Filter states
    const [filterClient, setFilterClient] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                await Promise.all([getClients(setClients), fetchEntries(null)]);
            } catch (error) {
                console.error('Failed to initialize evidence page:', error);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update locations when client changes
    useEffect(() => {
        if (!selectedClient) {
            setLocations([]);
            setSelectedLocation('');
            return;
        }
        const client = clients.find(c => c.id === selectedClient);
        setLocations(client?.locations || []);
        setSelectedLocation('');
    }, [selectedClient, clients]);

    const fetchEntries = async (cursor = undefined) => {
        if (loading) return;
        const queryCursor = cursor !== undefined ? cursor : lastDoc;

        setLoading(true);
        try {
            const data = await evidenceService.getEvidence(queryCursor);
            setHasMore(data.length === 25);

            if (queryCursor === null) {
                setEntries(data);
                if (data.length > 0) {
                    setLastDoc(data[data.length - 1].doc);
                } else {
                    setLastDoc(null);
                }
            } else {
                if (data.length > 0) {
                    setEntries(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const newEntries = data.filter(i => !existingIds.has(i.id));
                        return [...prev, ...newEntries];
                    });
                    setLastDoc(data[data.length - 1].doc);
                } else {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error(error);
            alert(t("Failed to load entries"));
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    const handleUpload = async () => {
        if (!selectedClient || !selectedLocation) {
            alert(t("Please select a Client and Location first."));
            return;
        }

        if (selectedFiles.length === 0) {
            alert(t("Please select at least one image."));
            return;
        }

        const uploadDate = new Date(selectedDate);
        const now = new Date();
        if (Number.isNaN(uploadDate.getTime())) {
            alert(t("Please select a valid date and time."));
            return;
        }
        if (uploadDate > now) {
            alert(t("Cannot upload evidence with a future date and time."));
            return;
        }

        setUploading(true);
        try {
            await evidenceService.uploadEvidence(
                selectedFiles,
                {
                    clientId: selectedClient,
                    locationId: selectedLocation,
                    notes: notes
                },
                new Date(selectedDate)
            );
            alert(t("Upload successful!"));

            // Reset form
            setSelectedFiles([]);
            setNotes('');
            setSelectedDate(toLocalDateTimeInput());
            // Reset file input
            const fileInput = document.getElementById('evidence-file-input');
            if (fileInput) fileInput.value = '';

            // Reload data
            fetchEntries(null);
        } catch (error) {
            console.error(error);
            alert(t("Upload failed"));
        } finally {
            setUploading(false);
        }
    };

    // Derived available months from ALL entries for the filter dropdown
    const availableMonths = Array.from(new Set(entries.map(entry => {
        const date = entry.dateTime || entry.createdAt;
        if (!date) return null;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean))).sort().reverse();

    // Filtered entries based on filter state
    const filteredEntries = entries.filter(entry => {
        if (filterClient && entry.clientId !== filterClient) return false;
        if (filterMonth) {
            const date = entry.dateTime || entry.createdAt;
            if (!date) return false;
            const entryMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (entryMonth !== filterMonth) return false;
        }
        return true;
    });

    // Group filtered entries by month
    const groupedEntries = filteredEntries.reduce((acc, entry) => {
        const date = entry.dateTime || entry.createdAt;
        if (!date) return acc;
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[month]) acc[month] = [];
        acc[month].push(entry);
        return acc;
    }, {});

    // Helper to get client/location names
    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client?.client_name || clientId;
    };

    const getLocationName = (clientId, locationId) => {
        const client = clients.find(c => c.id === clientId);
        const location = client?.locations?.find(l => l.id === locationId);
        return location?.name || locationId;
    };

    // Helper to format "YYYY-MM" to "Month, Year" (e.g. "Mayo, 2026")
    const formatHeaderMonth = (monthStr) => {
        if (!monthStr || !monthStr.includes('-')) return monthStr;
        const [year, month] = monthStr.split('-').map(Number);
        const formatted = new Intl.DateTimeFormat(locale, {
            month: 'long',
            year: 'numeric',
        }).format(new Date(year, month - 1, 1));
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    // Helper to get images array from entry (supports both old and new schema)
    const getEntryImages = (entry) => {
        if (Array.isArray(entry.images) && entry.images.length > 0) {
            return entry.images;
        }
        // Fallback for old schema with single imageUrl
        if (entry.imageUrl) {
            return [entry.imageUrl];
        }
        return [];
    };

    const openModal = (entry, imageIndex = 0) => {
        setSelectedEntry(entry);
        setCurrentImageIndex(imageIndex);
    };

    const closeModal = () => {
        setSelectedEntry(null);
        setCurrentImageIndex(0);
    };

    return (
        <NavigationWrapper>
            <div className='pt-12 w-full flex items-center justify-center min-h-screen'>
                <div className="flex flex-col w-11/12 md:w-5/6">
                    {/* Header */}
                    <div className="mb-6 text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl text-black/70 font-bold">{t('Evidencia')}</h1>
                    </div>

                    {/* Upload Section */}
                    <div className="mb-10">
                        <div className="w-full flex flex-col gap-4 bg-white/40 border border-white/50 p-6 rounded-3xl shadow-xl backdrop-blur-md">
                            {/* Row 1: Client, Location, Date */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <select
                                    className="p-2.5 border border-gray-200 rounded-xl bg-white/90 w-full md:flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 shadow-sm"
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                >
                                    <option value="">{t('Seleccionar Cliente')}</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.client_name}</option>
                                    ))}
                                </select>

                                <select
                                    className="p-2.5 border border-gray-200 rounded-xl bg-white/90 w-full md:flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 shadow-sm"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    disabled={!selectedClient}
                                >
                                    <option value="">{t('Seleccionar Ubicación')}</option>
                                    {locations.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.name} {l.address ? `(${l.address})` : ''}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="datetime-local"
                                    className="p-2.5 border border-gray-200 rounded-xl bg-white/90 w-full md:w-auto md:min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 shadow-sm"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            {/* Row 2: Notes */}
                            <textarea
                                className="p-2.5 border border-gray-200 rounded-xl bg-white/90 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 shadow-sm resize-none"
                                placeholder={t('Notas (opcional)')}
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />

                            {/* Row 3: File Selection and Upload Button */}
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex-1 w-full">
                                    <input
                                        id="evidence-file-input"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="sr-only"
                                    />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <label
                                            htmlFor="evidence-file-input"
                                            className="inline-flex cursor-pointer items-center rounded-full bg-black/10 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-black/20 focus-within:ring-2 focus-within:ring-blue-500"
                                        >
                                            {t('Seleccionar imágenes')}
                                        </label>
                                        <span className="text-sm text-gray-500">
                                            {selectedFiles.length === 0
                                                ? t('Ningún archivo seleccionado')
                                                : `${selectedFiles.length} ${t(selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados')}`}
                                        </span>
                                    </div>
                                    {selectedFiles.length > 0 && (
                                        <p className="sr-only" aria-live="polite">
                                            {selectedFiles.length} {t('archivos seleccionados')}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedClient || !selectedLocation || selectedFiles.length === 0 || uploading}
                                    className={`px-6 py-2.5 rounded-full text-white font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center min-w-[160px] ${selectedClient && selectedLocation && selectedFiles.length > 0 && !uploading
                                        ? 'bg-black/70 hover:bg-black/80'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {uploading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('Subiendo...')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                            </svg>
                                            {t('Subir Imágenes')}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className='flex flex-col w-full bg-white/20 border-[1px] border-black/40 rounded-3xl mb-32 shadow-xl shadow-black/30 p-8 min-h-[500px]'>
                        
                        {/* Filters Bar */}
                        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-inner">
                            <div className="flex flex-row items-center gap-2 text-gray-700 font-semibold self-start md:self-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                                </svg>
                                <span>{t('Filtrar Evidencias')}</span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                                {/* Filter by Client */}
                                <select
                                    className="p-2 border border-gray-200/80 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 text-sm shadow-sm min-w-[180px]"
                                    value={filterClient}
                                    onChange={(e) => setFilterClient(e.target.value)}
                                >
                                    <option value="">{t('Todos los Clientes')}</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.client_name}</option>
                                    ))}
                                </select>

                                {/* Filter by Month */}
                                <select
                                    className="p-2 border border-gray-200/80 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 text-sm shadow-sm min-w-[150px]"
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                >
                                    <option value="">{t('Todos los Meses')}</option>
                                    {availableMonths.map(m => (
                                        <option key={m} value={m}>{formatHeaderMonth(m)}</option>
                                    ))}
                                </select>

                                {/* Clear Filters Button */}
                                {(filterClient || filterMonth) && (
                                    <button
                                        onClick={() => {
                                            setFilterClient('');
                                            setFilterMonth('');
                                        }}
                                        className="px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-red-200/30 flex items-center justify-center gap-1 shadow-sm bg-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                        {t('Limpiar')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {Object.keys(groupedEntries).length === 0 && !loading && (
                            <div className='text-center text-gray-500 py-20'>
                                <p className="text-xl">{t('No se encontraron evidencias.')}</p>
                                <p className="text-sm mt-2">{t('Prueba cambiando los criterios de búsqueda o sube nuevas imágenes.')}</p>
                            </div>
                        )}

                        {Object.entries(groupedEntries).map(([month, monthEntries]) => (
                            <div key={month} className='mb-8 last:mb-0'>
                                <h2 className='text-xl font-semibold mb-4 text-gray-700 border-b border-gray-300/50 pb-2'>{formatHeaderMonth(month)}</h2>
                                <div className='flex flex-col gap-4'>
                                    {monthEntries.map(entry => {
                                        const images = getEntryImages(entry);
                                        console.log(`Entry ${entry.id} thumbnail:`, images[0]);
                                        return (
                                            <div
                                                key={entry.id}
                                                className='group flex flex-row items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-white/70 hover:bg-white/95 border border-white/60 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer backdrop-blur-md items-stretch'
                                                onClick={() => openModal(entry)}
                                            >
                                                {/* Left: Image box */}
                                                <div className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-gray-50 border border-gray-100">
                                                    <img
                                                        src={images[0] || ''}
                                                        alt="Evidence Thumbnail"
                                                        loading="lazy"
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    {images.length > 1 && (
                                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                            <span>{images.length}</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Details */}
                                                <div className="flex flex-col flex-1 justify-between min-w-0 py-1">
                                                    <div>
                                                        {/* Client & Date Row */}
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                                {getClientName(entry.clientId)}
                                                            </span>
                                                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                                                </svg>
                                                                {entry.dateTime ? entry.dateTime.toLocaleDateString(locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : t('Sin fecha')} - {entry.dateTime ? entry.dateTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : ''}
                                                            </span>
                                                        </div>

                                                        {/* Location Row */}
                                                        <div className="flex items-start gap-1 text-gray-700 font-medium text-sm sm:text-base mb-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                            </svg>
                                                            <span className="truncate">{getLocationName(entry.clientId, entry.locationId)}</span>
                                                        </div>

                                                        {/* Notes */}
                                                        {entry.notes ? (
                                                            <p className="text-xs sm:text-sm text-gray-500 italic line-clamp-2 mt-1 sm:mt-1.5 pl-5 border-l-2 border-gray-200">
                                                                {entry.notes}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs sm:text-sm text-gray-400 italic mt-1 sm:mt-1.5 pl-5 border-l-2 border-gray-100">
                                                                {t('Sin notas adicionales')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Card Footer */}
                                                    <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-100/50">
                                                        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:text-blue-700 transition-colors">
                                                            {t('Ver detalles')}
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-center items-center py-20">
                                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}

                        {!loading && entries.length > 0 && hasMore && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={() => fetchEntries()}
                                    className="px-6 py-2 bg-white/50 hover:bg-white/80 rounded-full text-gray-700 font-medium transition-colors shadow-sm"
                                >
                                    {t('Cargar Más')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Entry Modal with Image Carousel */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={closeModal}>
                    <div className="bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Image Area */}
                        <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-4 relative">
                            <img
                                src={getEntryImages(selectedEntry)[currentImageIndex] || ''}
                                alt={`Evidence ${currentImageIndex + 1}`}
                                className="max-w-full max-h-[70vh] object-contain drop-shadow-lg"
                            />
                            {/* Image Navigation */}
                            {getEntryImages(selectedEntry).length > 1 && (
                                <div className="flex items-center gap-4 mt-4">
                                    <button
                                        onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                                        disabled={currentImageIndex === 0}
                                        className="p-2 rounded-full bg-black/50 text-white disabled:opacity-30"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className="text-gray-600 font-medium">
                                        {currentImageIndex + 1} / {getEntryImages(selectedEntry).length}
                                    </span>
                                    <button
                                        onClick={() => setCurrentImageIndex(i => Math.min(getEntryImages(selectedEntry).length - 1, i + 1))}
                                        disabled={currentImageIndex === getEntryImages(selectedEntry).length - 1}
                                        className="p-2 rounded-full bg-black/50 text-white disabled:opacity-30"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Details Panel */}
                        <div className="w-full md:w-96 p-8 flex flex-col border-l border-gray-100 bg-white">
                            <div className="flex justify-between items-start mb-8">
                                <h2 className="text-2xl font-bold text-gray-800">{t('Detalles')}</h2>
                                <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto">
                                <div className="border-b border-gray-100 pb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Fecha')}</label>
                                    <p className="text-gray-900 text-lg mt-1">
                                        {selectedEntry.dateTime?.toLocaleString(locale) || 'N/A'}
                                    </p>
                                </div>
                                <div className="border-b border-gray-100 pb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Cliente')}</label>
                                    <p className="text-gray-900 font-medium text-lg mt-1">
                                        {getClientName(selectedEntry.clientId)}
                                    </p>
                                </div>
                                <div className="border-b border-gray-100 pb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Ubicación')}</label>
                                    <p className="text-gray-900 text-lg mt-1">
                                        {getLocationName(selectedEntry.clientId, selectedEntry.locationId)}
                                    </p>
                                </div>
                                {selectedEntry.notes && (
                                    <div className="border-b border-gray-100 pb-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Notas')}</label>
                                        <p className="text-gray-900 text-lg mt-1">{selectedEntry.notes}</p>
                                    </div>
                                )}
                                <div className="border-b border-gray-100 pb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Imágenes')}</label>
                                    <p className="text-gray-900 text-lg mt-1">
                                        {getEntryImages(selectedEntry).length} {t('archivo(s)')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-8">
                                <a
                                    href={getEntryImages(selectedEntry)[currentImageIndex] || ''}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-3 px-4 bg-black text-white hover:bg-gray-800 text-center rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {t('Abrir Original')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </NavigationWrapper>
    );
};

export default EvidencePage;
