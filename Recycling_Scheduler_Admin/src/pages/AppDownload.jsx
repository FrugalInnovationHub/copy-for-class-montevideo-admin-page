import React from 'react'
import logo from '../images/logo.png'


const AppDownload = () => {
  return (
    <div className='download-body'>
      <img src={logo} />
      <a href='https://storage.googleapis.com/recyclingdb_cloudbuild/source/MonteRecycle.apk' target="_blank" download="MonteRecycle.apk">
        <button>Descargar aplicación</button>
      </a>
      <style>
      </style>
    </div>
  )
}

export default AppDownload
