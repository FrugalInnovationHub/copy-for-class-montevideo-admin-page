import React from 'react'
import { Link } from 'react-router-dom'
import '../stylesheets/table.css'
import filter from '../helpers/sanitizeData'


const UsersTable = ({users}) => {
  console.log(users, "users")
  const mapUsers = () => {
    return(users && users.users && users.users.map((user) => 
      <tr>
        <Link to={`/user_details/${user.id}`}><td className='user-name'>{user.first_name} {user.last_name}</td></Link>
        <td>{filter.roleTranslate(user.role)}</td>
      </tr>
    ))
  }


  return (
    <table className='users-table'>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Rol</th>
        </tr>
      </thead>
      <tbody>
        {mapUsers()}
      </tbody>
    </table>
  )
}

export default UsersTable
