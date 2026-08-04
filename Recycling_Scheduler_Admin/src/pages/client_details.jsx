import React, {useEffect, useRef, useState} from 'react'
import { Link } from 'react-router-dom';
import logo from "../images/logo.png";
import user_icon from "../images/user_icon.png";
import edit_icon from "../images/edit_icon.png";
import delete_icon from "../images/delete_icon.png";
import Popup from 'reactjs-popup';
import calls from '../api/calls';
import PickupsTable from '../components/PickupsTable';
import { useParams } from 'react-router-dom';
import Menu from '../components/Menu';
import filter from '../helpers/sanitizeData';
import DownloadReport from '../components/Popups/DownloadReport';
import DeleteClient from '../components/Popups/DeleteClient';
import EditClientPopup from '../components/Popups/EditClientPopup';

/*can add padding to the Pickup Date to fix spacing issue - line 63*/
export default function ClientDetails() {
  const [client, setClient] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [focusCol, setFocusCol] = useState(null);
  const [isGenerateReport, setIsGenerateReport] = useState(false);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { clientid } = useParams();

  // Combine both useEffect hooks into one
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const clientData = await calls.getClient(clientid, setClient);
        if (clientData?.pickups) {
          setPickups(clientData.pickups);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };

    fetchClientData();
  }, [clientid]);

  const sortFunc = (field) => {
    setFocusCol(field);
    const sorted = filter.sort([...pickups], field);
    
    // Simplified sorting logic
    const isCurrentlySorted = JSON.stringify(pickups) === JSON.stringify(sorted);
    setPickups(isCurrentlySorted ? sorted.reverse() : sorted);
  };

  const renderLocations = () => {
    if (!client?.locations) return null;
    
    return client.locations.map((location, index) => (
      <div key={index}>
        <h4>{location.name} - {location.address}</h4>
        <p>{location.contact_name} {location.contact_phone}</p>
      </div>
    ));
  };

  const renderClientContent = () => {
    if (!client?.client_name) {
      return (
        <div className="client_details">
          <div className="client_info">
            <div className="client_name">Loading...</div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="client_info">
          <div className="client_name">{client.client_name}</div>
          <div className="client_contact_info">
            {client.first_name} {client.last_name}
            <br /><br />
            {client.contact_email}
            <br /><br />
            {client.contact_number}
          </div>
        </div>
        <div className="pickup_info"> 
          Locaciones: {client.locations.length} 
          <button onClick={() => setIsLocationExpanded(!isLocationExpanded)}>
            Expandir
          </button>
          {isLocationExpanded && renderLocations()}
          <br /><br />
          Frecuencia de Entrega: {client.pickup_frequency} por semana
          <br /><br />
          % Recuperación: {Number.isFinite(Number(client.avg_usability)) 
            ? Number(client.avg_usability).toFixed(2) 
            : 'N/A'}%
          <br /><br />
        </div>
        <button className='btn-clear' onClick={() => setIsEditOpen(true)}>
          <img src={edit_icon} className="edit_icon" alt="Edit" />
        </button>
        <Popup open={isEditOpen} closeOnDocumentClick>
          <EditClientPopup client={client} popupOpen={setIsEditOpen} />
        </Popup>
        <button className="btn-clear" onClick={() => setIsDeleteOpen(true)}>
          <img src={delete_icon} className="delete_icon" alt="Delete" />
        </button>
        <Popup open={isDeleteOpen} closeOnDocumentClick>
          <DeleteClient client={client} closePopup={setIsDeleteOpen}/>
        </Popup>
      </>
    );
  };

  return (
    <>
      <div className="header">
        <img src={logo} className="logo" alt="Logo" />
        <div className="title"></div>
        <img src={user_icon} className="user_icon" alt="User" />
      </div>
      <div className="body_client_details">
        <div className="nav_and_client_details">
          <Menu />
          <div className="client_details_and_table">
            <div className="client_details_box">
              <div className="client_details">
                {renderClientContent()}
              </div>
            </div>
          </div>
        </div>
        {client?.pickups?.length > 0 && (
          <button onClick={() => setIsGenerateReport(!isGenerateReport)} className='gen-report'>
            Exportar información
          </button>
        )}
        {isGenerateReport && <DownloadReport client={client} pickups={client.pickups} />}
        <div className='pickups-table-wrapper'>
          <PickupsTable 
            pickups={client?.pickups || []} 
            sortFunc={sortFunc} 
            getFocusCol={() => focusCol} 
          />
        </div>
      </div>
    </>
  );
}