import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// Using Md (Material Design) and Fi (Feather) which are the most stable sets
import { 
  MdOutlineDashboard, 
  MdOutlineCalendarMonth, 
  MdOutlinePeopleAlt, 
  MdOutlineCampaign, 
  MdOutlineSettings, 
  MdOutlineLogout, 
  MdOutlineAssignment,
  MdOutlineCategory,
  MdOutlineBarChart,
  MdOutlineAccountCircle
} from "react-icons/md";
import './Sidebar.css';
import ubLogo from "../assets/darkUBlogo.png";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={ubLogo} alt="UB Logo" />
      </div>

      <div className="sidebar-section">
        <p className="section-title">Main Menu</p>
        <NavLink to="/dashboard" className="sidebar-link">
          <MdOutlineDashboard /> Dashboard
        </NavLink>
        <NavLink to="/schedules" className="sidebar-link">
          <MdOutlineCalendarMonth /> Schedules
        </NavLink>
        <NavLink to="/referrals" className="sidebar-link">
          <MdOutlineAssignment /> Referrals
        </NavLink>
      </div>

      <div className="sidebar-section">
        <p className="section-title">Manages</p>
        <NavLink to="/manage-counselors" className="sidebar-link">
          <MdOutlinePeopleAlt /> Counselors
        </NavLink>
        <NavLink to="/manage-announcements" className="sidebar-link">
          <MdOutlineCampaign /> Announcements
        </NavLink>
        <NavLink to="/manage-services" className="sidebar-link">
          <MdOutlineCategory /> Services
        </NavLink>
        <NavLink to="/reports" className="sidebar-link">
          <MdOutlineBarChart /> Reports
        </NavLink>
      </div>

      <div className="sidebar-section">
        <p className="section-title">Account</p>
        <NavLink to="/profile" className="sidebar-link">
          <MdOutlineAccountCircle /> Profile
        </NavLink>
        <NavLink to="/settings" className="sidebar-link">
          <MdOutlineSettings /> Settings
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link logout-btn">
          <MdOutlineLogout /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;