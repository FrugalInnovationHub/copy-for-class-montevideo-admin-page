import { CSVLink, CSVDownload } from "react-csv";
import { useState, useEffect } from "react";
import filter from "../../helpers/sanitizeData";
import calls from "../../api/calls";
import '../../stylesheets/report.css'

const DownloadReport = ({client, pickups}) => {

  const [csvData, setCsvData] = useState()
  const [pickupArray, setPickupArray] = useState([])
  const [reportReady, setReportReady] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth())


  useEffect(() => {
    getPickupData()
  },[])

  const getPickupData = async() =>{
    setPickupArray(client.pickups)
  }

  const handleSubmit = () => {
    if(client.pickups.length > 0){
      setCsvData(filter.generateMontlhyData(pickupArray, month))
      setReportReady(true)
    }else{
      window.alert("No hay datos para generar reporte")
    }
  }
 

  return (
    <div className="report-popup">
      <h1>Descargar reporte</h1>
      <select onChange={(e) => setMonth(e.target.value)}>
        <option value={0}>enero</option>
        <option value={1}>febrero</option>
        <option value={2}>marzo</option>
        <option value={3}>abril</option>
        <option value={4}>mayo</option>
        <option value={5}>junio</option>
        <option value={6}>julio</option>
        <option value={7}>agosto</option>
        <option value={8}>septiembre</option>
        <option value={9}>octubre</option>
        <option value={10}>noviembre</option>
        <option value={11}>diciembre</option>
      </select>
      <button onClick={() => {
        handleSubmit()
        }}>Generar</button>
        {reportReady ?
        <>
        <br></br>
        <CSVLink data={csvData.data} headers={csvData.headers} filename={`${client.client_name} - ${Number(month) + 1}/${new Date().getFullYear()}.csv`}>
          <button className="download-btn">Descargar reporte</button>
        </CSVLink></> : <></>}
    </div>
  )
}

export default DownloadReport
