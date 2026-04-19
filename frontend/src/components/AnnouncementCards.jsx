import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AnnouncementCards.css';

export default function AnnouncementCards() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/announcements");
        // Only show Active ones to the students
        const activeNews = response.data.filter(ann => ann.status === 'Active');
        setAnnouncements(activeNews);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // Helper to map DB categories to your existing CSS badge classes
  const getBadgeClass = (category) => {
    switch (category?.toUpperCase()) {
      case 'EVENT': return 'badge-event';
      case 'UPDATE': return 'badge-alert'; // or badge-update
      case 'MEMO': return 'badge-memo';
      case 'INFO': return 'badge-info';
      default: return 'badge-news';
    }
  };

  if (loading) {
    return (
      <section className="announcements-section">
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          Loading latest news...
        </div>
      </section>
    );
  }

  return (
    <section className="announcements-section">
      <div className="cards-grid">
        {announcements.length === 0 ? (
          <p style={{ textAlign: 'center', width: '100%', color: '#999' }}>
            No recent announcements.
          </p>
        ) : (
          announcements.map((ann) => (
            <article className="ann-card" key={ann._id}>
              <div className="card-img-wrapper">
                <img
                  src={ann.image}
                  alt={ann.title}
                  className="card-img"
                  onError={(e) => { e.target.src = 'https://placehold.co/600x340?text=News'; }}
                />
                <span className={`card-badge ${getBadgeClass(ann.category)}`}>
                  {ann.category}
                </span>
              </div>
              <div className="card-body">
                <h3 className="card-title">{ann.title}</h3>
                <p className="card-desc">
                  {ann.content.length > 150 
                    ? `${ann.content.substring(0, 150)}...` 
                    : ann.content}
                </p>
                <div className="card-footer">
                  <span className="card-date">{ann.eventDate || new Date(ann.datePosted).toLocaleDateString()}</span>
                  <a href={`/news/${ann._id}`} className="card-link" onClick={(e) => e.preventDefault()}>
                    Read more <span className="card-link-arrow">→</span>
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}