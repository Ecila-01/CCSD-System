import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import StatusModal from '../components/StatusModal';
import { 
  MdSave, MdAdd, MdDeleteOutline, MdOutlineEdit, 
  MdEmail, MdPhone, MdLocationOn, MdClose 
} from "react-icons/md";
import '../styles/Dashboard.css';
import '../styles/ManagePages.css'; 

const ManageAbout = () => {
  const [formData, setFormData] = useState({
    email: '', phone: '', location: '', missionStatement: '',
    heroDescriptionParagraphs: [], objectives: [], teamMembers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null); 
  const [memberForm, setMemberForm] = useState({ name: '', role: '', departmentTag: '', hierarchyLevel: 2, imageUrl: '' });

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/about`);
        setFormData(res.data);
      } catch (err) {
        console.error("Error fetching about data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAbout();
  }, []);

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (index, field, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field) => setFormData({ ...formData, [field]: [...formData[field], ""] });
  const removeArrayItem = (index, field) => setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });

  // --- NEW: Dynamic Save Function ---
  // Takes the data to save, and the name of the section so the success modal is specific!
  const saveSectionToServer = async (dataToSave, sectionName) => {
    setStatusModal({ isOpen: true, type: 'loading', title: 'Saving...', message: `Updating ${sectionName}...` });
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/about`, dataToSave);
      setStatusModal({
        isOpen: true, type: 'success', title: 'Saved!', message: `${sectionName} has been successfully updated.`,
        onConfirm: () => setStatusModal({ isOpen: false })
      });
    } catch (err) {
      setStatusModal({
        isOpen: true, type: 'error', title: 'Error', message: `Failed to save ${sectionName}.`,
        onConfirm: () => setStatusModal({ isOpen: false })
      });
    }
  };

  const openNewMemberModal = (defaultLevel = 2) => {
    setEditingMemberIndex(null);
    setMemberForm({ name: '', role: '', departmentTag: '', hierarchyLevel: defaultLevel, imageUrl: '' });
    setIsMemberModalOpen(true);
  };

  const openEditMemberModal = (index) => {
    setEditingMemberIndex(index);
    setMemberForm(formData.teamMembers[index]);
    setIsMemberModalOpen(true);
  };

  // --- UPDATED: Save Member & Auto-Push to Database ---
  const saveMemberModal = async (e) => {
    e.preventDefault();
    const updatedMembers = [...formData.teamMembers];
    
    if (editingMemberIndex !== null) {
      updatedMembers[editingMemberIndex] = memberForm; 
    } else {
      updatedMembers.push(memberForm); 
    }
    
    // 1. Update local React state
    const updatedFormData = { ...formData, teamMembers: updatedMembers };
    setFormData(updatedFormData);
    setIsMemberModalOpen(false); // Close modal immediately
    
    // 2. Automatically save to backend without needing a separate button click
    await saveSectionToServer(updatedFormData, 'Org Chart & Team');
  };

  // --- UPDATED: Remove Member & Auto-Push to Database ---
  const removeTeamMember = async (index) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      const updatedMembers = formData.teamMembers.filter((_, i) => i !== index);
      const updatedFormData = { ...formData, teamMembers: updatedMembers };
      
      setFormData(updatedFormData);
      await saveSectionToServer(updatedFormData, 'Org Chart (Member Removed)');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    setIsUploading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMemberForm({ ...memberForm, imageUrl: res.data.imageUrl });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Visual Editor...</div>;

  const membersWithIndex = formData.teamMembers.map((m, i) => ({ ...m, originalIndex: i }));
  const directors = membersWithIndex.filter(m => Number(m.hierarchyLevel) === 1);
  const staff = membersWithIndex.filter(m => Number(m.hierarchyLevel) === 2);
  const assistants = membersWithIndex.filter(m => Number(m.hierarchyLevel) >= 3);

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
        
        {/* ✅ REMOVED the global Publish button from the header */}
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>Visual Editor: About Page</h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Changes made here will reflect directly on the student-facing About page.</p>
          </div>
        </header>

        <section style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* HERO SECTION */}
          <div style={{ ...cardStyle, borderTop: '5px solid #c00000', display: 'flex', flexDirection: 'column' }}>
            <h3 style={visualSectionTag}>Hero Banner & Contact Info</h3>
            <div style={{ display: 'flex', gap: '20px', backgroundColor: '#f8fafc', padding: '15px', marginBottom: '20px' }}>
              <div style={iconInputWrapper}><MdEmail color="#c00000" size={18}/><input type="text" name="email" value={formData.email} onChange={handleTextChange} style={transparentInput} placeholder="Email Address"/></div>
              <div style={iconInputWrapper}><MdPhone color="#c00000" size={18}/><input type="text" name="phone" value={formData.phone} onChange={handleTextChange} style={transparentInput} placeholder="Phone / Local"/></div>
              <div style={iconInputWrapper}><MdLocationOn color="#c00000" size={18}/><input type="text" name="location" value={formData.location} onChange={handleTextChange} style={transparentInput} placeholder="Location"/></div>
            </div>

            {formData.heroDescriptionParagraphs.map((para, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '15px' }}>
                <textarea value={para} onChange={(e) => handleArrayChange(i, 'heroDescriptionParagraphs', e.target.value)} style={visualTextArea} placeholder="Type hero paragraph here..." />
                <button onClick={() => removeArrayItem(i, 'heroDescriptionParagraphs')} style={floatingDeleteBtn} title="Remove Paragraph"><MdDeleteOutline size={18}/></button>
              </div>
            ))}
            <button onClick={() => addArrayItem('heroDescriptionParagraphs')} style={addBtnStyle}>+ Add Another Paragraph</button>
            
            {/* ✅ NEW: Hero Save Button */}
            <button onClick={() => saveSectionToServer(formData, 'Hero Section')} style={sectionSaveBtnStyle}>
              <MdSave size={18} /> Save Hero Section
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
            
            {/* MISSION SECTION */}
            <div style={{ ...cardStyle, borderTop: '5px solid #0f172a', display: 'flex', flexDirection: 'column' }}>
              <h3 style={visualSectionTag}>Our Mission</h3>
              <textarea name="missionStatement" value={formData.missionStatement} onChange={handleTextChange} style={{ ...visualTextArea, height: '100%', minHeight: '200px', marginBottom: '15px' }} placeholder="Enter the official mission statement..." />
              
              {/* ✅ NEW: Mission Save Button */}
              <button onClick={() => saveSectionToServer(formData, 'Mission Statement')} style={sectionSaveBtnStyle}>
                <MdSave size={18} /> Save Mission
              </button>
            </div>
            
            {/* OBJECTIVES SECTION */}
            <div style={{ ...cardStyle, borderTop: '5px solid #0f172a', display: 'flex', flexDirection: 'column' }}>
              <h3 style={visualSectionTag}>Our Objectives</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
                {formData.objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: '#f8fafc', padding: '10px', }}>
                    <div style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>{i + 1}</div>
                    <textarea value={obj} onChange={(e) => handleArrayChange(i, 'objectives', e.target.value)} style={{...visualTextArea, padding: 0, backgroundColor: 'transparent', border: 'none', height: '60px'}} />
                    <button onClick={() => removeArrayItem(i, 'objectives')} style={{...floatingDeleteBtn, position: 'static'}}><MdDeleteOutline size={18}/></button>
                  </div>
                ))}
                <button onClick={() => addArrayItem('objectives')} style={addBtnStyle}>+ Add Objective</button>
              </div>

              {/* ✅ NEW: Objectives Save Button */}
              <button onClick={() => saveSectionToServer(formData, 'Objectives')} style={{...sectionSaveBtnStyle, marginTop: '20px'}}>
                <MdSave size={18} /> Save Objectives
              </button>
            </div>
          </div>

          <div style={{ ...cardStyle, borderTop: '5px solid #e2b05f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
               <h3 style={{...visualSectionTag, marginBottom: '0', fontSize: '16px'}}>Organizational Chart & Team</h3>
               <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>* Changes to team members are saved automatically.</span>
            </div>

            {/* LEVEL 1: DIRECTOR */}
            <div style={{ marginBottom: '50px' }}>
              <div style={levelHeaderStyle}>
                <h4 style={levelTitleStyle}>Level 1: Director</h4>
                <button onClick={() => openNewMemberModal(1)} style={addLevelBtnStyle}><MdAdd size={16}/> Add Director</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '40px 20px', paddingTop: '20px' }}>
                {directors.map((member) => (
                  <div key={member.originalIndex} className="visual-profile-card" style={profileCardStyle}>
                    <div style={profilePhotoWrap}>
                      <img 
                        src={
                          !member.imageUrl 
                            ? "https://www.gravatar.com/avatar/?d=mp" 
                            : member.imageUrl.startsWith('http') 
                              ? member.imageUrl 
                              : `${import.meta.env.VITE_API_URL}${member.imageUrl}`
                        } 
                        alt={member.name} 
                        style={profilePhoto} 
                        onError={(e) => { e.target.src = "https://www.gravatar.com/avatar/?d=mp"; }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '45px' }}>
                      {member.departmentTag && <span style={profileTag}>{member.departmentTag}</span>}
                      <h4 style={{ margin: '8px 0 2px 0', color: '#0f172a', fontSize: '15px' }}>{member.name || "Unnamed"}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{member.role || "No Role"}</p>
                    </div>
                    <div className="profile-actions" style={profileActionsOverlay}>
                      <button onClick={() => openEditMemberModal(member.originalIndex)} style={actionBtnEdit}><MdOutlineEdit size={16}/> Edit</button>
                      <button onClick={() => removeTeamMember(member.originalIndex)} style={actionBtnDelete}><MdDeleteOutline size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL 2: STAFF */}
            <div style={{ marginBottom: '50px' }}>
              <div style={levelHeaderStyle}>
                <h4 style={levelTitleStyle}>Level 2: Staff (Psychometricians & Associates)</h4>
                <button onClick={() => openNewMemberModal(2)} style={addLevelBtnStyle}><MdAdd size={16}/> Add Staff</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '40px 20px', paddingTop: '20px' }}>
                {staff.map((member) => (
                  <div key={member.originalIndex} className="visual-profile-card" style={profileCardStyle}>
                    <div style={profilePhotoWrap}>
                      <img 
                        src={
                          !member.imageUrl 
                            ? "https://www.gravatar.com/avatar/?d=mp" 
                            : member.imageUrl.startsWith('http') 
                              ? member.imageUrl 
                              : `${import.meta.env.VITE_API_URL}${member.imageUrl}`
                        } 
                        alt={member.name} 
                        style={profilePhoto} 
                        onError={(e) => { e.target.src = "https://www.gravatar.com/avatar/?d=mp"; }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '45px' }}>
                      {member.departmentTag && <span style={profileTag}>{member.departmentTag}</span>}
                      <h4 style={{ margin: '8px 0 2px 0', color: '#0f172a', fontSize: '15px' }}>{member.name || "Unnamed"}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{member.role || "No Role"}</p>
                    </div>
                    <div className="profile-actions" style={profileActionsOverlay}>
                      <button onClick={() => openEditMemberModal(member.originalIndex)} style={actionBtnEdit}><MdOutlineEdit size={16}/> Edit</button>
                      <button onClick={() => removeTeamMember(member.originalIndex)} style={actionBtnDelete}><MdDeleteOutline size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL 3: ASSISTANTS */}
            <div>
              <div style={levelHeaderStyle}>
                <h4 style={levelTitleStyle}>Level 3: Student Assistants</h4>
                <button onClick={() => openNewMemberModal(3)} style={addLevelBtnStyle}><MdAdd size={16}/> Add Assistant</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '40px 20px', paddingTop: '20px' }}>
                {assistants.map((member) => (
                  <div key={member.originalIndex} className="visual-profile-card" style={profileCardStyle}>
                    <div style={profilePhotoWrap}>
                      <img 
                        src={
                          !member.imageUrl 
                            ? "https://www.gravatar.com/avatar/?d=mp" 
                            : member.imageUrl.startsWith('http') 
                              ? member.imageUrl 
                              : `${import.meta.env.VITE_API_URL}${member.imageUrl}`
                        } 
                        alt={member.name} 
                        style={profilePhoto} 
                        onError={(e) => { e.target.src = "https://www.gravatar.com/avatar/?d=mp"; }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '45px' }}>
                      {member.departmentTag && <span style={profileTag}>{member.departmentTag}</span>}
                      <h4 style={{ margin: '8px 0 2px 0', color: '#0f172a', fontSize: '15px' }}>{member.name || "Unnamed"}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{member.role || "No Role"}</p>
                    </div>
                    <div className="profile-actions" style={profileActionsOverlay}>
                      <button onClick={() => openEditMemberModal(member.originalIndex)} style={actionBtnEdit}><MdOutlineEdit size={16}/> Edit</button>
                      <button onClick={() => removeTeamMember(member.originalIndex)} style={actionBtnDelete}><MdDeleteOutline size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* --- EDIT TEAM MEMBER MODAL --- */}
      {isMemberModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <button onClick={() => setIsMemberModalOpen(false)} style={modalCloseBtn}><MdClose size={24} /></button>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>{editingMemberIndex !== null ? 'Edit Team Member' : 'New Team Member'}</h2>
            
            <form onSubmit={saveMemberModal} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                 <img 
                    src={
                      !memberForm.imageUrl 
                        ? "https://www.gravatar.com/avatar/?d=mp" 
                        : (memberForm.imageUrl.startsWith('blob:') || memberForm.imageUrl.startsWith('http'))
                          ? memberForm.imageUrl 
                          : `${import.meta.env.VITE_API_URL}${memberForm.imageUrl}`
                    } 
                    alt="Preview" 
                    style={{
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      border: '2px solid #e2e8f0'
                    }}
                    onError={(e) => { e.target.src = "https://www.gravatar.com/avatar/?d=mp"; }}
                  />
                 <div style={{ flex: 1 }}>
                   <label style={labelStyle}>Profile Photo</label>
                   
                   <input 
                     type="file" 
                     accept="image/*" 
                     onChange={handleImageUpload} 
                     disabled={isUploading}
                     style={{...inputStyle, padding: '8px', cursor: 'pointer'}} 
                   />
                   
                   {isUploading && <span style={{fontSize: '12px', color: '#2563eb', display: 'block', marginTop: '5px'}}>Uploading image...</span>}
                 </div>
              </div>

              <div>
                <label style={labelStyle}>Full Name <span style={{color:'red'}}>*</span></label>
                <input type="text" value={memberForm.name} onChange={(e) => setMemberForm({...memberForm, name: e.target.value})} required style={inputStyle} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Role <span style={{color:'red'}}>*</span></label>
                  <input type="text" value={memberForm.role} onChange={(e) => setMemberForm({...memberForm, role: e.target.value})} required style={inputStyle} placeholder="e.g. Guidance Associate" />
                </div>
                <div>
                  <label style={labelStyle}>Department Tag</label>
                  <input type="text" value={memberForm.departmentTag} onChange={(e) => setMemberForm({...memberForm, departmentTag: e.target.value})} style={inputStyle} placeholder="e.g. SIT & DAS" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Hierarchy Level</label>
                <select value={memberForm.hierarchyLevel} onChange={(e) => setMemberForm({...memberForm, hierarchyLevel: parseInt(e.target.value)})} style={inputStyle}>
                  <option value={1}>1 - Director (Top Center)</option>
                  <option value={2}>2 - Staff (Psychometricians & Guidance Associates)</option>
                  <option value={3}>3 - Student Assistants (Bottom Row)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsMemberModalOpen(false)} style={addBtnStyle}>
                  Cancel
                </button>
                
                {/* ✅ UPDATED: Disable button while uploading and change text */}
                <button 
                  type="submit" 
                  style={{
                    ...saveBtnStyle, 
                    opacity: isUploading ? 0.6 : 1, // Make it look faded when disabled
                    cursor: isUploading ? 'not-allowed' : 'pointer'
                  }} 
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StatusModal isOpen={statusModal.isOpen} type={statusModal.type} title={statusModal.title} message={statusModal.message} onConfirm={statusModal.onConfirm} />
    </div>
  );
};

