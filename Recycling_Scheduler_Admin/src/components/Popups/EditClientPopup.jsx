import React, {useState, useEffect, useRef} from 'react'
import calls from '../../api/calls'

const EditClientPopup = ({popupOpen, client}) => {

  const [clientname, setClientName] = useState(client.client_name)
  const [pickup_frequency, setPickupFrequency] = useState([false, false, false, false, false, false])
  const [first_name, setClientContactFirstName] = useState(client.first_name)
  const [last_name, setClientContactLastName] = useState(client.last_name)
  const [contact_email, setclientContactEmail] = useState(client.contact_email)
  const [contact_phone, setClientContactPhone] = useState(client.contact_phone)
  const [locations, setLocations] = useState(client.locations)

  const freqChoices = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

  
  const n = locations.length;

  const genFreq = () => {
    let arr = [false, false, false, false, false, false]
    freqChoices.forEach((choice, i) => {
      if(client.pickup_frequency.includes(choice.substring(0, 3))){
        arr[i] = true
      }
    })

    setPickupFrequency(arr)
    console.log(arr)
  }

  useEffect(() => {
    genFreq()
  }, [])

  const updateLocations = (data, i) => {
    let arr = locations;
    arr[i] = data;
    setLocations(arr)
  }

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
    "client": {
      "client_name":clientname,
      "pickup_frequency": genFreqStr(),
      "first_name": first_name,
      "last_name": last_name,
      "contact_email": contact_email,
      "contact_phone": contact_phone,
      "locations": locations
    }
  }


    const generateLocation = () => {
      if(locations){
      return( locations.map((location, i) => 
        <>
          <LocationItem i={i} updateLocations={updateLocations} location={location} />
        </>
        )
      )
      }

      
    }

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


    useEffect(() => {
      generateLocation()
    }, [])

    const onSubmit = () => {
      calls.editClient(data, client.id)
    }



  return (
    <div className="popup_body">
      <div className="popup">
          <div className="client_info">
          <div className="popup_header">
              <div className="popup_title">Editar Cliente</div>
              <button className="popup_close" onClick={() => popupOpen(false)}>X</button>
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Nombre:</div>
              <input type="text" className="popup_field_input"  onChange={(e) => setClientName(e.target.value)} value={clientname} />
          </div>
          {generateLocation()}

          <button className="add_location_btn" onClick={() => {
            let arr = [...locations]
            arr.push({
              name: "",
              address: "",
              contact_name: "",
              contact_phone: ""
            })
            console.log(locations)
            setLocations(arr)}}>+ Agregar Locacion</button>
          <div className="popup_field">
              <div className="popup_field_title">Frecuencia de Entrega:</div>
              {genFreqButtons()}
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Persona de Contacto:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setClientContactFirstName(e.target.value)} value={first_name} />
          </div>

          <div className="popup_field">
              <div className="popup_field_title">Contacto Apellido:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setClientContactLastName(e.target.value)} value={last_name} />
          </div>

          <div className="popup_field">
              <div className="popup_field_title">Email de contacto:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setclientContactEmail(e.target.value)} value={contact_email} />
          </div>
          <div className="popup_field">
              <div className="popup_field_title">Teléfono de contacto:</div>
              <input type="text" className="pickup_frequency_input" onChange={(e) => setClientContactPhone(e.target.value)} value={contact_phone} />
          </div>
          </div>
          <button className="popup_add_client_btn" onClick={() =>  onSubmit() }>Edit Client</button>
      </div>
  </div>
  )
}

const LocationItem = ({i, updateLocations, location}) => {

  const [name, setName] = useState(location.name)
  const [address, setAddress] = useState(location.address)
  const [contact_name, setContactName] = useState(location.contact_name)
  const [contact_phone, setContactPhone] = useState(location.contact_phone)


  let data
  {location.id ? 
    data = { 
      id: location.id,
      name: name,
      address: address,
      contact_name: contact_name,
      contact_phone: contact_phone
    } : 
    data = { 
      id: null,
      name: name,
      address: address,
      contact_name: contact_name,
      contact_phone: contact_phone
    }
  }

  useEffect(() => {
    updateLocations(data, i)
  }, [name, address, contact_name, contact_phone])

  return (
    <>
        <div className="popup_field">
              <div className="popup_field_title">Locacion {i + 1}:</div>
              <input  onChange={(e) => {
                setName(e.target.value)
                console.log(i)
              }} type="text" className="popup_field_input" value={name} />
        </div>
        <div className='popup_field'>
              <div className="popup_field_title" >Dirrcción {i + 1}:</div>
              <input onChange={(e) => {
                setAddress(e.target.value)
              }} type="text" className="popup_field_input" value={address} />
        </div>
        <div className='popup_field'>
              <div className="popup_field_title" >Locacion Persona de Contacto {i + 1}:</div>
              <input onChange={(e) => {
                setContactName(e.target.value)
              }} type="text" className="popup_field_input" value={contact_name} />
        </div>
        <div className='popup_field'>
              <div className="popup_field_title" >Teléfono de Locacion Persona de Contacto {i + 1} :</div>
              <input onChange={(e) => {
                setContactPhone(e.target.value)
              }} type="text" className="popup_field_input" value={contact_phone} />
        </div>
      </>
  )

}

export default EditClientPopup
