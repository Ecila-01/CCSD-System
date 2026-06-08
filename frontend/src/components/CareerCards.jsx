import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AnnouncementCards.css';
import FullCareerModal from './FullCareerModal';

const FALLBACK_IMAGE = "https://placehold.co/600x400/8b0000/ffffff?text=Career+News";

export default function CareerCards() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/careers`);
        const activePosts = response.data.filter(c => c.status === 'Active');
        setCareers(activePosts);
      } catch (error) {
        console.error("Error fetching career posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCareers();
  }, []);

  const getBadgeClass = (category) => {
    switch (category?.toUpperCase()) {
      case 'JOB FAIR': return 'badge-event';
      case 'HIRING': return 'badge-alert';
      case 'CONSULTATION': return 'badge-memo';
      case 'WORKSHOP': return 'badge-info';
      default: return 'badge-news';
    }
  };

  if (loading) {
    return (
      <section className="announcements-section">
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          Loading career updates...
        </div>
      </section>
    );
  }

  const handleReadMore = (e, career) => {
    e.preventDefault();
    setSelectedCareer(career);
    setIsModalOpen(true);
  };

  return (
    <section className="announcements-section">
      <div className="cards-grid">
        {careers.length === 0 ? (
          <p style={{ textAlign: 'center', width: '100%', color: '#999' }}>
            No career updates right now.
          </p>
        ) : (
          careers.map((career) => (
            <article className="ann-card" key={career._id}>
              <div className="card-img-wrapper">
                <img
                  src={
                    !career.image
                      ? FALLBACK_IMAGE
                      : career.image.startsWith('http')
                        ? career.image
                        : `${import.meta.env.VITE_API_URL}${career.image}`
                  }
                  alt={career.title}
                  className="card-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMAGE;
                  }}
                />
                <span className={`card-badge ${getBadgeClass(career.category)}`}>
                  {career.category}
                </span>
              </div>
              <div className="card-body">
                <h3 className="card-title">{career.title}</h3>

                <p className="card-desc">
                  {career.shortDescription
                    ? career.shortDescription
                    : (career.content.length > 150 ? `${career.content.substring(0, 150)}...` : career.content)}
                </p>

                <div className="card-footer">
                  <span className="card-date">{career.eventDate || new Date(career.datePosted).toLocaleDateString()}</span>

                  <a href="#" className="card-link" onClick={(e) => handleReadMore(e, career)}>
                    Read more <span className="card-link-arrow">→</span>
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      <FullCareerModal
        isOpen={isModalOpen}
        career={selectedCareer}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
