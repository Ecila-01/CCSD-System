import React from 'react';
import { 
  MdClose, MdOutlineShortText, MdOutlineNotes, MdOutlineEmail, 
  MdOutlineCalendarToday, MdOutlineAccessTime, MdOutlineArrowDropDownCircle, MdOutlineInfo
} from "react-icons/md";
import '../styles/ServiceModal.css'; 

const ServiceModal = ({ service, onClose, onEdit, onDelete }) => {
  if (!service) return null;

  const getFieldTypeDisplay = (type) => {
    switch (type?.toLowerCase()) {
      case 'text': return { label: 'Short Answer', icon: <MdOutlineShortText size={16} /> };
      case 'textarea': return { label: 'Paragraph', icon: <MdOutlineNotes size={16} /> };
      case 'email': return { label: 'Email Input', icon: <MdOutlineEmail size={16} /> };
      case 'date': return { label: 'Date Picker', icon: <MdOutlineCalendarToday size={16} /> };
      case 'time': return { label: 'Time Picker', icon: <MdOutlineAccessTime size={16} /> };
      case 'select': return { label: 'Dropdown Menu', icon: <MdOutlineArrowDropDownCircle size={16} /> };
      case 'info': return { label: 'Information Text', icon: <MdOutlineInfo size={16} /> };
      default: return { label: 'Input Field', icon: <MdOutlineShortText size={16} /> };
    }
  };

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card">
        
        <div className="modal-header bg-red" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          position: 'relative', // Ensures button positioning context
          padding: '15px 20px' 
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
            {service.name}
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
          
          {/* NEW: IMAGE DISPLAY SECTION */}
          {service.image && (
            <div className="modal-detail-group">
              <label>SERVICE IMAGE</label>
              <div className="modal-image-wrapper" style={{ textAlign: 'center', backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #eee' }}>
              <img 
                src={
                  service.image?.startsWith('http') 
                    ? service.image 
                    : `${import.meta.env.VITE_API_URL}${service.image}`
                } 
                alt={service.name} 
                style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }} 
              />
              </div>
            </div>
          )}

          <div className="modal-detail-group">
            <label>DESCRIPTION</label>
            <p>{service.description}</p>
          </div>

          <div className="modal-detail-group">
            <label>CONFIGURED FORM FIELDS ({service.fields?.length || 0})</label>
            
            {service.fields && service.fields.length > 0 ? (
              <div className="fields-preview-list">
                {service.fields.map((field, i) => {
                  const typeInfo = getFieldTypeDisplay(field.type);
                  
                  return (
                    <div key={i} className="field-preview-item">
                      
                      <div className="field-header-row">
                        <div className="field-label-group">
                          <span className="field-req">{field.required ? '*' : ''}</span>
                          <span className="field-label">{field.label}</span>
                        </div>
                        
                        <div className="field-type-badge">
                          {typeInfo.icon}
                          <span>{typeInfo.label}</span>
                        </div>
                      </div>

                    {field.type === 'select' && field.options && field.options.length > 0 && (
                        <div className="field-options-list">
                          <span className="options-label">OPTIONS:</span>
                          {field.options.map((opt, idx) => (
                            <span key={idx} className="option-pill">{opt}</span>
                          ))}
                        </div>
                      )}

                      {field.type === 'info' && field.content && (
                        <div className="field-info-preview">
                          {field.content}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-fields">No custom form fields configured.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-delete-large" 
            onClick={() => onDelete(service._id)}
          >
            Delete Service
          </button>
          <button 
            className="btn-edit-large" 
            onClick={() => onEdit(service)}
          >
            Edit Service
          </button>
        </div>

      </div>
    </div>
  );
};

export default ServiceModal;