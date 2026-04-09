import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdAdd, MdDeleteOutline, MdCloudUpload } from "react-icons/md";
import '../styles/ServiceModal.css'; 

// 1. ADDED `editingService` TO PROPS
const AddServiceModal = ({ isOpen, onClose, onSuccess, editingService }) => {
  if (!isOpen) return null;

  // --- STATE ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. PRE-FILL FORM IF EDITING
  useEffect(() => {
    if (editingService) {
      setName(editingService.name || '');
      setDescription(editingService.description || '');
      setFields(editingService.fields || []);
      // We don't pre-fill selectedFile because you can't set file inputs programmatically.
      // We handle keeping the old image later in the submit function.
    } else {
      // If no editingService, clear the form (Add Mode)
      setName('');
      setDescription('');
      setFields([]);
      setSelectedFile(null);
    }
  }, [editingService, isOpen]); // Re-run when the modal opens or the service changes

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
    let currentWeight = 0;
    const MAX_WEIGHT_PER_PAGE = 7; 

    // 1. Process Fields 
    const finalFields = fields.map((field) => {
      let fieldWeight = 1; 
      if (field.type === 'select' || field.type === 'textarea') fieldWeight = 2;
      if (field.type === 'info') fieldWeight = 3;

      if (currentWeight + fieldWeight > MAX_WEIGHT_PER_PAGE && currentWeight > 0) {
        currentSection++;
        currentWeight = 0; 
      }
      currentWeight += fieldWeight;

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

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('fields', JSON.stringify(finalFields)); 
    
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
    // If we are editing, but NO new file was selected, the backend should keep the old image.

    // 3. Send to Backend (DYNAMIC ROUTE based on mode)
    try {
      if (editingService) {
        // EDIT MODE: Use PATCH or PUT and include the ID
        await axios.patch(`http://localhost:5000/api/services/${editingService._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // ADD MODE: Use POST to root
        await axios.post('http://localhost:5000/api/services', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to save service. Check the console for details.");
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