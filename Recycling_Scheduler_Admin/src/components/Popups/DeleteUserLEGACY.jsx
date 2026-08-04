import React from 'react'
import calls from '../../api/calls'
import { useNavigate } from 'react-router-dom'


const DeleteUser = ({user, closePopup}) => {

  const navigate = useNavigate()

  const handleSubmit = () => {
    calls.deleteUser(user.id)
    navigate('/users')
  }

  return (
    <div className="popup_body">
      <div className="popup">
        <div className="popup_header">
            <div className="popup_title">Borrar Usuario</div>
            <button className="popup_close" onClick={() => closePopup(false)}>X</button>
        </div>
          <p>¿Estás seguro de que quieres eliminar <strong>{user.first_name} {user.last_name}?</strong></p>
          <button className='btn-cancel' onClick={() => closePopup(false)}>Cancelar</button>
          <button className="popup_add_client_btn" onClick={() => handleSubmit()}>Borrar Usuario</button>
      </div>
    </div>
  )
}

export default DeleteUser
