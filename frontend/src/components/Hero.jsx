import "./Hero.css";

function Hero({ background, title, subtitle }) {
  return (
    <section
      className="heroSection"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="heroOverlay">
        <div className="heroContent">
          <h1 className="heroMainTitle">{title}</h1>
          {subtitle && <h2 className="heroSubTitle">{subtitle}</h2>}
        </div>
      </div>
    </section>
  );
}

export default Hero;