import "./App.css";
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import axios from 'axios';



// Page & Component Imports
import Home from "./pages/Home"; // Imported the new separate file
import Services from "./pages/Services";
import About from "./pages/About";
import Navbar from "./Navbar";
import Dashboard from "./pages/Dashboard";
import Schedules from "./pages/Schedules";
import Referrals from "./pages/Referrals";
import ManageServices from './pages/ManageServices';
import ManageAnnouncements from "./pages/ManageAnnouncements";
import ManageCounselors from "./pages/ManageCounselors";
import Profile from "./pages/Profile";
import GuestRequestView from "./pages/GuestRequestView";
import ManageDepartments from './pages/ManageDepartments';
import Reports from "./pages/Reports";
import ManageAbout from "./pages/ManageAbout";
import Settings from "./pages/Settings";
import ManageCareers from "./pages/ManageCareers";
import Careers from "./pages/Careers";

// Global bouncer: If the backend returns 401 (Unauthorized), force logout
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = "/"; // Hard redirect to home
    }
    return Promise.reject(error);
  }
);
//for auto logout
const useAutoLogout = (timeoutInMinutes = 120) => {
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.clear(); // Clear token and user data
    navigate('/');        // Redirect to login/home
    alert("Session expired due to inactivity.");
  }, [navigate]);

  useEffect(() => {
    const timeoutMs = timeoutInMinutes * 60 * 1000;
    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(logout, timeoutMs);
    };

    // Events that signal the user is still there
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    resetTimer();
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [logout, timeoutInMinutes]);
};

// Helper component for security
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user")); // Or however you store auth
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/" replace />; // Send to home/login if not logged in
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />; // Send to dashboard if unauthorized for that page
  }

  return children;
};

function Footer() {
  return (
    <footer className="footerBar">
      <div className="footerItem">📍 F Bldg. 2nd Floor, F206</div>
      <div className="footerItem">🕒 M-W-Th-Sat 8:00am - 5:00pm</div>
      <div className="footerItem">ⓕ facebook.com/ubccsd</div>
      <div className="footerItem">✉ ccsd@e.ubaguio.edu</div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  useAutoLogout(240)
  // Logic to hide public nav/footer on admin pages
  const appPages = [
    "/dashboard", 
    "/schedules", 
    "/referrals", 
    "/manage-services", 
    "/manage-announcements",
    "/manage-counselors", // Added missing route
    "/reports",           // Added missing route
    "/profile",           // Added missing route
    "/settings",           // Added missing route
    "/departments",
    "/manage-about",
    "/manage-careers"
  ];
  const isAppView = appPages.includes(location.pathname);

  return (
    <div className="app">
      {/* Hide public navbar if on ANY admin page */}
      {!isAppView && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/view-request/:token" element={<GuestRequestView />} />
        <Route path="/careers" element={<Careers />} />
        
        {/* SHARED Routes (Admin & Counselor) */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'counsellor']}><Dashboard /></ProtectedRoute>} />
        <Route path="/schedules" element={<ProtectedRoute allowedRoles={['admin', 'counsellor']}><Schedules /></ProtectedRoute>} /> 
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'counsellor']}><Reports/></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'counsellor']}><Profile/></ProtectedRoute>} /> 

        {/* ADMIN ONLY Routes */}
        <Route path="/referrals" element={<ProtectedRoute allowedRoles={['admin']}><Referrals /></ProtectedRoute>} /> 
        <Route path="/manage-services" element={<ProtectedRoute allowedRoles={['admin']}><ManageServices /></ProtectedRoute>} /> 
        <Route path="/manage-announcements" element={<ProtectedRoute allowedRoles={['admin']}><ManageAnnouncements /></ProtectedRoute>} /> 
        <Route path="/manage-counselors" element={<ProtectedRoute allowedRoles={['admin']}><ManageCounselors /></ProtectedRoute>} /> 
        <Route path="/departments" element={<ProtectedRoute allowedRoles={['admin']}><ManageDepartments /></ProtectedRoute>} />
        <Route path="/manage-about" element={<ProtectedRoute allowedRoles={['admin']}><ManageAbout/></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings/></ProtectedRoute>} />
        <Route path="/manage-careers" element={<ProtectedRoute allowedRoles={['admin']}><ManageCareers/></ProtectedRoute>} />
      </Routes>

      {/* Hide public footer if on ANY admin page */}
      {!isAppView && <Footer />}
    </div>
  );
}