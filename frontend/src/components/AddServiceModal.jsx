import React, { useState } from 'react';
import axios from 'axios';
import { MdClose, MdAdd, MdDeleteOutline } from "react-icons/md";
import '../styles/ServiceModal.css'; 

const AddServiceModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  // --- STATE ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]); // Dynamic array of form questions
  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- FIELD BUILDER LOGIC ---
  const handleAddField = () => {
    setFields([...fields, { 
    name: '',       
    label: '', 
    type: 'text', 
    required: false, 
    options: [], 
    content: '' 
    }]);
  };

  const handleFieldChange = (index, key, value) => {
    const updatedFields = [...fields];
    
    // Auto-convert comma-separated text into an array for Dropdowns
    if (key === 'options') {
      updatedFields[index][key] = value.split(',').map(opt => opt.trim());
    } else {
      updatedFields[index][key] = value;
    }
    
    setFields(updatedFields);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

// --- SUBMIT LOGIC ---
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(false);

  let currentSection = 1;
  let currentWeight = 0;
  const MAX_WEIGHT_PER_PAGE = 7; // You can adjust this number

  const finalFields = fields.map((field) => {
    // 1. Assign weight based on type
    let fieldWeight = 1; 
    if (field.type === 'select' || field.type === 'textarea') fieldWeight = 2;
    if (field.type === 'info') fieldWeight = 3;

    // 2. Check if adding this field exceeds the limit
    // We don't want a page to start with a weight over the limit unless it's the first field
    if (currentWeight + fieldWeight > MAX_WEIGHT_PER_PAGE && currentWeight > 0) {
      currentSection++;
      currentWeight = 0; // Reset weight for the new page
    }

    currentWeight += fieldWeight;

    // 3. Standard DB Formatting
    const dbFieldName = field.label
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, idx) => (idx === 0 ? word.toLowerCase() : word.toUpperCase()))
      .replace(/\s+/g, '');

    const fieldObj = {
      name: dbFieldName,
      label: field.label,
      type: field.type,
      required: field.required || false,
      section: currentSection
    };

    if (field.type === 'select') fieldObj.options = field.options;
    if (field.type === 'info') fieldObj.content = field.content;

    return fieldObj;
  });

  try {
    await axios.post('http://localhost:5000/api/services', {
      name,
      description,
      fields: finalFields
    });
    onSuccess();
    onClose();
  } catch (error) {
    alert("Failed to save service.");
  }
};

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card add-service-card">
        
        {/* Header */}
        <div className="modal-header bg-red">
          <h2>CREATE NEW SERVICE</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-form-wrapper">
          <div className="modal-body">
            
            {/* BASIC INFO */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              <div className="input-group">
                <label>SERVICE NAME *</label>
                <input 
                  type="text" required placeholder="e.g. CAREER PLACEMENT"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>DESCRIPTION *</label>
                <textarea 
                  required rows="3" placeholder="Briefly describe what this service provides..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>

            <hr className="divider" />

            {/* FORM BUILDER */}
            <div className="form-section">
              <div className="section-header-row">
                <h3 className="section-title">Custom Form Fields</h3>
                <button type="button" className="btn-add-field" onClick={handleAddField}>
                  <MdAdd size={18} /> Add Question
                </button>
              </div>

            {fields.length === 0 ? (
            <p className="no-fields-msg">Click "Add Question" to build a custom intake form for this service.</p>
            ) : (
            <div className="fields-editor-list">
                {fields.map((field, index) => {
                
                // --- ADD THIS CALCULATION LOGIC HERE ---
                const pointsBefore = fields.slice(0, index).reduce((acc, f) => {
                    if (f.type === 'info') return acc + 3;
                    if (f.type === 'select' || f.type === 'textarea') return acc + 2;
                    return acc + 1;
                }, 0);

                const threshold = 7;
                const isNewPage = pointsBefore > 0 && Math.floor(pointsBefore / threshold) !== Math.floor((pointsBefore - 1) / threshold);
                // --- END OF CALCULATION LOGIC ---

                return (
                    <React.Fragment key={index}>
                    
                    {/* --- ADD THE VISUAL DIVIDER HERE --- */}
                    {isNewPage && (
                        <div className="auto-page-divider">
                        <span>PAGE {Math.floor(pointsBefore / threshold) + 1} STARTS HERE</span>
                        </div>
                    )}

                    <div className="field-editor-box">
                        <div className="editor-row">
                        <div className="input-group flex-2">
                            <label>QUESTION / LABEL</label>
                            <input 
                            type="text" required placeholder="e.g. What is your preferred date?"
                            value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                            />
                        </div>
                        
                        <div className="input-group flex-1">
                            <label>FIELD TYPE</label>
                            <select 
                            value={field.type} onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                            >
                            <option value="text">Short Answer</option>
                            <option value="textarea">Paragraph</option>
                            <option value="email">Email</option>
                            <option value="date">Date Picker</option>
                            <option value="time">Time Picker</option>
                            <option value="select">Dropdown Menu</option>
                            <option value="info">Information Box</option>
                            </select>
                        </div>
                        <button type="button" className="btn-remove-field" onClick={() => handleRemoveField(index)}>
                            <MdDeleteOutline size={20} />
                        </button>
                        </div>

                        {/* CONDITIONAL: Dropdown Options */}
                        {field.type === 'select' && (
                        <div className="input-group options-input">
                            <label>DROPDOWN OPTIONS (Separate with commas)</label>
                            <input 
                            type="text" required placeholder="e.g. Morning, Afternoon, Evening"
                            value={field.options.join(', ')} onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                            />
                        </div>
                        )}

                        {/* CONDITIONAL: Info Text */}
                        {field.type === 'info' && (
                        <div className="input-group info-input">
                            <label>INFORMATION TEXT</label>
                            <textarea 
                            required rows="3" placeholder="Type the instructions or information here..."
                            value={field.content} onChange={(e) => handleFieldChange(index, 'content', e.target.value)}
                            ></textarea>
                        </div>
                        )}

                        <div className="checkbox-group">
                        <input 
                            type="checkbox" id={`req-${index}`}
                            checked={field.required} onChange={(e) => handleFieldChange(index, 'required', e.target.checked)} 
                        />
                        <label htmlFor={`req-${index}`}>Make this field required</label>
                        </div>
                    </div>
                    </React.Fragment>
                );
                })}
            </div>
            )}
            </div>

          </div>

          {/* Form Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddServiceModal;