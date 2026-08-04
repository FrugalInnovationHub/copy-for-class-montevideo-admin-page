import React from 'react'
import { Link } from 'react-router-dom'

const Menu = () => {
  return (
    <div className="leftnav">
      <div className="list">
        <div>
          <Link to={"/clients"}>Clientes</Link>
        </div>
        <div>
          <Link to={"/users"}>Usuarios</Link>
        </div>
        <div>
          <Link to={"/materials"}>Materials</Link>
        </div>
      </div>
    </div>
  )
}

export default Menu
