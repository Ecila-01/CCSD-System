import "./App.css";
import ubLogo from "./assets/ub-logo.png";
import ccsdLogo from "./assets/ccsd-logo.png";

const navItems = ["home", "home", "home", "home", "home", "home"];

function Navbar() {
  return (
    <header className="navWrap">
      <div className="navBar">
        <img className="brandLogo" src={ubLogo} alt="UB Logo" />

        <nav className="navLinks">
          {navItems.map((label, idx) => (
            <a key={idx} className="navLink" href="#home">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function HomeHero() {
  return (
    <main className="page" id="home">
      <section className="heroWrap">
        <div className="heroCard">
          <div className="heroLeft">
            <h1 className="heroTitle">
              Welcome
              <br />
              to
              <br />
              <span className="heroTitleAccent">UB-CCSD</span>
            </h1>

            <p className="heroSubtitle">
              CENTER for COUNSELING and
              <br />
              STUDENT DEVELOPMENT
            </p>
          </div>

          <div className="heroRight">
            <img className="heroLogo" src={ccsdLogo} alt="CCSD Logo" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <HomeHero />
    </div>
  );
}