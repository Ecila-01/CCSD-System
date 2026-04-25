import React from 'react';
import { MdClose, MdCalendarToday, MdLabelOutline } from "react-icons/md";
import '../styles/ServiceModal.css'; 

// ✅ Synced fallback image with your public cards
const FALLBACK_IMAGE = "https://placehold.co/600x400/8b0000/ffffff?text=University+News";

const AnnouncementModal = ({ announcement, onClose, onEdit }) => {
  if (!announcement) return null;

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card">
        
        <div className="modal-header bg-red" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          position: 'relative', 
          padding: '15px 20px' 
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
            Announcement Preview
          </h2>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px'
            }}
          >
            <MdClose size={28} />
          </button>
        </div>

        <div className="modal-body">
          {/* Main Hero Image */}
          <div 
            className="preview-image-container" 
            style={{ 
              marginBottom: '20px', 
              backgroundColor: '#f8f9fa', 
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <img 
              src={
                !announcement.image 
                  ? FALLBACK_IMAGE 
                  : announcement.image.startsWith('http') 
                    ? announcement.image 
                    : `${import.meta.env.VITE_API_URL}${announcement.image}`
              } 
              alt={announcement.title} 
              style={{ 
                width: '100%', 
                maxHeight: '300px',
                objectFit: 'contain',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
              }}
              onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = FALLBACK_IMAGE; 
              }}
            />
          </div>

          <div className="modal-detail-group">
            <h1 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>
              {announcement.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '14px' }}>
                  <MdLabelOutline /> <strong>{announcement.category}</strong>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '14px' }}>
                  <MdCalendarToday /> {announcement.eventDate || 'No date set'}
               </div>
            </div>

            {/* ✅ NEW: Short Description Block */}
            {announcement.shortDescription && (
              <div style={{ 
                backgroundColor: '#f8fafc', 
                borderLeft: '4px solid #0f172a', 
                padding: '12px 15px', 
                marginBottom: '25px',
                borderRadius: '0 6px 6px 0'
              }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                  Short Description (Card Preview)
                </label>
                <p style={{ margin: 0, fontSize: '14px', color: '#334155', fontStyle: 'italic', lineHeight: '1.5' }}>
                  "{announcement.shortDescription}"
                </p>
              </div>
            )}

            <label>FULL CONTENT</label>
            <p style={{ lineHeight: '1.6', color: '#444', whiteSpace: 'pre-wrap', marginTop: '8px' }}>
              {announcement.content}
            </p>
          </div>

          <hr className="divider" />
          
          <div className="modal-detail-group">
            <label>Details</label>
            <ul style={{ fontSize: '12px', color: '#888', listStyle: 'none', padding: 0 }}>
              <li><strong>Post Status:</strong> {announcement.status}</li>
              <li><strong>System Post Date:</strong> {new Date(announcement.datePosted).toLocaleString()}</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button className="btn-cancel" onClick={onClose}>
            Close Preview
          </button>
          <button className="btn-save" onClick={() => onEdit(announcement)}>
            Edit Announcement
          </button>
        </div>

      </div>
    </div>
  );
};

export default AnnouncementModal;