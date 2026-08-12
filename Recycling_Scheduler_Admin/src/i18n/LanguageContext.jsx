import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

const translations = [
  ['Administra los perfiles y roles del personal clasificador y recolector del sistema.', 'Manage the profiles and roles of the system’s sorting and collection staff.'],
  ['Utiliza el botón superior para agregar al personal administrativo, receptor o clasificador.', 'Use the button above to add administrators, collectors, or sorters.'],
  ['Esta sección de administración se encuentra en mantenimiento temporal. Estamos diseñando una nueva interfaz simplificada y moderna para gestionar las categorías de reciclaje de forma más ágil.', 'This administration section is temporarily under maintenance. We are designing a simpler, modern interface for managing recycling categories more efficiently.'],
  ['Prueba cambiando los criterios de búsqueda o sube nuevas imágenes.', 'Try changing the search criteria or uploading new images.'],
  ['¿Estás seguro de que deseas eliminar a ', 'Are you sure you want to delete '],
  ['No hay datos de colección para este cliente.', 'There is no collection data for this client.'],
  ['Por favor seleccione un cliente primero.', 'Please select a client first.'],
  ['No se pudo actualizar el cliente. Inténtalo de nuevo.', 'The client could not be updated. Please try again.'],
  ['No se pudo crear el cliente. Inténtalo de nuevo.', 'The client could not be created. Please try again.'],
  ['No se pudo actualizar el usuario. Inténtalo de nuevo.', 'The user could not be updated. Please try again.'],
  ['No se pudo eliminar el usuario. Inténtalo de nuevo.', 'The user could not be deleted. Please try again.'],
  ['No se pudo crear el usuario. Inténtalo de nuevo.', 'The user could not be created. Please try again.'],
  ['Estará disponible en la próxima actualización.', 'It will be available in the next update.'],
  ['Subir Logo Directamente a Firebase Storage', 'Upload Logo Directly to Firebase Storage'],
  ['Descargar Reporte de Clasificación', 'Download Classification Report'],
  ['No hay sucursales configuradas', 'No locations configured'],
  ['Ninguna ubicación configurada. Haz clic en "Agregar Ubicación" para registrar una sucursal de entrega.', 'No locations configured. Click "Add Location" to register a collection branch.'],
  ['No hay clientes registrados', 'No clients registered'],
  ['No hay usuarios registrados', 'No users registered'],
  ['Administra las cuentas de clientes corporativos, sus frecuencias de recogida y sus sucursales autorizadas.', 'Manage corporate client accounts, collection schedules, and authorized locations.'],
  ['Utiliza el botón superior para agregar a tus empresas clientes y sus respectivos puntos de recolección.', 'Use the button above to add client organizations and their collection locations.'],
  ['Cargando lista de clientes...', 'Loading clients...'],
  ['Cargando lista de usuarios...', 'Loading users...'],
  ['Ninguno (Solo Logo Principal)', 'None (Main Logo Only)'],
  ['¡Logo subido con éxito a Firebase Storage!', 'Logo uploaded successfully to Firebase Storage!'],
  ['No hay datos para editar', 'There is no data to edit'],
  ['Error al cargar las evidencias', 'Failed to load entries'],
  ['Seleccione primero un cliente y una ubicación.', 'Please select a Client and Location first.'],
  ['Seleccione al menos una imagen.', 'Please select at least one image.'],
  ['Seleccione una fecha y hora válidas.', 'Please select a valid date and time.'],
  ['No se pueden subir evidencias con una fecha y hora futuras.', 'Cannot upload evidence with a future date and time.'],
  ['¡Carga completada correctamente!', 'Upload successful!'],
  ['Error al subir las evidencias', 'Upload failed'],
  ['¿Descartar los cambios realizados?', 'Discard your changes?'],
  ['Error al generar el resumen:', 'Error generating the summary:'],
  ['Error al subir el logo:', 'Error uploading the logo:'],
  ['Por favor, asegúrate de:', 'Please make sure that:'],
  ['Tener datos de colección cargados', 'Collection data has been loaded'],
  ['Haber seleccionado un cliente', 'A client has been selected'],
  ['Tener configurada la API key (opcional) como VITE_GROQ_API_KEY en tu archivo .env', 'The optional VITE_GROQ_API_KEY is configured in your .env file'],
  ['Revisa la consola para más detalles.', 'Check the console for more details.'],
  ['No se encontraron evidencias.', 'No evidence was found.'],
  ['Sin notas adicionales', 'No additional notes'],
  ['Seleccionar Ubicación', 'Select Location'],
  ['Seleccionar Cliente', 'Select Client'],
  ['-- Seleccionar cliente --', '-- Select client --'],
  ['-- Todos los meses --', '-- All months --'],
  ['Todos los Clientes', 'All Clients'],
  ['Todos los Meses', 'All Months'],
  ['Últimos 12 Meses', 'Last 12 Months'],
  ['Filtrar Evidencias', 'Filter Evidence'],
  ['Gestión de Materiales', 'Materials Management'],
  ['Administre materiales y submateriales sin eliminar el historial de recolección.', 'Manage materials and sub-materials without deleting collection history.'],
  ['No se pudieron cargar los materiales.', 'Materials could not be loaded.'],
  ['No se pudo completar la operación.', 'The operation could not be completed.'],
  ['Ya existe un material con este nombre', 'A material with this name already exists'],
  ['Ya existe un submaterial con este nombre', 'A sub-material with this name already exists'],
  ['El nombre del material es obligatorio', 'Material name is required'],
  ['El nombre del submaterial es obligatorio', 'Sub-material name is required'],
  ['El nombre del material debe contener letras o números', 'Material name must contain letters or numbers'],
  ['El nombre del submaterial debe contener letras o números', 'Sub-material name must contain letters or numbers'],
  ['Nuevo nombre del material', 'New material name'],
  ['Nuevo nombre del submaterial', 'New sub-material name'],
  ['Nombre del nuevo material', 'New material name'],
  ['Nombre del nuevo submaterial', 'New sub-material name'],
  ['Buscar materiales o submateriales...', 'Search materials or sub-materials...'],
  ['Todos los estados', 'All statuses'],
  ['No se encontraron materiales.', 'No materials were found.'],
  ['Este material no tiene submateriales.', 'This material has no sub-materials.'],
  ['Agregar Submaterial', 'Add Sub-material'],
  ['Agregar Material', 'Add Material'],
  ['Guardando...', 'Saving...'],
  ['submateriales', 'sub-materials'],
  ['Pausados', 'Paused'],
  ['Archivados', 'Archived'],
  ['Activo', 'Active'],
  ['Pausado', 'Paused'],
  ['Archivado', 'Archived'],
  ['Activar', 'Activate'],
  ['Pausar', 'Pause'],
  ['Archivar', 'Archive'],
  ['Editar', 'Edit'],
  ['¿Desea', 'Do you want to'],
  ['activar', 'activate'],
  ['pausar', 'pause'],
  ['archivar', 'archive'],
  ['GESTIÓN RESIDUOS', 'WASTE MANAGEMENT'],
  ['INFORME GESTIÓN DE RESIDUOS', 'WASTE MANAGEMENT REPORT'],
  ['Dirección URL de Storage...', 'Storage URL...'],
  ['Ubicaciones / Sucursales', 'Locations / Branches'],
  ['Frecuencia de Recolección', 'Pickup Frequency'],
  ['Frecuencia de Recogida', 'Collection Frequency'],
  ['Enlace del Logo en Firebase Storage / Servidor', 'Logo Link in Firebase Storage / Server'],
  ['Logo Personalizado del Cliente', 'Custom Client Logo'],
  ['Nombre del Cliente', 'Client Name'],
  ['Nombre de Contacto', 'Contact Name'],
  ['Correo Electrónico', 'Email Address'],
  ['Correo de Contacto', 'Contact Email'],
  ['Teléfono de Contacto', 'Contact Phone'],
  ['Teléfono del Contacto', 'Contact Phone'],
  ['Nombre de la Ubicación', 'Location Name'],
  ['Nombre de Ubicación', 'Location Name'],
  ['Dirección', 'Address'],
  ['Agregar Ubicación', 'Add Location'],
  ['Eliminar Ubicación', 'Delete Location'],
  ['Agregar Cliente', 'Add Client'],
  ['Actualizar Cliente', 'Update Client'],
  ['Editar Cliente', 'Edit Client'],
  ['Agregar Usuario', 'Add User'],
  ['Actualizar Usuario', 'Update User'],
  ['Editar Usuario', 'Edit User'],
  ['Seleccionar Rol', 'Select Role'],
  ['Receptor y Clasificador', 'Collector and Sorter'],
  ['Administrador', 'Administrator'],
  ['Clasificador', 'Sorter'],
  ['Receptor', 'Collector'],
  ['Resumen Ejecutivo', 'Executive Summary'],
  ['Resumen Ejecutivo Producido con IA', 'AI-Generated Executive Summary'],
  ['Producido con IA', 'AI-Generated'],
  ['Informes Estadísticos', 'Statistic Reports'],
  ['% CANTIDAD DE RESIDUOS', '% WASTE BY MATERIAL'],
  ['CANTIDAD DE RESIDUOS', 'WASTE QUANTITY'],
  ['kg/mes', 'kg/month'],
  ['Ingrese el resumen ejecutivo...', 'Enter the executive summary...'],
  ['Obtener informe', 'Generate report'],
  ['Editar datos del informe', 'Edit report data'],
  ['Guardar cambios', 'Save changes'],
  ['Cancelar edición', 'Cancel editing'],
  ['Descargar PDF', 'Download PDF'],
  ['(Modo Edición)', '(Edit Mode)'],
  ['(opcional)', '(optional)'],
  ['Notas (opcional)', 'Notes (optional)'],
  ['En Mantenimiento', 'Under Maintenance'],
  ['Reciclaje Admin', 'Recycling Admin'],
  ['Vista Previa:', 'Preview:'],
  ['Abrir Original', 'Open Original'],
  ['Seleccionar imágenes', 'Choose images'],
  ['Ningún archivo seleccionado', 'No files selected'],
  ['archivo seleccionado', 'file selected'],
  ['archivos seleccionados', 'files selected'],
  ['Subir Imágenes', 'Upload Images'],
  ['Subiendo...', 'Uploading...'],
  ['Limpiar', 'Clear'],
  ['Ver detalles', 'View details'],
  ['Cargar Más', 'Load More'],
  ['Sin fecha', 'No date'],
  ['archivo(s)', 'file(s)'],
  ['Registrados', 'Registered'],
  ['Registrado', 'Registered'],
  ['Activos', 'Active'],
  ['Activas', 'Active'],
  ['Clientes', 'Clients'],
  ['Cliente', 'Client'],
  ['Cliente:', 'Client:'],
  ['Usuarios', 'Users'],
  ['Usuario', 'User'],
  ['Materiales', 'Materials'],
  ['Material', 'Material'],
  ['Evidencia', 'Evidence'],
  ['Estadísticas', 'Statistics'],
  ['Contacto', 'Contact'],
  ['Ubicación', 'Location'],
  ['Imágenes', 'Images'],
  ['Imagen', 'Image'],
  ['Detalles', 'Details'],
  ['Fecha', 'Date'],
  ['Notas', 'Notes'],
  ['Nombre', 'First Name'],
  ['Apellido', 'Last Name'],
  ['Rol', 'Role'],
  ['Eliminar', 'Delete'],
  ['Cancelar', 'Cancel'],
  ['Actualizar', 'Update'],
  ['Crear', 'Create'],
  ['Mes:', 'Month:'],
  ['Mes', 'Month'],
  ['Año:', 'Year:'],
  ['Año', 'Year'],
  ['Período', 'Period'],
  ['Colección', 'Collection'],
  ['Papel y cartón', 'Paper and Cardboard'],
  ['Cartón corrugado', 'Corrugated Cardboard'],
  ['Cartón color', 'Colored Cardboard'],
  ['Plásticos', 'Plastics'],
  ['plásticos', 'plastics'],
  ['Orgánicos', 'Organic Waste'],
  ['orgánicos', 'organic waste'],
  ['Orgánico', 'Organic Waste'],
  ['Electrónicos', 'Electronics'],
  ['Descarte', 'Landfill Waste'],
  ['descarte', 'landfill waste'],
  ['Otros reciclables', 'Other Recyclables'],
  ['Otros', 'Other'],
  ['Total', 'Total'],
  ['Promedio', 'Average'],
  ['Tendencia', 'Trend'],
  ['creciente', 'increasing'],
  ['decreciente', 'decreasing'],
  ['estable', 'stable'],
  ['Enero', 'January'],
  ['Febrero', 'February'],
  ['Marzo', 'March'],
  ['Abril', 'April'],
  ['Mayo', 'May'],
  ['Junio', 'June'],
  ['Julio', 'July'],
  ['Agosto', 'August'],
  ['Septiembre', 'September'],
  ['Octubre', 'October'],
  ['Noviembre', 'November'],
  ['Diciembre', 'December'],
  ['ENERO', 'JANUARY'],
  ['FEBRERO', 'FEBRUARY'],
  ['MARZO', 'MARCH'],
  ['ABRIL', 'APRIL'],
  ['MAYO', 'MAY'],
  ['JUNIO', 'JUNE'],
  ['JULIO', 'JULY'],
  ['AGOSTO', 'AUGUST'],
  ['SEPTIEMBRE', 'SEPTEMBER'],
  ['OCTUBRE', 'OCTOBER'],
  ['NOVIEMBRE', 'NOVEMBER'],
  ['DICIEMBRE', 'DECEMBER'],
  ['Todos los meses', 'All months'],
  ['TODOS LOS MESES', 'ALL MONTHS'],
  ['ÚLTIMOS 12 MESES', 'LAST 12 MONTHS'],
  ['No se encontraron recolecciones para este cliente.', 'No collections found for this client.'],
  ['Seleccione un cliente para ver sus datos de recolección.', 'Please select a client to view their collection data.'],
  ['Ej. Lun Mar Mié', 'E.g. Mon Wed Fri'],
  ['Ej. Sucursal Centro', 'E.g. Downtown Branch'],
  ['Ej. Av. 18 de Julio 1234', 'E.g. 1234 Main Street'],
  ['Ej. Mariana López', 'E.g. Mariana Lopez'],
  ['Ej. Pérez', 'E.g. Smith'],
  ['Ej. Juan', 'E.g. John'],
  ['Ej.', 'E.g.'],
].sort(([a], [b]) => b.length - a.length);

