import React from 'react'
import { Link } from 'react-router-dom';
import logo from "../images/logo.png";
import user_icon from "../images/user_icon.png";
import Popup from 'reactjs-popup';

export default function Reports() {
    return (
        <>
        <div className="header">
            <img src={logo} className="logo"/>
            <div className="title">Monthly Reports</div>
            <img src={user_icon} className="user_icon"/>
        </div>
        <div className="body">
            <div className="leftnav">
                <div className="list">
                    <div><Link to={'/clients'}>Clients</Link></div>
                    <div><Link to={'/users'}>Users</Link></div>
                    <div><Link to={'/reports'}>Monthly Reports</Link></div>
                    <div>Data Review</div>
                </div>
            </div>
            <div className="table">
                <div className="search_add_btns">
                    <Popup trigger={<button className="create_report_btn"><div className="create_report">+ Create Report</div></button>} /*onClick={reduceOpacity()}*/ closeOnDocumentClick>
                        <div className="popup_body">
                            <div className="popup">
                                <div className="client_info">
                                <div className="popup_header">
                                    <div className="popup_title">Create Report</div>
                                    <button className="popup_close">X</button>
                                </div>
                                <div className="popup_field">
                                    <div className="popup_field_title">Client Name:</div>
                                    <input type="text" className="popup_field_input" />
                                </div>
                                <div className="popup_field">
                                    <div className="popup_field_title">Columns Shown:</div>
                                    <input type="text" className="popup_field_input" />
                                </div>
                                <div className="popup_field">
                                    <div className="popup_field_title">Date Range:</div>
                                    <input type="text" className="popup_field_input" placeholder="XX/XX - XX/XX"/>
                                </div>
                                </div>
                                <button className="popup_add_client_btn">Create Report</button>
                            </div>
                        </div>
                    </Popup>
                </div>
                <div className="row-th">
                    <div className="th">
                        <div>Name</div>
                        <div>Number of Pickups</div>
                        <div>Total Kilos</div>
                        <div>Date Report Sent</div>
                    </div>
                </div>
                <div className="table-rows">
                    <div className="td-top-corners-yellow">
                        <div>Client</div>
                        <div>X</div>
                        <div>X%</div>
                        <div>XX/XX/XX</div>
                    </div>
                    <div className="td-rect-white">
                        <div>Client</div>
                        <div>X</div>
                        <div>X%</div>
                        <div>XX/XX/XX</div>
                    </div>
                    <div className="td-rect-yellow">
                        <div>Client</div>
                        <div>X</div>
                        <div>X%</div>
                        <div>XX/XX/XX</div>
                    </div>
                    <div className="td-rect-white">
                        <div>Client</div>
                        <div>X</div>
                        <div>X%</div>
                        <div>XX/XX/XX</div>
                    </div>
                    <div className="td-rect-yellow">
                        <div>Client</div>
                        <div>X</div>
                        <div>X%</div>
                        <div>XX/XX/XX</div>
                    </div>
                    <div className="td-rect-white">
                        <div>Client</div>
                        <div>X</div>
                        <div>X%</div>
                        <div>XX/XX/XX</div>
                    </div>
                    <div className="td-bottom-corners-yellow">
                        <div>Client</div>
                        <div>X</div>
                        <div>X%</div>
                        <div>XX/XX/XX</div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}