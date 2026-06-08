import React from 'react';
import { MdClose, MdCalendarToday } from "react-icons/md";
import '../styles/ServiceModal.css';

const FullCareerModal = ({ career, isOpen, onClose }) => {
  if (!isOpen || !career) return null;

  const FALLBACK_IMAGE = "https://placehold.co/600x400/8b0000/ffffff?text=Career+News";

  return (
    <div className="service-modal-overlay" onClick={onClose} style={{ padding: '10px' }}>
      <div
        className="service-modal-card"
        style={{
          maxWidth: '800px',
          width: '100%',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header bg-red" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          flexShrink: 0
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', color: 'white', letterSpacing: '1px' }}>CAREER UPDATE</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
            <MdClose size={24} />
          </button>
        </div>

        <div className="modal-body" style={{
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>

          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%'
          }}>
            <img
              src={
                !career.image
                  ? FALLBACK_IMAGE
                  : career.image.startsWith('http')
                    ? career.image
                    : `${import.meta.env.VITE_API_URL}${career.image}`
              }
              alt={career.title}
              style={{
                width: 'auto',
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '45vh',
                display: 'block',
                borderRadius: '4px',
                objectFit: 'contain',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', width: '100%' }}>
            <span style={{
              padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '800',
              backgroundColor: '#fee2e2', color: '#c00000', textTransform: 'uppercase'
            }}>
              {career.category}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px' }}>
              <MdCalendarToday size={14} /> {career.eventDate || new Date(career.datePosted).toLocaleDateString()}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
            color: '#0f172a', marginBottom: '15px', lineHeight: '1.3', fontWeight: '800', width: '100%'
          }}>
            {career.title}
          </h1>

          <div style={{
            lineHeight: '1.7', color: '#334155', fontSize: '15px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%'
          }}>
            {career.content}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '15px 20px', flexShrink: 0 }}>
          <button className="btn-cancel" onClick={onClose} style={{ width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullCareerModal;