const translatedAttributes = ['placeholder', 'title', 'aria-label', 'alt'];
const reverseTranslations = translations
  .map(([spanish, english]) => [english, spanish])
  .sort(([a], [b]) => b.length - a.length);

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceTranslation = (value, source, target) => {
  const startsWithLetter = /^\p{L}/u.test(source);
  const endsWithLetter = /\p{L}$/u.test(source);
  const prefix = startsWithLetter ? '(^|[^\\p{L}])' : '';
  const suffix = endsWithLetter ? '(?![\\p{L}])' : '';
  const pattern = new RegExp(`${prefix}${escapeRegExp(source)}${suffix}`, 'gu');
  return value.replace(pattern, startsWithLetter ? `$1${target}` : target);
};

const repairLegacyTranslationArtifacts = value => value
  .replace(/Cliente{2,}/gu, 'Cliente')
  .replace(/Material(?:es){2,}/gu, 'Materiales')
  .replace(/Contacto{2,}/gu, 'Contacto');

const translateToEnglish = (value) => {
  if (typeof value !== 'string') return value;
  return translations.reduce(
    (translated, [spanish, english]) => replaceTranslation(translated, spanish, english),
    repairLegacyTranslationArtifacts(value),
  );
};

const translateToSpanish = (value) => {
  if (typeof value !== 'string') return value;
  return reverseTranslations.reduce(
    (translated, [english, spanish]) => replaceTranslation(translated, english, spanish),
    repairLegacyTranslationArtifacts(value),
  );
};

