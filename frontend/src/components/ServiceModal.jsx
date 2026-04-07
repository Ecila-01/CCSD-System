import React from 'react';
import { 
  MdClose, MdOutlineShortText, MdOutlineNotes, MdOutlineEmail, 
  MdOutlineCalendarToday, MdOutlineAccessTime, MdOutlineArrowDropDownCircle, MdOutlineInfo
} from "react-icons/md";
import '../styles/ServiceModal.css'; // Make sure we import the CSS!

const ServiceModal = ({ service, onClose, onEdit, onDelete }) => {
  // If no service is clicked, don't render the modal at all
  if (!service) return null;

  // The Translator Function: Turns raw database text into beautiful UI labels with icons
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
        
        {/* Modal Header - Styled with a bold red background like your mockup */}
        <div className="modal-header bg-red">
          <h2>{service.name}</h2>
          <button className="close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="modal-detail-group">
            <label>DESCRIPTION</label>
            <p>{service.description}</p>
          </div>

          <div className="modal-detail-group">
            <label>CONFIGURED FORM FIELDS ({service.fields?.length || 0})</label>
            
            {/* Shows a beautifully formatted list of custom fields */}
            {service.fields && service.fields.length > 0 ? (
              <div className="fields-preview-list">
                {service.fields.map((field, i) => {
                  const typeInfo = getFieldTypeDisplay(field.type);
                  
                  return (
                    <div key={i} className="field-preview-item">
                      
                      {/* Top Row: Label and Type Badge */}
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

                      {/* Bottom Row: Options (Only shows if it's a select field) */}
                    {field.type === 'select' && field.options && field.options.length > 0 && (
                        <div className="field-options-list">
                          <span className="options-label">OPTIONS:</span>
                          {field.options.map((opt, idx) => (
                            <span key={idx} className="option-pill">{opt}</span>
                          ))}
                        </div>
                      )}

                      {/* NEW: Information Content (Only shows if it's an info field) */}
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

        {/* Modal Footer (Actions) */}
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