import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";

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
    "/departments"
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
        
        {/* Admin Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedules" element={<Schedules />} /> 
        <Route path="/referrals" element={<Referrals />} /> 
        <Route path="/manage-services" element={<ManageServices />} /> 
        <Route path="/manage-announcements" element={<ManageAnnouncements />} /> 
        <Route path="/manage-counselors" element={<ManageCounselors />} /> 
        <Route path="/profile" element={<Profile/>} /> 
        <Route path="/departments" element={<ManageDepartments />} />
      </Routes>

      {/* Hide public footer if on ANY admin page */}
      {!isAppView && <Footer />}
    </div>
  );
}