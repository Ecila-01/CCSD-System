import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdAdd, MdDeleteOutline, MdCloudUpload } from "react-icons/md";
import '../styles/ServiceModal.css'; 


const VITAL_FIELDS = [
  { name: 'email', label: 'Email Address', type: 'email', required: true, section: 1 },
  { name: 'studentName', label: 'Full Name (Last, First, M.I.)', type: 'text', required: true, section: 1 },
];
// 1. ADDED `editingService` TO PROPS
const AddServiceModal = ({ isOpen, onClose, onSuccess, editingService }) => {
  if (!isOpen) return null;

  // --- STATE ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresScheduling, setRequiresScheduling] = useState(false);
  const [fields, setFields] = useState([]); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. PRE-FILL FORM IF EDITING
  useEffect(() => {
    if (editingService) {
      setName(editingService.name || '');
      setDescription(editingService.description || '');
      // NEW: Pre-fill the flag
      setRequiresScheduling(editingService.requiresScheduling || false); 

      const customOnly = (editingService.fields || []).filter(
        f => f.name !== 'email' && f.name !== 'studentName'
      );
      setFields(editingService.fields || []);
    } else {
      setName('');
      setDescription('');
      // NEW: Reset the flag
      setRequiresScheduling(false); 
      setFields([]);
      setSelectedFile(null);
    }
  }, [editingService, isOpen]);

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
    setIsSubmitting(true);

    let currentSection = 1;
    let currentWeight = 2; // Start at 2 because the 2 Vital Fields take up space on Page 1
    const MAX_WEIGHT_PER_PAGE = 7; 

    // 1. Process Custom Fields and combine with Vitals
    const customFields = fields.map((field) => {
      let fieldWeight = 1; 
      if (field.type === 'select' || field.type === 'textarea') fieldWeight = 2;
      if (field.type === 'info') fieldWeight = 3;

      if (currentWeight + fieldWeight > MAX_WEIGHT_PER_PAGE) {
        currentSection++;
        currentWeight = 0; 
      }
      currentWeight += fieldWeight;

      // IMPROVED NAMING LOGIC
      let dbFieldName = field.label
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, idx) => (idx === 0 ? word.toLowerCase() : word.toUpperCase()))
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters like ?, !, ( )

      // Safeguard: If user names a custom field "Email", it won't collide with the vital one
      if (dbFieldName === 'email' || dbFieldName === 'studentName') {
        dbFieldName = `custom_${dbFieldName}`;
      }

      return {
        ...field,
        name: dbFieldName,
        section: currentSection
      };
    });

    // Combine: Vitals are ALWAYS at the start of Section 1
    const finalFields = [...VITAL_FIELDS, ...customFields];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('requiresScheduling', requiresScheduling);
    formData.append('fields', JSON.stringify(finalFields)); 
    if (selectedFile) formData.append('image', selectedFile);

    try {
      const url = editingService 
        ? `http://localhost:5000/api/services/${editingService._id}`
        : 'http://localhost:5000/api/services';
      
      const method = editingService ? 'patch' : 'post';

      await axios[method](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. DYNAMIC UI LABELS (Change text based on mode)
  const isEditing = !!editingService;
  
  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card add-service-card">
        
        <div className="modal-header bg-red">
          {/* Change Header Text */}
          <h2>{isEditing ? `EDITING: ${name.toUpperCase()}` : "CREATE NEW SERVICE"}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-wrapper">
          <div className="modal-body">
            
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
              <div className="input-group">
                <label>APPOINTMENT SETTINGS</label>
                <div className="checkbox-group" style={{ 
                    marginTop: '5px', 
                    padding: '10px 15px', 
                    background: '#f8f9fa', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd' 
                }}>
                  <input 
                    type="checkbox" 
                    id="req-scheduling"
                    checked={requiresScheduling} 
                    onChange={(e) => setRequiresScheduling(e.target.checked)} 
                    style={{ width: 'auto', marginRight: '10px' }}
                  />
                  <label htmlFor="req-scheduling" style={{ fontWeight: 'normal', color: '#333' }}>
                    This service requires a calendar appointment (Date & Time).
                  </label>
                </div>
              </div>
              <div className="input-group">
                <label>SERVICE IMAGE *</label>
                <div className="image-upload-container">
                  {/* If you want to add a preview here too, you can add a preview state like in Announcements */}
                  <label className="upload-placeholder">
                    <MdCloudUpload size={30} />
                    <span>{selectedFile ? selectedFile.name : "Click to upload service image"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      required={!isEditing} 
                      onChange={(e) => setSelectedFile(e.target.files[0])} 
                    />
                  </label>
                </div>
                <p className="file-hint">Recommended size: 800×400px</p>
              </div>
            </div>
            <hr className="divider" />

            {/* NEW: VITAL FIELDS PREVIEW (Read Only) */}
            <div className="form-section">
              <h3 className="section-title">Required Information</h3>
              <p className="file-hint" style={{ marginBottom: '10px' }}>
                The following fields are automatically included in Page 1 of every service.
              </p>
              <div className="vitals-preview-box" style={{ 
                background: '#f1f3f4', 
                padding: '15px', 
                borderRadius: '8px', 
                border: '1px dashed #ccc',
                display: 'flex',
                gap: '10px'
              }}>
                <span className="vital-tag" style={{ background: '#fff', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid #ddd' }}>📧 Email Address</span>
                <span className="vital-tag" style={{ background: '#fff', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid #ddd' }}>👤 Full Name</span>
              </div>
            </div>
            <hr className="divider" />

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
                
                const pointsBefore = fields.slice(0, index).reduce((acc, f) => {
                    if (f.type === 'info') return acc + 3;
                    if (f.type === 'select' || f.type === 'textarea') return acc + 2;
                    return acc + 1;
                }, 0);

                const threshold = 7;
                const isNewPage = pointsBefore > 0 && Math.floor(pointsBefore / threshold) !== Math.floor((pointsBefore - 1) / threshold);

                return (
                    <React.Fragment key={index}>
                    
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

                        {field.type === 'select' && (
                        <div className="input-group options-input">
                            <label>DROPDOWN OPTIONS (Separate with commas)</label>
                            <input 
                            type="text" required placeholder="e.g. Morning, Afternoon, Evening"
                            // SAFEGUARD: Ensure options is treated as an array even if undefined
                            value={(field.options || []).join(', ')} 
                            onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                            />
                        </div>
                        )}

                        {field.type === 'info' && (
                        <div className="input-group info-input">
                            <label>INFORMATION TEXT</label>
                            <textarea 
                            required rows="3" placeholder="Type the instructions or information here..."
                            value={field.content || ''} 
                            onChange={(e) => handleFieldChange(index, 'content', e.target.value)}
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

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {/* Change Button Text */}
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Service' : 'Save Service')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddServiceModal;