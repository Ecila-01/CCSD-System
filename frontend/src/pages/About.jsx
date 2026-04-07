import React, { useEffect, useRef } from "react";
import "../styles/About.css";

// Import or replace these with actual asset paths in your project
const UB_LOGO = "https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/University_of_Baguio_logo.png/200px-University_of_Baguio_logo.png";
const CCSD_BANNER = "https://via.placeholder.com/1200x400/8b0000/ffffff?text=CENTER+FOR+COUNSELING+AND+STUDENT+DEVELOPMENT";

const services = [
  {
    title: "Counseling",
    desc: "CCSD helps and guides students through our counseling service also known as student development facilitation.",
  },
  {
    title: "Testing",
    desc: "The CCSD administers psychological tests to students to help them have a better understanding of themselves, consequently enriching their psychological, emotional, social, and intellectual well-being and functioning.",
  },
  {
    title: "Career & Placement",
    desc: "CCSD assists the Jillians to have a realistic understanding of themselves so that they can make informed career decisions.",
  },
  {
    title: "Placement",
    desc: "CCSD ensures that students are in the right place at the right time. The service helps individuals find a place that will contribute their physical, mental, emotional and spiritual well-being so that they can be happy, contributing members of the society.",
  },
  {
    title: "Referral",
    desc: "CCSD encourages other university stakeholders such as teachers and other personnel to refer a student needing of counselor assistance. The service also includes the assistance given to students in obtaining services from EXTERNAL AGENCIES that might be more effective in helping them.",
  },
  {
    title: "Information",
    desc: "The CCSD provides students with pertinent, up-to-date and relevant information through seminars, training workshops, and other information dissemination strategies.",
  },
];

// ── Org Chart helpers ──
const PH = (seed) => `https://i.pravatar.cc/80?img=${seed}`;

const OrgCard = ({ name, role, tag, seed, small }) => (
  <div className={`org-card${small ? " org-card--small" : ""}`}>
    <div className="org-card__photo-wrap">
      <img src={PH(seed)} alt={name} className="org-card__photo" />
    </div>
    <div className="org-card__info">
      {tag && <span className="org-card__tag">{tag}</span>}
      <p className="org-card__name">{name}</p>
      <p className="org-card__role">{role}</p>
    </div>
  </div>
);

const objectives = [
  "Guide students to cultivate good academic habits and attitudes which are geared towards excellence and professional competence.",
  "Empower students to become effective decision-makers and self-reliant individuals who can utilize their potentials in the service of others.",
  "Provide students with necessary and up-to-date information through various counseling strategies and programs to assist them in personal, social, academic and career development.",
  "Support students to develop moral-ethical values and personal wellness practices.",
  "Promote the recognition and respect for individual differences (ethnic origin, culture, race, sexual orientation and religion).",
];

