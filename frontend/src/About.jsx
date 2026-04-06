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

          {/* INNER WRAPPER (same width as cards) */}
          <div className="aboutInner">

            {/* HEADER */}
            <div className="aboutHeader">
              <h2>CCSD ABOUT</h2>
              <div className="aboutLine"></div>
            </div>

            {/* CONTENT */}
            <div className="aboutContent">

              {/* LEFT CARD */}
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
                    safeguard the student's ability to keep learning while staying
                    at UB.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="aboutRight">

                <div className="infoBox">
                  <h3>OUR MISSION</h3>
                  <p>
                    Guided by the Divine Providence, the University of Baguio
                    Center for Counseling and Student Development (CCSD) commits
                    itself to being a major catalyst of student holistic
                    development through the provision of experiences that sustain
                    a dynamic environment and responsive education where students
                    enjoy a focused yet balanced learning.
                  </p>
                </div>

                <div className="infoBox">
                  <h3>OBJECTIVES</h3>
                  <ol>
                    <li>
                      Guide students to cultivate good academic habits and
                      attitudes which are geared towards excellence and
                      professional competence;
                    </li>
                    <li>
                      Empower students to become who can utilize their potentials
                      in the service of others;
                    </li>
                    <li>
                      Provide students with necessary and up-to-date information
                      through various counseling strategies and programs to assist
                      them in personal, social, academic, and career development;
                    </li>
                    <li>
                      Support students to develop moral-ethical values and
                      personal wellness practices; and
                    </li>
                    <li>
                      Promote the recognition and respect for individual
                      differences (ethnic, origin, culture, race, sexual
                      orientation and religion).
                    </li>
                  </ol>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

export default About;