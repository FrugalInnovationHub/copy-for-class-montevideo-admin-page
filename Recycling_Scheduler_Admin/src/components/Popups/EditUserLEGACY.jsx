import React, {useState} from 'react'
import calls from '../../api/calls'

const EditUser = ({user, closePopup}) => {

  const [first_name, setFirstName] = useState(user.first_name)
  const [last_name, setLastName] = useState(user.last_name)
  const [role, setRole] = useState(user.role)


  const data = {
    "user": {
      "first_name": first_name,
      "last_name": last_name,
      "role": role,
      "avatar_id": user.avatar_id
    }
  }

  const handleSubmit = () => {
    calls.editUser(data, user.id)
  }

  return (

    <div className="popup_body">
      <div className="popup">
          <div className="client_info">
          <div className="popup_header">
              <div className="popup_title">Editar Usuario</div>
              <button className="popup_close" onClick={() => closePopup(false)}>X</button>
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Nombre:</div>
              <input onChange={(e) => setFirstName(e.target.value)} value={first_name} type="text" className="popup_field_input" />
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Apellido:</div>
              <input onChange={(e) => setLastName(e.target.value)} value={last_name} type="text" className="popup_field_input" />
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Rol:</div>
              <select className="popup_field_input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Administrador</option>
                <option value="collector">Receptor</option>
                <option value="classifier">Clasificador</option>
                <option value="both">Receptor & Clasificador</option>
              </select>
          </div>
          
          </div>
          <button className="popup_add_client_btn" onClick={() => handleSubmit()}>Editar Usuario</button>
      </div>
    </div>

  )
}

export default EditUser
