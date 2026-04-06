import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Hero from "./components/Hero";
import ubLogo from "./assets/ub-logo.png";
import heroBg from "./assets/facade.jpg"; // Groupmate's updated image
import examImg from "./assets/exam.png";
import webinarImg from "./assets/webinar.png";
import orientationImg from "./assets/orientation.png";
import wellnessImg from "./assets/wellness.png";

// Page & Component Imports
import Services from "./pages/Services";
import About from "./pages/About";
import Navbar from "./Navbar";
import Dashboard from "./pages/Dashboard";
import Schedules from "./pages/Schedules";
import Referrals from "./pages/Referrals";
import AnnouncementCards from "./components/AnnouncementCards"; // Groupmate's new component
import FlipTitle from "./components/FlipTitle"; // Groupmate's new component

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

// Groupmate's updated HomePage layout
function HomePage() {
  return (
    <>
      <Hero
        background={heroBg}
        title="Center for Counseling and Student Development"
      />
      <FlipTitle />
      <AnnouncementCards /> 
    </>
  );
}

// Groupmate's new placeholder page
function SignUpPage() {
  return (
    <section className="placeholderPage">
      <h1>Sign Up Page</h1>
    </section>
  );
}

export default function App() {
  const location = useLocation();

  // Your logic to hide public nav/footer on admin pages
  const adminPages = ["/dashboard", "/schedules", "/referrals"];
  const isAdminView = adminPages.includes(location.pathname);

  return (
    <div className="app">
      {/* Hide public navbar if on ANY admin page */}
      {!isAdminView && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Admin Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedules" element={<Schedules />} /> 
        <Route path="/referrals" element={<Referrals />} /> 
      </Routes>

      {/* Hide public footer if on ANY admin page */}
      {!isAdminView && <Footer />}
    </div>
  );
}