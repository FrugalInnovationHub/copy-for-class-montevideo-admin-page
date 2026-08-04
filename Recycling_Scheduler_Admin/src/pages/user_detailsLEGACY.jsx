import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import logo from "../images/logo.png";
import user_icon from "../images/user_icon.png";
import edit_icon from "../images/edit_icon.png";
import delete_icon from "../images/delete_icon.png";
import Popup from 'reactjs-popup';
import calls from '../api/calls';
import { useParams } from 'react-router-dom';
import Menu from '../components/Menu';
import EditUser from '../components/Popups/EditUser';
import DeleteUser from '../components/Popups/DeleteUser';
import filter from '../helpers/sanitizeData';

/*can add padding to the Pickup Date to fix spacing issue - line 63*/
export default function UserDetails() {
  const [user, setUser] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { userid } = useParams();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await calls.getUser(userid, setUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [userid]);

  const renderUserContent = () => {
    if (!user) {
      return null;
    }

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
                  <img src={user_icon} className="user_icon" alt="User" />
                  <div className="client_info">
                    <div className="client_name">{user.first_name} {user.last_name}</div>
                    <div className="client_contact_info">
                      {user.email}
                      <br /><br />
                      {user.phone}
                      <br /><br />
                      Rol: {filter.roleTranslate(user.role)}
                    </div>
                  </div>
                  <button 
                    className="btn-clear" 
                    onClick={() => setIsEditOpen(true)}
                  >
                    <img src={edit_icon} className="edit_icon" alt="Edit" />
                  </button>
                  <Popup 
                    open={isEditOpen} 
                    closeOnDocumentClick
                  >
                    <EditUser 
                      user={user} 
                      closePopup={setIsEditOpen}
                    />
                  </Popup>
                  <button 
                    className="btn-clear" 
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <img src={delete_icon} className="delete_icon" alt="Delete" />
                  </button>
                  <Popup 
                    open={isDeleteOpen} 
                    closeOnDocumentClick
                  >
                    <DeleteUser 
                      user={user} 
                      closePopup={setIsDeleteOpen}
                    />
                  </Popup>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return renderUserContent() || <></>;
}