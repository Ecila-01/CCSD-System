import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AnnouncementCards.css';

// Define the fallback image as a constant for easy updates
const FALLBACK_IMAGE = "https://placehold.co/600x400/8b0000/ffffff?text=University+News";

export default function AnnouncementCards() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/announcements`);
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

  const getBadgeClass = (category) => {
    switch (category?.toUpperCase()) {
      case 'EVENT': return 'badge-event';
      case 'UPDATE': return 'badge-alert';
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
                  // 1. Use the fallback if there's no image in the DB
                  // 2. Otherwise, check if it's already a full URL (external) or just a path
                  src={
                    !ann.image 
                      ? FALLBACK_IMAGE 
                      : ann.image.startsWith('http') 
                        ? ann.image 
                        : `${import.meta.env.VITE_API_URL}${ann.image}`
                  }
                  alt={ann.title}
                  className="card-img"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = FALLBACK_IMAGE; 
                  }}
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