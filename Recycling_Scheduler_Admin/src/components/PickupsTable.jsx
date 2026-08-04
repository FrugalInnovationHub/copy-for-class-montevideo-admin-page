import React, { useState, useEffect } from 'react'
import calls from '../api/calls'
import PickupItem from './PickupItem'

const PickupsTable = ({ pickups }) => {

  const [materials, setMaterials] = useState()

  const cols = []



  const generateRows = () => {
    let rows = pickups.map((pickup) =>
      <>
        <PickupItem pickup={pickup} cols={cols} />
      </>
    )

    return rows
  }

  const generateHeads = () => {
    pickups.forEach(pickup => {
      if (pickup.categories) {
        pickup.categories.forEach(cat => {
          if (!cols.includes(cat.material.name)) {
            cols.push(cat.material.name)
          }
        })
      }
    });
    return cols.map((col) =>
      <th>{col}</th>
    )

  }

  if (pickups.length > 0) {
    return (
      <table className='pickups-table'>
        <thead>
          <tr>
            <th>Estado</th>
            <th>Fecha de Entreg</th>
            <th>Peso Total (kg)</th>
            <th>% Recuperación</th>
            {generateHeads()}
          </tr>
        </thead>
        <tbody>
          {generateRows()}
        </tbody>
      </table>
    )
  } else {
    return (<h1>Sin recogidas</h1>)
  }

}


export default PickupsTable
