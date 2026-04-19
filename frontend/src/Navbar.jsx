import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import ubLogo from "./assets/darkUBlogo.png";
import LoginModal from "./components/LoginModal";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navWrap">
      <div className="navBar">
        <div className="navLeft">
          <img className="brandLogo" src={ubLogo} alt="UB Logo" />
        </div>

        <div className="menuIcon" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </div>

        <nav className={`navCenter ${menuOpen ? "active" : ""}`}>
          <NavLink to="/" className="navLink" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/about" className="navLink" onClick={closeMenu}>About</NavLink>
          <NavLink to="/services" className="navLink" onClick={closeMenu}>Services</NavLink>
          {/* Login button inside mobile menu */}
          <button className="loginBtn" onClick={() => { setModalOpen(true); closeMenu(); }}>
            Login
          </button>
        </nav>

        <div className="navRight">
          <button className="loginBtn" onClick={() => setModalOpen(true)}>Login</button>
        </div>
      </div>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </header>
  );
}

export default Navbar;