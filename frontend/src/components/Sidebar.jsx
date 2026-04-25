import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MdOutlineDashboard,
  MdOutlineCalendarMonth,
  MdOutlinePeopleAlt,
  MdOutlineCampaign,
  MdInfoOutline,
  MdOutlineLogout,
  MdOutlineAssignment,
  MdOutlineCategory,
  MdOutlineBarChart,
  MdOutlineAccountCircle,
  MdAccountBalance,
  MdMenu,
  MdClose,
} from 'react-icons/md';
import '../styles/Sidebar.css';
import ubLogo from '../assets/darkUBlogo.png';
import ccsdLogo from '../assets/ccsdLogo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem('user')) || {};
  const role = savedUser.role || 'counsellor';

  // Close sidebar whenever the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll while sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      {/* Hamburger — only visible on mobile/tablet via CSS */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <MdClose /> : <MdMenu />}
      </button>

      {/* Dark overlay behind sidebar */}
      <div
        className={`sidebar-overlay${isOpen ? ' visible' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <img src={ccsdLogo} alt="CCSD Logo" className="sidebar-ccsd-logo" />
          <img src={ubLogo} alt="UB Logo" className="sidebar-ub-logo" />
        </div>

        {/* Main Menu */}
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

        {/* Admin-only */}
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
            <NavLink to="/manage-about" className="sidebar-link">
              <MdInfoOutline /> About
            </NavLink>
          </div>
        )}

        {/* Account */}
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
    </>
  );
};

export default Sidebar;