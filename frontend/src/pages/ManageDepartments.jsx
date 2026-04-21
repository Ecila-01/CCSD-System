import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, MdOutlineEdit, MdOutlineDelete, MdClose, MdBusiness, MdSchool 
} from "react-icons/md";
import Sidebar from '../components/Sidebar'; 
import StatusModal from '../components/StatusModal'; // ✅ Imported StatusModal
import '../styles/Dashboard.css'; 

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // User auth state
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({ name: '', fullName: '', courses: [] });
  const [courseInput, setCourseInput] = useState(''); 

  // ✅ Status Modal State
  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null, onCancel: null 
  });

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/departments`);
      setDepartments(res.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      navigate('/dashboard'); 
    } else {
      setUser(loggedInUser);
      fetchDepartments();
    }
  }, [navigate]);

  // --- MODAL HANDLERS ---
  const openModalForCreate = () => {
    setEditingId(null);
    setFormData({ name: '', fullName: '', courses: [] });
    setCourseInput('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (dept) => {
    setEditingId(dept._id);
    setFormData({ name: dept.name, fullName: dept.fullName || '', courses: dept.courses || [] });
    setCourseInput('');
    setIsModalOpen(true);
  };

  // --- COURSE TAG HANDLERS ---
  const handleAddCourse = (e) => {
    e.preventDefault();
    const cleanCourse = courseInput.trim().toUpperCase();
    if (cleanCourse && !formData.courses.includes(cleanCourse)) {
      setFormData({ ...formData, courses: [...formData.courses, cleanCourse] });
      setCourseInput(''); 
    }
  };

  const handleRemoveCourse = (courseToRemove) => {
    setFormData({
      ...formData,
      courses: formData.courses.filter(c => c !== courseToRemove)
    });
  };

  // --- SUBMIT / DELETE LOGIC (USING STATUS MODAL) ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(false); // Close the form modal first
    setStatusModal({ isOpen: true, type: 'loading', title: 'Saving...', message: 'Please wait' });

    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/departments/${editingId}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/departments`, formData);
      }
      
      fetchDepartments();
      
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: editingId ? 'Updated!' : 'Created!',
        message: `Department successfully ${editingId ? 'updated' : 'added'}.`,
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });

    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || "Failed to save department.",
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });
    }
  };

  const triggerDelete = (id) => {
    setStatusModal({
      isOpen: true,
      type: 'delete_confirm',
      title: 'Delete Department?',
      message: 'Are you sure you want to permanently delete this department?',
      onConfirm: () => finalDelete(id),
      onCancel: () => setStatusModal({ ...statusModal, isOpen: false })
    });
  };

  const finalDelete = async (id) => {
    setStatusModal({ isOpen: true, type: 'loading', title: 'Deleting...', message: 'Please wait...' });
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/departments/${id}`);
      fetchDepartments();
      
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Deleted!',
        message: 'Department successfully deleted.',
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: "Failed to delete department.",
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
        
        {/* HEADER */}
        <header className="content-header">
          <div className="search-box"><input type="text" placeholder="Search departments..." /></div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div style={{ margin: '5px' }}></div>
            <div className="user-pill"><span className="role-tag">{user.role}</span></div>
          </div>
        </header>

        {/* MAIN VIEW */}
        <section className="dashboard-view" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#3C3736', margin: 0 }}>Manage Departments & Courses</h2>
            <button onClick={openModalForCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#C3151C', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              <MdAdd size={20} /> New Department
            </button>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Full Name</th>
                  <th style={thStyle}>Courses / Programs</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Loading departments...</td></tr>
                ) : (
                  departments.map(dept => (
                    <tr key={dept._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#cc0000' }}>{dept.name}</td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{dept.fullName || <em style={{color:'#94a3b8'}}>Not specified</em>}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {dept.courses?.length > 0 ? dept.courses.map(course => (
                            <span key={course} style={{ fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '4px 8px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                              {course}
                            </span>
                          )) : <span style={{fontSize: '12px', color: '#94a3b8'}}>No courses added</span>}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => openModalForEdit(dept)} style={{ color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}><MdOutlineEdit size={18} /></button>
                        <button onClick={() => triggerDelete(dept._id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><MdOutlineDelete size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', padding: '30px', width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><MdClose size={24} /></button>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>{editingId ? "Edit Department" : "New Department"}</h2>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Dept Code <span style={{color: 'red'}}>*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} required placeholder="e.g. SIT" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. School of Info Tech" style={inputStyle} />
                </div>
              </div>

              {/* COURSE MANAGEMENT SECTION */}
              <div style={{ marginTop: '10px', background: '#f8fafc', padding: '15px', border: '1px solid #e2e8f0' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MdSchool /> Associated Courses
                </label>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    value={courseInput} 
                    onChange={(e) => setCourseInput(e.target.value)} 
                    placeholder="Type course (e.g. BSCS) and click Add" 
                    style={{ ...inputStyle, flex: 1 }} 
                    onKeyDown={(e) => { if(e.key === 'Enter') handleAddCourse(e); }} 
                  />
                  <button type="button" onClick={handleAddCourse} style={{ background: '#2e2e2e', color: 'white', border: 'none', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Add
                  </button>
                </div>

                {/* Display added courses as removable pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '30px' }}>
                  {formData.courses.length === 0 ? (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No courses added yet.</span>
                  ) : (
                    formData.courses.map(course => (
                      <div key={course} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' }}>
                        {course}
                        <MdClose size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleRemoveCourse(course)} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#cc0000', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  {editingId ? "Update Department" : "Save Department"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* THE GLOBAL STATUS MODAL */}
      <StatusModal 
        isOpen={statusModal.isOpen} 
        type={statusModal.type} 
        title={statusModal.title} 
        message={statusModal.message} 
        onConfirm={statusModal.onConfirm}
        onCancel={statusModal.onCancel} 
      />
    </div>
  );
};

// --- STYLES ---
const thStyle = { padding: '12px 20px', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '15px 20px', fontSize: '14px', color: '#111827' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' };

export default ManageDepartments;