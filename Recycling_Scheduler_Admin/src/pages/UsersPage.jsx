import React, { useState, useEffect } from 'react';
import NavigationWrapper from '../components/Navigation/NavigationWrapper';
import calls from '../api/calls';
import Spinner from '../components/Navigation/Spinner';

const ROLE_LABELS_ES = {
  admin: 'Administrador',
  collector: 'Receptor',
  classifier: 'Clasificador',
  both: 'Receptor y Clasificador',
};

const ROLE_BADGE_STYLES = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200/60',
  collector: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  classifier: 'bg-amber-50 text-amber-700 border-amber-200/60',
  both: 'bg-sky-50 text-sky-700 border-sky-200/60',
};

const UsersPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showAddUserMenu, setShowAddUserMenu] = useState(false);
  const [createUserFormData, setCreateUserFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    id: crypto.randomUUID(),
  });

  const handleFetchUsers = async () => {
    try {
      setLoading(true);
      await calls.getUsers(setUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (id, updatedData) => {
    const previousUser = users.find(user => user.id === id);
    try {
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updatedData } : u)));
      await calls.editUser(updatedData, id);
    } catch (e) {
      console.error(e);
      if (previousUser) {
        setUsers(prev => prev.map(user => (user.id === id ? previousUser : user)));
      }
      alert('No se pudo actualizar el usuario. Inténtalo de nuevo.');
    }
  };

  const handleDeleteUser = async (id) => {
    const previousUsers = users;
    try {
      setUsers(prev => prev.filter(u => u.id !== id));
      await calls.deleteUser(id);
    } catch (e) {
      console.error(e);
      setUsers(previousUsers);
      alert('No se pudo eliminar el usuario. Inténtalo de nuevo.');
    }
  };

  const handleShowAddUserMenu = () => setShowAddUserMenu(true);

  const handleCloseAddUserMenu = () => {
    setShowAddUserMenu(false);
    setCreateUserFormData({
      first_name: '',
      last_name: '',
      role: '',
      id: crypto.randomUUID(),
    });
  };

  const handleSaveAddUserMenu = async (e) => {
    try {
      e.preventDefault();
      const { first_name, last_name, role } = createUserFormData;
      if (!first_name || !last_name || !role) return;

      const newUser = { ...createUserFormData };
      setUsers(prev => [newUser, ...prev]);
      await calls.createUser(newUser);
      handleCloseAddUserMenu();
    } catch (e) {
      console.error(e);
      setUsers(prev => prev.filter(user => user.id !== createUserFormData.id));
      alert('No se pudo crear el usuario. Inténtalo de nuevo.');
    }
  };

  useEffect(() => {
    handleFetchUsers();
  }, []);

  return (
    <NavigationWrapper>
      <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-10 relative z-10 w-full">
        {/* Header Block */}
        <div className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Usuarios</h1>
              {!loading && (
                <span className="bg-blue-100/80 border border-blue-200/50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {users.length} Registrados
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Administra los perfiles y roles del personal clasificador y recolector del sistema.
            </p>
          </div>

          <button
            onClick={handleShowAddUserMenu}
            className="flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Agregar Usuario</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12">
              <Spinner />
            </div>
            <span className="text-sm font-medium text-gray-400">Cargando lista de usuarios...</span>
          </div>
        ) : (
          /* Main Card */
          <div className="w-full max-w-5xl bg-white/70 border border-white/60 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden mb-32">
            {users.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m0 0a8.967 8.967 0 0 1-3.741-.479 3 3 0 0 1 4.682-2.72m0 4.418.001.03c0 .228-.015.451-.044.673a11.952 11.952 0 0 1-2.912-1.905m.75.105c-.013-.19-.02-.381-.02-.572a6.002 6.002 0 0 1-2.083-4.57 3.003 3.003 0 0 1 4.567-2.61m9.983 2.61a6 6 0 0 1-2.082 4.57c-.002.191-.01.382-.02.572" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700">No hay usuarios registrados</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Utiliza el botón superior para agregar al personal administrativo, receptor o clasificador.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/70">
                {users.map(user => (
                  <UserEntry
                    key={user.id}
                    user={user}
                    onUpdate={handleUpdateUser}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserMenu && (
          <UpsertUserModal
            title="Agregar Usuario"
            form={createUserFormData}
            setForm={setCreateUserFormData}
            handleCancel={handleCloseAddUserMenu}
            handleSave={handleSaveAddUserMenu}
          />
        )}
      </div>
    </NavigationWrapper>
  );
};

const UserEntry = ({ user, onUpdate, onDelete }) => {
  const [showEditUser, setShowEditUser] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...user });

  const handleShowUpdateUserMenu = () => setShowEditUser(true);
  const handleCloseUpdateUserMenu = () => {
    setShowEditUser(false);
    setEditFormData({ ...user });
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    await onUpdate(user.id, editFormData);
    setShowEditUser(false);
  };

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    if (confirm(`¿Estás seguro de que deseas eliminar a ${user.first_name}?`)) {
      await onDelete(user.id);
      setShowEditUser(false);
    }
  };

  const roleToSpanish = (role) => (role && ROLE_LABELS_ES[role]) || role || '';
  const getInitials = () => `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  const getBadgeStyle = () => ROLE_BADGE_STYLES[user.role] || 'bg-gray-50 text-gray-700 border-gray-200/60';

  return (
    <div id={user.id} className="p-5 flex items-center justify-between hover:bg-white/40 transition-colors duration-150">
      <div className="flex items-center gap-4 min-w-0">
        {/* User initials Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/15 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm flex-shrink-0">
          {getInitials()}
        </div>

        {/* User Name & Role badge */}
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-gray-800 tracking-wide text-base">
            {user.first_name} {user.last_name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${getBadgeStyle()}`}>
              {roleToSpanish(user.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Trigger */}
      <button
        onClick={handleShowUpdateUserMenu}
        className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-xl cursor-pointer transition-colors duration-150"
        title="Editar Usuario"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.088a2.25 2.25 0 0 1-1.023.594l-3.32.8 1.012-3.32a2.25 2.25 0 0 1 .593-1.022L16.862 4.487Zm0 0L19.5 7.125" />
        </svg>
      </button>

      {/* Edit User Modal */}
      {showEditUser && (
        <UpsertUserModal
          title="Actualizar Usuario"
          form={editFormData}
          setForm={setEditFormData}
          handleCancel={handleCloseUpdateUserMenu}
          handleSave={handleSaveEditUser}
          handleDelete={handleDeleteUser}
        />
      )}
    </div>
  );
};

