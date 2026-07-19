import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdAdd, MdDeleteOutline, MdCloudUpload } from "react-icons/md";
import '../styles/ServiceModal.css'; 

const AddServiceModal = ({ isOpen, onClose, onSuccess, editingService }) => {
  if (!isOpen) return null;
  const [insertMenuIndex, setInsertMenuIndex] = useState(null);
  // --- STATE ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresScheduling, setRequiresScheduling] = useState(false);
  const [fields, setFields] = useState([]); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ✅ NEW: State to hold the live database departments
  const [departmentsDb, setDepartmentsDb] = useState([]);

  // ✅ NEW: Fetch departments when modal opens
  useEffect(() => {
    if (isOpen) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/departments`)
        .then(res => setDepartmentsDb(res.data))
        .catch(err => console.error("Error fetching departments for form maker:", err));
    }
  }, [isOpen]);

  // 2. PRE-FILL FORM IF EDITING
  useEffect(() => {
    if (editingService) {
      setName(editingService.name || '');
      setDescription(editingService.description || '');
      setRequiresScheduling(editingService.requiresScheduling || false); 
      // Load all fields directly, no more filtering out vitals!
      setFields(editingService.fields || []); 
    } else {
      setName('');
      setDescription('');
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
    setTimeout(() => {
      const scrollArea = document.querySelector(".form-scroll-area");
      if (scrollArea) {
        scrollArea.scrollTo({
          top: scrollArea.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
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

  // ✅ NEW: Smart Insert Function
  const insertTemplateAt = (index, templateName) => {
    let newFields = [];

    if (templateName === 'blank') {
      newFields = [{ name: '', label: '', type: 'text', required: false, options: [], content: '' }];
    } else if (templateName === 'basic') {
      newFields = [
        { label: "Email Address", type: "email", required: true, options: [] },
        { label: "Full Name (Last, First, M.I.)", type: "text", required: true, options: [] }
      ];
    } else if (templateName === 'academic') {
      newFields = [
        { label: "School / Department", type: "select", required: true, options: [], isSystemLinked: "departments" },
        { label: "Course / Program", type: "select", required: true, options: [], isSystemLinked: "courses", dependsOnLabel: "School / Department" },
        { label: "Year Level", type: "select", required: true, options: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate/Alumni", "N/A"], dependsOnLabel: "Course / Program" }
      ];
    } else if (templateName === 'contact') {
      newFields = [
        { label: "ID Number", type: "text", required: true, options: [] },
        { label: "Mobile Number", type: "text", required: true, options: [] }
      ];
    } else if (templateName === 'appointment') {
      newFields = [
        { label: "Preferred Consultation Method", type: "select", required: true, options: ["Face-to-face", "Google Meet", "Zoom", "Phone Call", "Other"] },
        { label: "Preferred Date", type: "date", required: true, options: [] },
        { label: "Preferred Time", type: "time", required: true, options: [] }
      ];
    }

    const updatedFields = [...fields];
    // splice() inserts the newFields array exactly at (index + 1)
    updatedFields.splice(index + 1, 0, ...newFields); 
    setFields(updatedFields);
    setInsertMenuIndex(null); // Close the menu
  };


  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);


    // Track used keys to prevent duplicate database names
    const usedKeys = new Set(); 

    // 1. Process Fields
    const finalFields = fields.map((field) => {
      // --- THE COMMON FIELD INTERCEPTOR ---
      let dbFieldName = "";
      const lowerLabel = field.label.toLowerCase();

      // NEW: Catch Email and Name to guarantee perfect DB keys
      if (lowerLabel.includes('email')) {
        dbFieldName = 'email';
      }
      else if (lowerLabel.includes('name')) {
        dbFieldName = 'studentName';
      }
      else if (lowerLabel.includes('course') || lowerLabel.includes('program')) {
        dbFieldName = 'courseYear';
      } 
      else if (lowerLabel.includes('department') || lowerLabel.includes('school of')) {
        dbFieldName = 'department';
      } 
      else if (lowerLabel.includes('id number') || lowerLabel.includes('student id')) {
        dbFieldName = 'idNumber';
      } 
      else if (lowerLabel.includes('mobile') || lowerLabel.includes('contact') || lowerLabel.includes('phone')) {
        dbFieldName = 'mobileNumber';
      }
      else if (lowerLabel.includes('date')) {
        dbFieldName = 'preferredDate';
      }
      else if (lowerLabel.includes('time')) {
        dbFieldName = 'preferredTime';
      } 
      else {
        // Fallback: If it's a truly custom question, use Regex Generator
        dbFieldName = field.label
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, idx) => (idx === 0 ? word.toLowerCase() : word.toUpperCase()))
          .replace(/\s+/g, '')
          .replace(/[^a-zA-Z0-9]/g, ''); 
      }

      // --- COLLISION PROTECTION ---
      let finalName = dbFieldName;
      let counter = 1;
      while (usedKeys.has(finalName)) {
        finalName = `${dbFieldName}_${counter}`;
        counter++;
      }
      usedKeys.add(finalName); 

      return {
        ...field,
        name: finalName
      };
    });

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('requiresScheduling', requiresScheduling);
    formData.append('fields', JSON.stringify(finalFields)); 
    if (selectedFile) formData.append('image', selectedFile);

    try {
      const url = editingService 
        ? `${import.meta.env.VITE_API_URL}/api/services/${editingService._id}`
        : `${import.meta.env.VITE_API_URL}/api/services`;
      
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

  // 3. DYNAMIC UI LABELS
  const isEditing = !!editingService;

  // --- QUICK ADD MACROS ---
  const addBasicInfo = () => {
    const basicFields = [
      { label: "Email Address", type: "email", required: true, options: [] },
      { label: "Full Name (Last, First, M.I.)", type: "text", required: true, options: [] }
    ];
    setFields([...fields, ...basicFields]);
  };

  const addAcademicProfile = () => {
    const academicFields = [
      {
        label: "School / Department",
        type: "select",
        required: true,
        options: [], // ✅ Leave empty!
        isSystemLinked: "departments" // ✅ New marker
      },
      {
        label: "Course / Program",
        type: "select", 
        required: true,
        options: [], // ✅ Leave empty!
        isSystemLinked: "courses", // ✅ New marker
        dependsOnLabel: "School / Department" 
      },
      {
        label: "Year Level",
        type: "select",
        required: true,
        options: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate/Alumni", "N/A"],
        dependsOnLabel: "Course / Program" 
      }
    ];

    setFields([...fields, ...academicFields]);
  };
  
  const addContactInfo = () => {
    const contactFields = [
      { label: "ID Number", type: "text", required: true, options: [] },
      { label: "Mobile Number", type: "text", required: true, options: [] }
    ];
    setFields([...fields, ...contactFields]);
  };

  const addAppointmentPrefs = () => {
    const appointmentFields = [
      { 
        label: "Preferred Consultation Method", 
        type: "select", 
        required: true, 
        options: ["Face-to-face", "Google Meet", "Zoom", "Phone Call", "Other"] 
      },
      { label: "Preferred Date", type: "date", required: true, options: [] },
      { label: "Preferred Time", type: "time", required: true, options: [] }
    ];
    setFields([...fields, ...appointmentFields]);
  };


  const miniBtnStyle = {
    padding: '4px 8px', background: '#fff', border: '1px solid #cbd5e1', 
    color: '#475569', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
  };
  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card add-service-card">
        
        <div className="modal-header bg-red" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          position: 'relative', // Ensures button positioning context
          padding: '15px 20px' 
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
            {isEditing ? `EDITING: ${name.toUpperCase()}` : "CREATE NEW SERVICE"}
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

            {/* QUICK ADD TEMPLATES AREA */}
            <div style={{ margin: '5px 0 20px 0', padding: '12px 15px', backgroundColor: '#f4f7fa', borderRadius: '8px', border: '1px dashed #b8cde0' }}>
              <h4 style={{ fontSize: '11px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Quick Add Templates
              </h4>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                Click to auto-generate common question sets. You can edit them after adding.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                
                <button
                  type="button"
                  onClick={addBasicInfo}
                  style={{ padding: '5px 12px', backgroundColor: '#fff', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#e8f0fe'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#fff'; }}
                >
                  + Basic Info (Name & Email)
                </button>

                <button
                  type="button"
                  onClick={addAcademicProfile}
                  style={{ padding: '5px 12px', backgroundColor: '#fff', border: '1px solid #137333', color: '#137333', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#e6f4ea'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#fff'; }}
                >
                  + Academic Profile (Dept, Course, Year)
                </button>

                <button
                  type="button"
                  onClick={addContactInfo}
                  style={{ padding: '5px 12px', backgroundColor: '#fff', border: '1px solid #f29900', color: '#f29900', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#fef7e0'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#fff'; }}
                >
                  + Contact Info (ID & Mobile)
                </button>

                <button
                  type="button"
                  onClick={addAppointmentPrefs}
                  style={{ padding: '5px 12px', backgroundColor: '#fff', border: '1px solid #8e24aa', color: '#8e24aa', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#f3e5f5'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#fff'; }}
                >
                  + Appointment Preferences
                </button>
                
              </div>
            </div>
            
            <hr className="divider" />

            <div className="form-section">
              <div className="section-header-row">
                <h3 className="section-title">Custom Form Fields</h3>
              </div>

            {fields.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  No custom questions yet. Click below to start building!
                </p>
                <button 
                  type="button" 
                  onClick={handleAddField}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: '#fce4e4',
                    color: '#c00000',
                    border: '2px dashed #c00000',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8d7d7'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fce4e4'}
                >
                  <MdAdd size={20} /> Add First Question
                </button>
              </div>
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
                            <label>
                              DROPDOWN OPTIONS 
                              {field.isSystemLinked && <span style={{color: '#1a73e8', marginLeft: '5px'}}>(Linked to Live Database)</span>}
                            </label>
                            <input 
                              type="text" 
                              required 
                              placeholder={field.isSystemLinked ? "Automatically managed by system..." : "e.g. Morning, Afternoon, Evening"}
                              value={field.isSystemLinked ? "" : (field.options || []).join(', ')} 
                              onChange={(e) => !field.isSystemLinked && handleFieldChange(index, 'options', e.target.value)}
                              disabled={!!field.isSystemLinked} // ✅ Gray out the box
                              style={field.isSystemLinked ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
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

                        {/* ✅ UPDATED: Flex row to hold the checkbox AND the insert button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                          <div className="checkbox-group" style={{ margin: 0 }}>
                            <input 
                                type="checkbox" id={`req-${index}`}
                                checked={field.required} onChange={(e) => handleFieldChange(index, 'required', e.target.checked)} 
                            />
                            <label htmlFor={`req-${index}`}>Make this field required</label>
                          </div>
                          
                          {/* 🌟 THE NEW INSERT MENU 🌟 */}
                          {insertMenuIndex === index ? (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '400px' }}>
                              <button type="button" onClick={() => insertTemplateAt(index, 'blank')} style={miniBtnStyle}>+ Blank</button>
                              <button type="button" onClick={() => insertTemplateAt(index, 'basic')} style={{...miniBtnStyle, color: '#1a73e8', borderColor: '#1a73e8'}}>+ Basic</button>
                              <button type="button" onClick={() => insertTemplateAt(index, 'academic')} style={{...miniBtnStyle, color: '#137333', borderColor: '#137333'}}>+ Academic</button>
                              <button type="button" onClick={() => insertTemplateAt(index, 'contact')} style={{...miniBtnStyle, color: '#f29900', borderColor: '#f29900'}}>+ Contact</button>
                              <button type="button" onClick={() => insertTemplateAt(index, 'appointment')} style={{...miniBtnStyle, color: '#8e24aa', borderColor: '#8e24aa'}}>+ Appt</button>
                              <button type="button" onClick={() => setInsertMenuIndex(null)} style={{...miniBtnStyle, background: '#fee2e2', color: '#dc2626', border: 'none'}}>Cancel</button>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => setInsertMenuIndex(index)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1',
                                padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'background 0.2s'
                              }}
                            >
                              <MdAdd size={16} /> Insert Below
                            </button>
                          )}
                        </div>

                    </div>
                    </React.Fragment>
                );
                })}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                    <button 
                      type="button" 
                      onClick={handleAddField}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: '#f8f9fa',
                        color: '#c00000',
                        border: '2px dashed #c00000',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#fce4e4'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                      <MdAdd size={20} /> Add Another Question
                    </button>
                  </div>
            </div>
            )}
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Service' : 'Save Service')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddServiceModal;