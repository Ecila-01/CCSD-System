import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  MdOutlineAccountCircle,
  MdAccountBalance
} from "react-icons/md";
import '../styles/Sidebar.css';
import ubLogo from "../assets/darkUBlogo.png";
import ccsdLogo from "../assets/ccsdLogo.png"; // add this line

const Sidebar = () => {
  const navigate = useNavigate();

  // Grab the user data from local storage
  const savedUser = JSON.parse(localStorage.getItem("user")) || {};
  const role = savedUser.role || "counsellor"; // Fallback to counsellor

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
         <img src={ccsdLogo} alt="CCSD Logo" className="sidebar-ccsd-logo" />
  <img src={ubLogo} alt="UB Logo" className="sidebar-ub-logo" />
 
</div>

      {/* SHARED SECTION: Both Admins and Counselors see the Main Menu */}
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
        <NavLink to="/reports" className="sidebar-link">
            <MdOutlineBarChart /> Reports
        </NavLink>
      </div>

      {/* ADMIN EXCLUSIVE SECTION: Only Admins see the Management tools */}
      {role === 'admin' && (
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
          <NavLink to="/departments" className="sidebar-link">
            <MdAccountBalance /> Departments
          </NavLink>
        </div>
      )}

      {/* SHARED SECTION: Both Admins and Counselors see their Account settings */}
      <div className="sidebar-section">
        <p className="section-title">Account</p>
        <NavLink to="/profile" className="sidebar-link">
          <MdOutlineAccountCircle /> Profile
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link logout-btn">
          <MdOutlineLogout /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;