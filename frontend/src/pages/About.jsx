import campusImg from "../assets/hero-bg.png";
import aboutImg from "../assets/about.png";
import "./About.css";
import Hero from "../components/Hero";

function About() {
  return (
    <div className="aboutPage">
      <Hero background={campusImg} title="ABOUT UB CCSD" />

      <section className="aboutSection">
        <div className="aboutContainer">
          <div className="aboutHeader">
            <h2>CCSD ABOUT</h2>
            <div className="aboutLine"></div>
          </div>

          <div className="aboutCard">
            <img
              src={aboutImg}
              alt="Counseling"
              className="aboutImage"
            />

            <div className="aboutTitleBar">
              Center for Counseling and Student Development
            </div>

            <div className="aboutText">
              <p>
                We at the Center for Counseling and Student Development office
                support students, faculty, and staff’s intellectual,
                psychological, emotional, social, and moral development.
              </p>

              <p>
                Our office offers services that cater developing an individual's
                self-awareness and self-understanding, self-concept and
                self-esteem, attitudes, and values.
              </p>

              <p>
                We are an integral part of the educational system and help
                safeguard the student's ability to keep learning while staying at
                UB.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;