const translateValue = (value, language) => (
  language === 'en' ? translateToEnglish(value) : translateToSpanish(value)
);

const translateDocument = (language) => {
  const root = document.getElementById('root');
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (!node.parentElement?.closest('[data-no-translate]')) {
      const current = node.nodeValue;
      const next = translateValue(current, language);
      if (current !== next) node.nodeValue = next;
    }
    node = walker.nextNode();
  }

  root.querySelectorAll('*').forEach(element => {
    if (element.closest('[data-no-translate]')) return;
    translatedAttributes.forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      const next = translateValue(current, language);
      if (current !== next) element.setAttribute(attribute, next);
    });
  });
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('admin-language') || 'es');

  useEffect(() => {
    localStorage.setItem('admin-language', language);
    document.documentElement.lang = language;
    translateDocument(language);

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        translateDocument(language);
      });
    });
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: translatedAttributes,
      });
    }

    const nativeAlert = window.alert;
    const nativeConfirm = window.confirm;
    window.alert = message => nativeAlert(translateValue(String(message), language));
    window.confirm = message => nativeConfirm(translateValue(String(message), language));

    return () => {
      observer.disconnect();
      window.alert = nativeAlert;
      window.confirm = nativeConfirm;
    };
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(current => (current === 'es' ? 'en' : 'es')),
    t: value => translateValue(value, language),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};
