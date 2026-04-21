import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/About.css";
import ccsdLogo from "../assets/ccsdLogo.png";

// ── Org Chart Component ──
const OrgCard = ({ name, role, tag, imageUrl, small }) => (
  <div className={`org-card${small ? " org-card--small" : ""}`}>
    <div className="org-card__photo-wrap">
      <img 
        src={
          !imageUrl 
            ? "https://www.gravatar.com/avatar/?d=mp" 
            : imageUrl.startsWith('http') 
              ? imageUrl 
              : `${import.meta.env.VITE_API_URL}${imageUrl}`
        } 
        alt={name} 
        className="org-card__photo" 
        onError={(e) => { e.target.src = "https://www.gravatar.com/avatar/?d=mp"; }}
      />
    </div>
    <div className="org-card__info">
      {tag && <span className="org-card__tag">{tag}</span>}
      <p className="org-card__name">{name}</p>
      <p className="org-card__role">{role}</p>
    </div>
  </div>
);

export default function About() {
  const [aboutData, setAboutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fadeRefs = useRef([]);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/about`);
        setAboutData(res.data);
      } catch (error) {
        console.error("Error fetching About content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAboutData();
  }, []);

  useEffect(() => {
    if (isLoading || !aboutData) return;
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
  }, [isLoading, aboutData]);

  const addRef = (el) => {
    if (el && !fadeRefs.current.includes(el)) fadeRefs.current.push(el);
  };

  if (isLoading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading...</div>;

  const { teamMembers } = aboutData;
  const director = teamMembers.filter(m => m.hierarchyLevel === 1);
  const staff = teamMembers.filter(m => m.hierarchyLevel === 2);
  const assistants = teamMembers.filter(m => m.hierarchyLevel === 3);

  return (
    <div className="ccsd-about">
      {/* ── HERO ── */}
      <section className="ccsd-hero" ref={addRef}>
        <div className="ccsd-hero__inner">
          <div className="ccsd-hero__badge">CCSD</div>
          <div className="ccsd-hero__title">Center for Counseling &amp; Student Development</div>
          <div className="ccsd-hero__meta">
            <span>✉ {aboutData.email}</span>
            <span>📞 {aboutData.phone}</span>
            <span>🏢 {aboutData.location}</span>
          </div>
          <div className="ccsd-hero__divider" />
          {aboutData.heroDescriptionParagraphs.map((paragraph, index) => (
            <p key={index} className="ccsd-hero__desc">
              {paragraph.includes("Center for Counseling and Student Development") ? (
                <span dangerouslySetInnerHTML={{ __html: paragraph.replace("Center for Counseling and Student Development", "<strong>Center for Counseling and Student Development</strong>") }} />
              ) : paragraph}
            </p>
          ))}
          <div className="ccsd-hero__logo-wrap">
            <img src={ccsdLogo} alt="CCSD Logo" className="ccsd-hero__logo" />
          </div>
        </div>
      </section>

      {/* ── SIMPLIFIED ORG CHART ── */}
      <section className="ccsd-orgchart fade-in" ref={addRef}>
        <div className="ccsd-section-inner">
          <h2 className="ccsd-section-title">Our Team</h2>

          {/* Level 1: Director */}
          <div className="org-level org-level--center">
            {director.map(m => <OrgCard key={m._id} name={m.name} role={m.role} imageUrl={m.imageUrl} />)}
          </div>

          {/* Vertical Connector 1 -> 2 */}
          <div className="org-connector org-connector--down" style={{ margin: '20px auto' }} />

          {/* Level 2: Staff */}
          <div className="org-level" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
            {staff.map(m => <OrgCard key={m._id} name={m.name} role={m.role} tag={m.departmentTag} imageUrl={m.imageUrl} />)}
          </div>

          {/* Vertical Connector 2 -> 3 */}
          <div className="org-connector org-connector--down" style={{ margin: '20px auto' }} />

          {/* Level 3: Student Assistants */}
          <div className="org-level org-level--label">
            <span className="org-level__label">CCSD Student Assistants</span>
          </div>
          <div className="org-level" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
            {assistants.map(m => <OrgCard key={m._id} name={m.name} role={m.role} imageUrl={m.imageUrl} small />)}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="ccsd-mission fade-in" ref={addRef}>
        <div className="ccsd-section-inner ccsd-mission__inner">
          <h2 className="ccsd-section-title">Our Mission</h2>
          <p className="ccsd-mission__text">{aboutData.missionStatement}</p>
        </div>
      </section>

      {/* ── OBJECTIVES ── */}
      <section className="ccsd-objectives fade-in" ref={addRef}>
        <div className="ccsd-section-inner">
          <h2 className="ccsd-section-title">Our Objectives</h2>
          <ol className="ccsd-objectives__list">
            {aboutData.objectives.map((obj, i) => (
              <li key={i} className="ccsd-objectives__item">{obj}</li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}