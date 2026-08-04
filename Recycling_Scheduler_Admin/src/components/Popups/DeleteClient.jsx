import React from 'react'
import calls from '../../api/calls'
import { useNavigate } from 'react-router-dom'

const DeleteClient = ({client, closePopup}) => {

  const navigate = useNavigate()

  const handleSubmit = () => {
    calls.deleteClient(client.id)
    navigate('/clients')
  }

  return (
    <div className="popup_body">
      <div className="popup">
        <div className="popup_header">
            <div className="popup_title">Borrir Cliente</div>
            <button className="popup_close" onClick={() => closePopup(false)}>X</button>
        </div>
          <p>¿Estás seguro de que quieres eliminar <strong>{client.client_name}?</strong></p>
          <button className='btn-cancel' onClick={() => closePopup(false)}>Cancelar</button>
          <button className="popup_add_client_btn" onClick={() => handleSubmit()}>Borrir Cliente</button>
      </div>
    </div>
  )
}

export default DeleteClient
