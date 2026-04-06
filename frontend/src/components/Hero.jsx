import "./Hero.css";

function Hero({ background, title, subtitle }) {
  return (
    <section
      className="heroSection"
      style={{ backgroundImage: `url(${background})`, filter: "saturate(120%)" }}
    >
      <div className="heroOverlay">
        <div className="heroContent">
          <h1 className="heroMainTitle">{title}</h1>
          {subtitle && <h2 className="heroSubTitle">{subtitle}</h2>}

          <img src="src/assets/ccsdLogo.png" alt="CCSD Logo" style={{ width: '150px', height: 'auto', filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.8))'}}/>
        </div>
      </div>
    </section>
  );
}

export default Hero;