const UpsertUserModal = ({ title, form, setForm, handleCancel, handleSave, handleDelete }) => {
  const handleChange = field => e => {
    setForm({
      ...form,
      [field]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form
        className="bg-white/95 border border-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-6 md:p-8 w-full max-w-md relative flex flex-col gap-5 animate-slide-up"
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
          <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
            Nombre
            <input
              type="text"
              required
              value={form.first_name}
              onChange={handleChange('first_name')}
              placeholder="Ej. Juan"
              className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
            Apellido
            <input
              type="text"
              required
              value={form.last_name}
              onChange={handleChange('last_name')}
              placeholder="Ej. Pérez"
              className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
            Rol
            <select
              required
              value={form.role}
              onChange={handleChange('role')}
              className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold cursor-pointer"
            >
              <option value="" disabled>Seleccionar Rol</option>
              {Object.entries(ROLE_LABELS_ES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-2">
          {handleDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-semibold cursor-pointer transition-colors duration-150 p-2 hover:bg-red-50 rounded-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m6.956-1.154 1.15 19.517m-14.071 0L1.8 7.846m15.811 0a3 3 0 0 0-3-3M3.7m0 0a3 3 0 0 1 3-3h10.6a3 3 0 0 1 3 3M3.7 9h16.6M10.25 4.5h3.5" />
              </svg>
              <span>Eliminar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
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
        </div>
      </form>
    </div>
  );
};

export default UsersPage;
