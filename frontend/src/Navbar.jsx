import { useState } from "react";
import { NavLink } from "react-router-dom"; 
import "./Navbar.css";
import ubLogo from "./assets/darkUBlogo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navWrap">
      <div className="navBar">
        <div className="navLeft">
          <img className="brandLogo" src={ubLogo} alt="UB Logo" />
        </div>

        <div className="menuIcon" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>

        <nav className={`navCenter ${menuOpen ? "active" : ""}`}>
          <NavLink to="/" className="navLink">Home</NavLink>
          <NavLink to="/about" className="navLink">About</NavLink>
          <NavLink to="/services" className="navLink">Services</NavLink>
        </nav>

        <div className="navRight">
          <NavLink to="/signup" className="navLink">Sign Up</NavLink>
          <button className="loginBtn">Login</button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;