import React from 'react';
import { MdClose, MdCalendarToday, MdLabelOutline } from "react-icons/md";
import '../styles/ServiceModal.css'; 

const AnnouncementModal = ({ announcement, onClose, onEdit }) => {
  if (!announcement) return null;

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card">
        
        <div className="modal-header bg-red">
          <h2>ANNOUNCEMENT PREVIEW</h2>
          <button className="close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Main Hero Image */}
        <div 
          className="preview-image-container" 
          style={{ 
            marginBottom: '20px', 
            backgroundColor: '#f8f9fa', // Optional: light gray background for empty space
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <img 
            src={announcement.image} 
            alt={announcement.title} 
            style={{ 
              width: '100%', 
              maxHeight: '300px',    // Prevents the image from getting too tall
              objectFit: 'contain',  // THIS is the magic "zoom out to fit" property!
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
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

            <label>CONTENT</label>
            <p style={{ lineHeight: '1.6', color: '#444', whiteSpace: 'pre-wrap' }}>
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