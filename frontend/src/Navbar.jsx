import { useState } from "react";
import { Link } from "react-router-dom";
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
          <Link to="/" className="navLink">Home</Link>
          <Link to="/about" className="navLink">About</Link>
          <Link to="/services" className="navLink">Services</Link>

        </nav>

        <div className="navRight">
          <Link to="/signup" className="navLink">Sign Up</Link>
          <button className="loginBtn">Login</button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;