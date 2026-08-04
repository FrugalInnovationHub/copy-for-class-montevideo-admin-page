import React from 'react';
import NavigationWrapper from '../components/Navigation/NavigationWrapper';

const ActiveMaterials = () => {
  return (
    <NavigationWrapper>
      <div className="flex items-center justify-center min-h-[80vh] p-6">
        <div className="bg-white/70 border border-white/60 backdrop-blur-md rounded-3xl p-12 max-w-md text-center shadow-xl flex flex-col items-center gap-6">
          {/* Construction/Maintenance Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100/50 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.67 2.67 0 1 1 13.5 17.25l-5.83-5.83m0 0a2.67 2.67 0 1 1-3.75-3.75 2.67 2.67 0 0 1 3.75 3.75Zm0 0 5.83 5.83M12 3v1.5m6.364.364-1.06 1.06M21 12h-1.5m-.364 6.364-1.06-1.06M12 21v-1.5m-6.364-.364 1.06-1.06M3 12h1.5m.364-6.364 1.06 1.06" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-800 tracking-wide">Gestión de Materiales</h1>
            <p className="text-sm font-semibold text-blue-500 uppercase tracking-widest">En Mantenimiento</p>
          </div>

          <p className="text-gray-500 text-sm leading-relaxed">
            Esta sección de administración se encuentra en mantenimiento temporal. Estamos diseñando una nueva interfaz simplificada y moderna para gestionar las categorías de reciclaje de forma más ágil.
          </p>

          <div className="text-xs text-gray-400 mt-2">
            Estará disponible en la próxima actualización.
          </div>
        </div>
      </div>
    </NavigationWrapper>
  );
};

export default ActiveMaterials;
