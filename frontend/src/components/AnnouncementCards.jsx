import '../styles/AnnouncementCards.css';
import a1Img from "../assets/announcement1.jpg";
import a2Img from "../assets/announcement2.jpg";
import a3Img from "../assets/announcement3.jpg";
import a4Img from "../assets/announcement4.jpg";


const cards = [
  {
    badge: 'Event',
    badgeClass: 'badge-event',
    title: 'Are you job ready?',
    desc: 'Something big is coming for our graduating Ubian students, a chance to sharpen your job application skills and experience real on-the-spot interviews. Get ready to step out of the classroom and into your future.',
    date: 'March 17–19 & 23–27, 2026',
    image: a4Img ,
    href: '#',
  },
  {
    badge: 'Event',
    badgeClass: 'badge-news',
    title: 'Love and Wellness fair for the communnity',
    desc: 'Facilitated by the University of Baguio Center for Counseling and Student Development (CCSD), come join in on fun and exciting activities that boost your creativity and confidence in this year’s Love and Wellness Fair 2026! ',
    date: 'February 24, 2026',
    image: a2Img,
    href: '#',
  },
  {
    badge: 'Update',
    badgeClass: 'badge-alert',
    title: 'Official Advisroy: University of Baguio Announces 4 day work week schedule',
    desc: 'The University of Baguio wishes to inform its students, management members, and the academic community on the adaptation of the 4-Day Work Week schedule.',
    date: 'April 6 to July 31, 2026',
    image: a3Img,
    href: '#',
  },
  {
    badge: 'Update',
    badgeClass: 'badge-update',
    title: 'Online Enrollment Now Open for AY 2025–2026',
    desc: 'Students may now access the enrollment portal. Refer to the schedule of fees and updated curriculum per department.',
    date: 'April 5, 2025',
    image: 'https://placehold.co/600x340/1B2A4A/FFFFFF?text=Enrollment+Open',
    href: '#',
  },
  {
    badge: 'Memo',
    badgeClass: 'badge-memo',
    title: 'Reminder: Submit Clearance Before May 30',
    desc: 'All graduating students must secure their clearance from all offices and submit to the registrar before the deadline.',
    date: 'April 3, 2025',
    image: 'https://placehold.co/600x340/8B0000/FFFFFF?text=Clearance+Reminder',
    href: '#',
  },
  {
    badge: 'Info',
    badgeClass: 'badge-info',
    title: 'Scholarship Applications Now Accepted for 2025',
    desc: 'Qualified students may apply for academic and merit-based scholarships. Application forms are available at the OSA.',
    date: 'April 1, 2025',
    image: 'https://placehold.co/600x340/1B2A4A/FFFFFF?text=Scholarship+Info',
    href: '#',
  },
];

export default function AnnouncementCards() {
  return (
    <section className="announcements-section">
      {/* <div className="announcements-header">
        <span className="announcements-eyebrow">Latest Updates</span>
        <h2 className="announcements-title">Announcements</h2>
      </div> */}
      <div className="cards-grid">
        {cards.map((card, i) => (
          <article className="ann-card" key={i}>
            <div className="card-img-wrapper">
              <img
                src={card.image}
                alt={card.title}
                className="card-img"
              />
              <span className={`card-badge ${card.badgeClass}`}>{card.badge}</span>
            </div>
            <div className="card-body">
              <h3 className="card-title">{card.title}</h3>
              <p className="card-desc">{card.desc}</p>
              <div className="card-footer">
                <span className="card-date">{card.date}</span>
                <a href={card.href} className="card-link">
                  Read more <span className="card-link-arrow">→</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
