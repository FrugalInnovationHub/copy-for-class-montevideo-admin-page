import React from 'react'
import calls from '../../api/calls'

const DeleteMaterial = ({material, closePopup}) => {

  const handleSubmit = () => {
    calls.deleteMaterial(material.id)
    closePopup(false)
  }

  return (
    <div className="popup_body">
      <div className="popup">
        <div className="popup_header">
            <div className="popup_title">Borrar Material</div>
            <button className="popup_close" onClick={() => closePopup(false)}>X</button>
        </div>
          <p>¿Estás seguro de que quieres eliminar <strong>{material.name}?</strong></p>
          <button className='btn-cancel' onClick={() => closePopup(false)}>Cancelar</button>
          <button className="popup_add_client_btn" onClick={() => handleSubmit()}>Borrar Material</button>
      </div>
    </div>

  )
}

export default DeleteMaterial