// --- VISUAL STYLES ---
const cardStyle = { backgroundColor: 'white', padding: '30px',  border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const visualSectionTag = { margin: '0 0 20px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' };

const iconInputWrapper = { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, backgroundColor: 'white', padding: '8px 12px', border: '1px solid #cbd5e1' };
const transparentInput = { border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#334155', fontWeight: '500' };
const visualTextArea = { width: '100%', padding: '15px', border: '1px solid #cbd5e1', fontSize: '15px', fontFamily: 'inherit', color: '#1e293b', lineHeight: '1.5', resize: 'vertical', backgroundColor: '#f8fafc', boxSizing: 'border-box' };

const floatingDeleteBtn = { position: 'absolute', top: '10px', right: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s' };
const addBtnStyle = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'transparent', color: '#2563eb', border: '1px dashed #93c5fd', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' };
const sectionsaveBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#c00000', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' };

// --- ORG CHART VISUAL CARD STYLES ---
const levelHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' };
const levelTitleStyle = { margin: 0, color: '#0f172a', fontSize: '16px' };
const addLevelBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };

const profileCardStyle = { position: 'relative', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', paddingTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const profilePhotoWrap = { position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '70px', borderRadius: '50%', border: '4px solid white', backgroundColor: '#f1f5f9', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const profilePhoto = { width: '100%', height: '100%', objectFit: 'cover' };
const profileTag = { display: 'inline-block', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', marginBottom: '5px' };
const profileActionsOverlay = { display: 'flex', gap: '5px', marginTop: '15px', width: '100%', justifyContent: 'center' };
const actionBtnEdit = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f1f5f9', border: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', flex: 1, justifyContent: 'center' };
const actionBtnDelete = { backgroundColor: '#fee2e2', border: 'none', padding: '6px 12px', cursor: 'pointer', color: '#dc2626' };

// --- MODAL STYLES ---
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' };
const modalContent = { backgroundColor: 'white', padding: '30px', width: '100%', maxWidth: '500px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' };
const modalCloseBtn = { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' };

export default ManageAbout;