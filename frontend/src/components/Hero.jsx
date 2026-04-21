import "../styles/Hero.css";
import ccsdLogo from "../assets/ccsdLogo.png"; 

function Hero({ background, title, subtitle }) {
  return (
    <section
      className="heroSection"
      style={{ backgroundImage: `url(${background})`, filter: "saturate(120%)" }}
    >
      <div className="heroOverlay">
        <div className="heroContent">
          
          <h1 className="heroMainTitle">
            <img
              src={ccsdLogo} 
              alt="CCSD Logo"
              className="heroLogo"
            />
            {title}
          </h1>
          
          {subtitle && <h2 className="heroSubTitle">{subtitle}</h2>}
        </div>
      </div>
    </section>
  );
}

export default Hero;