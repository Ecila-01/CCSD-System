import { useState } from "react";
import { NavLink, Link } from "react-router-dom"; // ✅ Add Link here
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
          {/* ✅ Wrap the logo in a Link tag */}
          <Link to="/" onClick={closeMenu}>
            <img className="brandLogo" src={ubLogo} alt="UB Logo" />
          </Link>
        </div>

        <div className="menuIcon" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </div>

        <nav className={`navCenter ${menuOpen ? "active" : ""}`}>
          <NavLink to="/" className="navLink" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/careers" className="navLink" onClick={closeMenu}>Careers</NavLink>
          <NavLink to="/about" className="navLink" onClick={closeMenu}>About</NavLink>
          <NavLink to="/services" className="navLink" onClick={closeMenu}>Services</NavLink>
          {/* Added 'mobile-login' class here */}
          <button className="loginBtn mobile-login" onClick={() => { setModalOpen(true); closeMenu(); }}>
            Login
          </button>
        </nav>

        <div className="navRight">
          {/* Added 'desktop-login' class here */}
          <button className="loginBtn desktop-login" onClick={() => { setModalOpen(true); closeMenu(); }}>
            Login
          </button>
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