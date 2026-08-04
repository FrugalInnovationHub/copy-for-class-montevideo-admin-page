import React, {useState, useEffect, useRef} from 'react'
import calls from '../../api/calls'

const AddClientPopup = ({ onClose, refreshClients }) => {

  const [locations, setLocations] = useState([{ address: '' }])
  const [response, setResponse] = useState(null)

  const [clientname, setClientName] = useState('')
  const [pickup_frequency, setPickupFrequency] = useState([false, false, false, false, false, false])
  const freqChoices = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const [first_name, setClientContactFirstName] = useState(0)
  const [last_name, setClientContactLastName] = useState(0)
  const [contact_email, setclientContactEmail] = useState('')
  const [contact_phone, setClientContactPhone] = useState('')

  const genFreqStr = () => {
    let returnStr = ''
    pickup_frequency.forEach((choice, i) => {
      if(choice){
        returnStr += freqChoices[i].substring(0, 3)
        returnStr += " "
        console.log(returnStr)
      }
    })

    return returnStr
  }
  
  const data = {
    client_name: clientname,
    pickup_frequency: genFreqStr(),
    locations,
    first_name,
    last_name,
    contact_email,
    contact_phone
  }

  const handleLocationChange = (index, value) => {
    const updatedLocations = [...locations];
    updatedLocations[index] = { address: value };
    setLocations(updatedLocations);
  };

  const generateLocation = () => {
    if (locations.length > 0) {
      return locations.map((location, index) => (
        <div className="popup_field" key={index}>
          <div className="popup_field_title">Location:</div>
          <input 
            type="text" 
            className="popup_field_input"
            value={location?.address || ''}
            onChange={(e) => handleLocationChange(index, e.target.value)}
          />
        </div>
      ));
    }
    // <LocationItem i={i} updateLocations={updateLocations} />
  };

  const handleAddLocation = () => {
    setLocations([...locations, { address: '' }]);
  };

  useEffect(() => {
    generateLocation()
  }, [])

  useEffect(() => {
    if (response?.status === 200) {
      refreshClients();
      onClose(false);
    }
  }, [response]);

  const handleSubmit = async () => {
    try {
      await calls.createClient({ "client": data }, setResponse);
    } catch (error) {
      console.error("Error creating client:", error);
    }
  };

  const genFreqButtons = () => {
    return freqChoices.map((choice, i) => 
      <button 
        className={pickup_frequency[i] ? "selected" : "not-selected"}
        onClick={() =>  {
          let arr = [...pickup_frequency]
          arr[i] = !arr[i]
          setPickupFrequency(arr)
          console.log(pickup_frequency)
        }}
      >{choice}</button>
    )
  }

  return (
    <div className="popup_body">
      <div className="popup">
          <div className="client_info">
          <div className="popup_header">
              <div className="popup_title">Agregar Cliente</div>
              <button className="popup_close" onClick={() => onClose(false)}>X</button>
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Nombre:</div>
              <input type="text" className="popup_field_input"  onChange={(e) => setClientName(e.target.value)}/>
          </div>
          {generateLocation()}

          <button className="add_location_btn" onClick={handleAddLocation}>+ Agregar Locacion</button>
          <div className="popup_field">
              <div className="popup_field_title">Frecuencia de Entrega:</div>
              {genFreqButtons()}
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Persona de Contacto:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setClientContactFirstName(e.target.value)} />
          </div>

          <div className="popup_field">
              <div className="popup_field_title">Contacto Apellido:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setClientContactLastName(e.target.value)} />
          </div>

          <div className="popup_field">
              <div className="popup_field_title">Email de contacto:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setclientContactEmail(e.target.value)} />
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Teléfono de contacto:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setClientContactPhone(e.target.value)} />
          </div>
          </div>
          <button className="popup_add_client_btn" onClick={handleSubmit}>Agregar Cliente</button>
      </div>
  </div>
  )
}

const LocationItem = ({i, updateLocations}) => {

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [contact_name, setContactName] = useState('')
  const [contact_phone, setContactPhone] = useState('')

  const data = {
      name: name,
      address: location,
      contact_name: contact_name,
      contact_phone: contact_phone
  }

  useEffect(() => {
    updateLocations(data, i)
  }, [name, location, contact_name, contact_phone])

  return (
    <>
        <div className="popup_field">
              <div className="popup_field_title">Locacion {i + 1}:</div>
              <input  onChange={(e) => {
                setName(e.target.value)
                console.log(i)
              }} type="text" className="popup_field_input" />
        </div>
        <div className='popup_field'>
              <div className="popup_field_title" >Dirrcción {i + 1}:</div>
              <input onChange={(e) => {
                setLocation(e.target.value)
              }} type="text" className="popup_field_input" />
        </div>
        <div className='popup_field'>
              <div className="popup_field_title" >Location Contact {i + 1}:</div>
              <input onChange={(e) => {
                setContactName(e.target.value)
              }} type="text" className="popup_field_input" />
        </div>
        <div className='popup_field'>
              <div className="popup_field_title" >Location Contact {i + 1} Phone:</div>
              <input onChange={(e) => {
                setContactPhone(e.target.value)
              }} type="text" className="popup_field_input" />
        </div>
      </>
  )

}

export default AddClientPopup
