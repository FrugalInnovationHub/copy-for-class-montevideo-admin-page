import React from 'react'
import '../stylesheets/table.css'
import { Link } from 'react-router-dom'

const ClientRow = ({ client }) => {

  const mapLocations = () => {
    return client.locations.map(location =>
      <li>
        {location.address}
      </li>
    )
  }

  return (
    <>
      <td><Link to={`/client_details/${client.id}`}>{client.client_name}</Link></td>
      <td>
        <ul>{mapLocations()}</ul>
      </td>
      <td>{client.avg_usability ? client.avg_usability.toFixed(2) : 0.00}%</td>
      <td>{client.pickup_frequency}</td>
    </>
  )
}

export default ClientRow
