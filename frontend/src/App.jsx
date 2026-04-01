import "./App.css";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Hero from "./components/Hero";
import ubLogo from "./assets/ub-logo.png";
import heroBg from "./assets/hero-bg.png";
import examImg from "./assets/exam.png";
import webinarImg from "./assets/webinar.png";
import orientationImg from "./assets/orientation.png";
import wellnessImg from "./assets/wellness.png";
import Services from "./pages/Services";
import About from "./pages/About";
import Navbar from "./Navbar";
import Dashboard from "./pages/Dashboard";
const announcements = [
  {
    title: "Upcoming Exam Schedules",
    text: "Check the dates for the upcoming exams.",
    image: examImg,
  },
  {
    title: "Webinars for Pre-Employment",
    text: "Join our Pre-Employment Webinar.",
    image: webinarImg,
  },
  {
    title: "Student Orientations",
    text: "Welcome new students to UB CCSD.",
    image: orientationImg,
  },
  {
    title: "Love and Wellness Fair",
    text: "Good health and well being.",
    image: wellnessImg,
  },
];



function AnnouncementCard({ title, text, image }) {
  return (
    <div className="announcementCard">
      <div className="announcementText">
        <h3>{title}</h3>
        <div className="cardLine" />
        <p>{text}</p>
        <button className="readMoreBtn">Read More ›</button>
      </div>

      <div className="announcementImageWrap">
        <img src={image} alt={title} className="announcementImage" />
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  return (
    <section className="announcementsSection">
      <div className="sectionHeader">
        <h2>Latest Announcements</h2>
        <div className="sectionLine" />
      </div>

      <div className="announcementGrid">
        {announcements.map((item) => (
          <AnnouncementCard
            key={item.title}
            title={item.title}
            text={item.text}
            image={item.image}
          />
        ))}
      </div>

      <div className="viewAllWrap">
        <button className="viewAllBtn">View All Announcements ›</button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footerBar">
      <div className="footerItem">📍 F Bldg. 2nd Floor, F206</div>
      <div className="footerItem">🕒 M-W-Th-Sat 8:00am - 5:00pm</div>
      <div className="footerItem">ⓕ facebook.com/ubccsd</div>
      <div className="footerItem">✉ ccsd@e.ubaguio.edu</div>
    </footer>
  );
}

function HomePage() {
  return (
    <>
      <Hero
        background={heroBg}
        title="UNIVERSITY OF BAGUIO"
        subtitle="CCSD ANNOUNCEMENTS"
      />
      <AnnouncementsSection />
    </>
  );
}
export default function App() {
  const location = useLocation();

  // Define the pages where you want to hide the public Navbar/Footer
  const isDashboard = location.pathname === "/dashboard";
  return (
    <div className="app">
      {!isDashboard && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services/>} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      {!isDashboard && <Footer />}
    </div>
  );
}