export default function About() {
  const fadeRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    fadeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !fadeRefs.current.includes(el)) fadeRefs.current.push(el);
  };

  return (
    <div className="ccsd-about">
      {/* ── HERO ── */}
      <section className="ccsd-hero" ref={addRef}>
        <div className="ccsd-hero__inner">
          <div className="ccsd-hero__badge">CCSD</div>
          <div className="ccsd-hero__title">
            Center for Counseling &amp; Student Development
          </div>
          <div className="ccsd-hero__meta">
            <span>✉ ccsd@ubaguio.edu</span>
            <span>📞 loc.225</span>
            <span>🏢 Building F, 2nd Floor · F006</span>
          </div>
          <div className="ccsd-hero__divider" />
          <p className="ccsd-hero__desc">
            We at the{" "}
            <strong>Center for Counseling and Student Development</strong>{" "}
            office support students, faculty, and staff's intellectual,
            psychological, emotional, social, and moral development. Our office
            offers services that cater to developing an individual's
            self-awareness and self-understanding, self-concept and self-esteem,
            attitudes, and values.
          </p>
          <p className="ccsd-hero__desc">
            We are an integral part of the educational system and help safeguard
            the student's ability to keep learning while staying at UB.
          </p>
          <div className="ccsd-hero__logo-wrap">
            <img src="src/assets/ccsdLogo.png" alt="University of Baguio" className="ccsd-hero__logo" />
          </div>
        </div>
      </section>

      {/* ── ORG CHART ── */}
      <section className="ccsd-orgchart fade-in" ref={addRef}>
        <div className="ccsd-section-inner">
          <h2 className="ccsd-section-title">Our Team</h2>


          {/* L3 — Director */}
          <div/>
          <div className="org-level org-level--center">
            <OrgCard seed={49} name="Leny O. Estacio, RGC, LPT" role="Director, CCSD" />
          </div>

          {/* L4 — Three main branches */}
          <div className="org-connector org-connector--branch3" />
          <div className="org-level org-level--3branch">

            {/* LEFT BRANCH — Guidance Associates */}
            <div className="org-branch org-branch--left">
              <div className="org-branch__col">
                <OrgCard seed={1}  name="Ian R. Alangdeo, RPM" role="Guidance Associate, SPA & SPED" />
                <OrgCard seed={20} name="Lara Joi G. Ilumin, RPM" role="Guidance Associate, SPA & ETELA" />
                <OrgCard seed={33} name="Kristina G. Valdez, RPM" role="Guidance Associate, SOM & STELA" />
              </div>
            </div>

            {/* MIDDLE BRANCH */}
            <div className="org-branch org-branch--middle">
              <div className="org-branch__col">
                <OrgCard seed={5}  name="Jozenieh A. Bangibang, RPM" role="Guidance Associate, SIT & DAS" />
                <OrgCard seed={21} name="Rizza Joy E. Quitaleg, RPM" role="Guidance Associate, SEA" />
                <OrgCard seed={34} name="Kristina G. Velasco, RPM" role="Guidance Associate, SCNS & SL" />
              </div>
              <div className="org-branch__connector-h" />
              <div className="org-branch__col">
                <OrgCard seed={44} name="Minerva P. Andres, RPM" role="University Psychometrician" />
                <OrgCard seed={27} name="Alicia Audrey T. Bautista, RPM" role="Guidance Associate, SA" />
                <OrgCard seed={35} name="Fiona Mae D. Gorio, RPM" role="Substitute Psychometrician" />
              </div>
            </div>

            {/* RIGHT BRANCH */}
            <div className="org-branch org-branch--right">
              <div className="org-branch__col">
                <OrgCard seed={7}  name="Karol B. Manalo" role="Guidance Associate, SBAC — Senior High" />
                <OrgCard seed={22} name="Camille Joyce G. Velasco" role="Guidance Associate, SMNS — Senior High" />
                <OrgCard seed={36} name="Shiela Natalie D. Juyag, RPM, MAG" role="Guidance Associate, SMNS — Senior High" />
              </div>
              <div className="org-branch__connector-h" />
              <div className="org-branch__col">
                <OrgCard seed={9}  name="Godwin Deve D. Ayodoc" role="Guidance Associate, SMNS — Senior High" />
                <OrgCard seed={28} name="Shena Lea G. Ariola, LPT" role="Guidance Associate, SMNS — Senior High" />
                <div className="org-branch__sub-col">
                  <OrgCard seed={38} name="Karylle Elaiza U. Lee, RPM" role="Guidance Associate, To Be Announced" />
                  <OrgCard seed={39} name="Jenel Mae D. Baniaga, RPM" role="Guidance Associate, To Be Announced" />
                </div>
              </div>
            </div>

          </div>

          {/* L5 — Student Assistants */}
          <div className="org-connector org-connector--down org-connector--mt" />
          <div className="org-level org-level--label">
            <span className="org-level__label">CCSD Student Assistants</span>
          </div>
          <div className="org-level org-level--3col org-level--assistants">
            <OrgCard seed={15} small name="Thyler" role="CCSD Student Assistant" />
            <OrgCard seed={25} small name="Madeline" role="CCSD Student Assistant" />
            <OrgCard seed={43} small name="Kharyle" role="CCSD Student Assistant" />
          </div>

        </div>
      </section>

      {/* ── BANNER ── */}
      <section className="ccsd-banner fade-in" ref={addRef}>
        <div className="ccsd-banner__overlay">
          <h2 className="ccsd-banner__text">
            Center for Counseling<br />and Student Development
          </h2>
        </div>
      </section>

      {/* ── SERVICES ── */}
      {/* <section className="ccsd-services fade-in" ref={addRef}>
        <div className="ccsd-section-inner">
          <h2 className="ccsd-section-title">Services</h2>
          <div className="ccsd-services__grid">
            {services.map((s, i) => (
              <div className="ccsd-service-card" key={i}>
                <h3 className="ccsd-service-card__title">{s.title}</h3>
                <p className="ccsd-service-card__desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="ccsd-services__cta-wrap">
            <button className="ccsd-btn ccsd-btn--primary">Learn More</button>
          </div>
        </div>
      </section> */}

      {/* ── MISSION ── */}
      <section className="ccsd-mission fade-in" ref={addRef}>
        <div className="ccsd-section-inner ccsd-mission__inner">
          <h2 className="ccsd-section-title">Our Mission</h2>
          <p className="ccsd-mission__text">
            Guided by the Divine Providence, the University of Baguio Center for
            Counseling and Student Development (CCSD) commits itself to being a
            major catalyst of student holistic development through the provision
            of experiences that sustain a dynamic academic environment and
            responsive education where students enjoy a focused yet balanced
            learning.
          </p>
        </div>
      </section>

      {/* ── OBJECTIVES ── */}
      <section className="ccsd-objectives fade-in" ref={addRef}>
        <div className="ccsd-section-inner">
          <h2 className="ccsd-section-title">Our Objectives</h2>
          <p className="ccsd-objectives__intro">
            In support of the university's mission-vision and objectives, the
            Center for Counseling and Student Development aims to:
          </p>
          <ol className="ccsd-objectives__list">
            {objectives.map((obj, i) => (
              <li key={i} className="ccsd-objectives__item">
                {obj}
              </li>
            ))}
          </ol>
        </div>
      </section>


    </div>
  );
}