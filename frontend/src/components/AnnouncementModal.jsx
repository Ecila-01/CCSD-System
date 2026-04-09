import React from 'react';
import { MdClose, MdCalendarToday, MdLabelOutline } from "react-icons/md";
import '../styles/ServiceModal.css'; 

const AnnouncementModal = ({ announcement, onClose }) => {
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
          <div className="preview-image-container" style={{ marginBottom: '20px' }}>
            <img 
              src={announcement.image} 
              alt={announcement.title} 
              style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
            <label>ADMIN METADATA</label>
            <ul style={{ fontSize: '12px', color: '#888', listStyle: 'none', padding: 0 }}>
              <li><strong>Database ID:</strong> {announcement._id}</li>
              <li><strong>Post Status:</strong> {announcement.status}</li>
              <li><strong>System Post Date:</strong> {new Date(announcement.datePosted).toLocaleString()}</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} style={{ width: '100%' }}>
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};

export default AnnouncementModal;