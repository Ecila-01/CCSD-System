import React from 'react';
import './CaseDetailsModal.css';

const CaseDetailsModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const formatLabel = (key) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };


  const handleUpdateStatus = (newStatus) => {
    alert(`Backend Call: Update status of this request to "${newStatus}"`);
    onClose();
  };

  return (
    <div className="case-modal-overlay">
      <div className="case-modal-container">
        
        {/* HEADER */}
        <div className="case-modal-header">
          <div>
            <h2 className="case-modal-title">{request.serviceName} REQUEST</h2>
            <span className={`status-badge ${request.status.toLowerCase().replace(/\s+/g, '-')}`}>
              Current Status: {request.status}
            </span>
          </div>
          <button className="case-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* BODY - Dynamically mapping through the NoSQL data! */}
        <div className="case-modal-body">
          <div className="details-grid">
            {Object.entries(request.requestData).map(([key, value]) => (
              <div key={key} className="detail-item">
                <span className="detail-label">{formatLabel(key)}:</span>
                {/* If the value is long (like remarks), it drops to a new line, otherwise it sits next to the label */}
                <span className="detail-value" style={{ display: String(value).length > 50 ? 'block' : 'inline', marginTop: String(value).length > 50 ? '5px' : '0' }}>
                  {value || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER - Dynamic Action Buttons */}
        <div className="case-modal-footer">
          <div className="footer-left">
            <button className="btn-secondary" onClick={() => handleUpdateStatus('Declined')}>Decline Request</button>
          </div>
          
          <div className="footer-right">
            {/* Conditional buttons for COUNSELING / REFERRAL */}
            {(request.serviceName === 'COUNSELING' || request.serviceName === 'REFERRAL') && (
              <>
                <button className="btn-warning" onClick={() => handleUpdateStatus('Rescheduled')}>Request Reschedule</button>
                <button className="btn-primary" onClick={() => handleUpdateStatus('Approved')}>Approve Appointment</button>
              </>
            )}

            {/* Conditional buttons for DOCUMENTS */}
            {request.serviceName === 'GOOD MORAL CERTIFICATE' && (
              <>
                <button className="btn-warning" onClick={() => handleUpdateStatus('In Progress')}>Mark In Progress</button>
                <button className="btn-success" onClick={() => handleUpdateStatus('Ready for Pickup')}>Ready for Pickup</button>
              </>
            )}

            <button className="btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CaseDetailsModal;