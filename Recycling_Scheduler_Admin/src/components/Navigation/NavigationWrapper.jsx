import React from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { Link, useLocation } from 'react-router-dom';

const NavigationWrapper = ({ children }) => {
  const mobileNavigation = useIsMobile();
  return (
    <>
      {mobileNavigation ? (
        <div className='relative h-screen w-screen flex flex-col'>
          <Background>
            <div className="pb-28">
              {children}
            </div>
          </Background>
          <MobileNavBar />
        </div>
      ) : (
        <div className='relative flex flex-row h-screen w-screen overflow-hidden'>
          <NavSideBar />
          <div className='relative flex-1 h-screen overflow-hidden'>
            <Background>
              <div className="pb-12">
                {children}
              </div>
            </Background>
          </div>
        </div>
      )}
    </>
  );
};

const Background = ({ children }) => {
  return (
    <div className='h-screen overflow-y-auto w-full relative z-10'>
      {children}
      <div className='z-[-9] fixed bg-white/30 backdrop-blur-3xl left-0 top-0 h-screen w-screen pointer-events-none' />
      <div className="z-[-10] fixed inset-0 bg-[url('/background_3.jpeg')] left-0 top-0 bg-cover bg-center pointer-events-none" />
    </div>
  );
};

const MobileNavBar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/clients',
      label: 'Clientes',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
        </svg>
      )
    },
    {
      path: '/users',
      label: 'Usuarios',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 21c-2.243 0-4.352-.647-6.124-1.758.757-.88 1.808-1.431 3.003-1.431H14.385a4.125 4.125 0 0 0 0-8.25h-.005A3.75 3.75 0 1 0 9 12.75M12 18.75h.007v.008H12v-.008Z" />
        </svg>
      )
    },
    {
      path: '/materials',
      label: 'Materiales',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      )
    },
    {
      path: '/evidence',
      label: 'Evidencia',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
      )
    },
    {
      path: '/statistic-reports',
      label: 'Estadísticas',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      )
    }
  ];

  return (
    <div className='fixed bottom-5 left-5 right-5 bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 py-3 px-4 flex items-center justify-around'>
      {menuItems.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              active ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600 hover:scale-105'
            }`}
          >
            {item.icon(active)}
            <span className={`text-[10px] mt-1 font-semibold tracking-wide ${active ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

const NavSideBar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/clients',
      label: 'Clientes',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
        </svg>
      )
    },
    {
      path: '/users',
      label: 'Usuarios',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 21c-2.243 0-4.352-.647-6.124-1.758.757-.88 1.808-1.431 3.003-1.431H14.385a4.125 4.125 0 0 0 0-8.25h-.005A3.75 3.75 0 1 0 9 12.75M12 18.75h.007v.008H12v-.008Z" />
        </svg>
      )
    },
    {
      path: '/materials',
      label: 'Materiales',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      )
    },
    {
      path: '/evidence',
      label: 'Evidencia',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
      )
    },
    {
      path: '/statistic-reports',
      label: 'Estadísticas',
      icon: (isActive) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      )
    }
  ];

  return (
    <div className='z-[20] h-screen flex flex-col px-4 py-6 w-64 bg-white/90 backdrop-blur-xl border-r border-gray-100/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0'>
      {/* Top Header Label */}
      <div className="flex flex-col px-3 py-2 mb-6 w-full">
        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Dashboard</span>
        <span className="text-sm font-bold text-blue-600 tracking-wide">Reciclaje Admin</span>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col space-y-1.5 w-full">
        {menuItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-blue-50/70 text-blue-600 shadow-sm border-l-4 border-blue-500 pl-3'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
              }`}
            >
              {item.icon(active)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Brand Logo at the Bottom */}
      <div className="mt-auto pt-6 border-t border-gray-100/60 w-full flex items-center justify-center">
        <div className="h-20 w-full px-3 py-1 rounded-2xl shadow-sm border border-gray-100/50 flex items-center justify-center bg-white">
          <img src='/logo.jpg' alt="Logo" className="h-full w-auto max-w-full object-contain" />
        </div>
      </div>
    </div>
  );
};

export default NavigationWrapper;