import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, MdOutlineEdit, MdOutlineDelete, MdClose, 
  MdOutlinePersonOutline, MdOutlineMail, MdOutlineLock, 
  MdOutlineVisibilityOff, MdOutlineVisibility, MdBusiness 
} from "react-icons/md";
import Sidebar from '../components/Sidebar'; 
import '../styles/ServiceModal.css'; 
import '../styles/Dashboard.css';
import '../styles/ManagePages.css'; 

const ManageCounselors = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null); 
  const [editingUserId, setEditingUserId] = useState(null);
  const navigate = useNavigate();

  // ✅ NEW: Dynamic Departments State
  const [departmentsDb, setDepartmentsDb] = useState([]);

  // ✅ CLEANED: Removed 'otherDept' entirely
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'counsellor',
    assignedDepartments: [] 
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Fetch Live Departments
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/departments`);
      setDepartmentsDb(res.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) {
      navigate('/');
    } else {
      setUser(JSON.parse(loggedInUser));
    }
    fetchUsers();
    fetchDepartments(); // Call it when component mounts
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDeptToggle = (deptName) => {
    setFormData(prev => {
      const isSelected = prev.assignedDepartments.includes(deptName);
      return {
        ...prev,
        assignedDepartments: isSelected 
          ? prev.assignedDepartments.filter(d => d !== deptName) 
          : [...prev.assignedDepartments, deptName]
      };
    });
  };

  // ✅ CLEANED: Removed otherDept resets
  const openModalForCreate = () => {
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'counsellor', assignedDepartments: [] });
    setIsModalOpen(true);
  };

  const openModalForEdit = (userToEdit) => {
    setEditingUserId(userToEdit._id);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', 
      role: userToEdit.role,
      assignedDepartments: userToEdit.assignedDepartments || []
    });
    setIsModalOpen(true);
  };

  // ✅ CLEANED: Much simpler submission (no merging required)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${editingUserId}`, formData);
        alert("Account updated successfully!");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, formData);
        alert("Account created successfully!");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit form.");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userId}`);
        fetchUsers();
      } catch (error) {
        alert("Failed to delete account.");
      }
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
        <header className="content-header">
          <div className="header-right">
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="user-pill">
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-view" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
            <h2 style={{ color: '#3C3736', margin: 0 }}>Manage Staff Accounts</h2>
            <button onClick={openModalForCreate} className="next-btn new-account-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#c00000', color: 'white', border: 'none', borderRadius: 0, cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <MdAdd size={15} /> New Account
            </button>
          </div>

          <div className="manage-table-wrapper">
            <table className="manage-table" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Departments</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}><b>{u.name}</b><br/><small style={{color: '#64748b'}}>{u.role.toUpperCase()}</small></td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {u.assignedDepartments?.length > 0 ? u.assignedDepartments.map(d => (
                          <span key={d} style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 8px',  border: '1px solid #e2e8f0' }}>{d}</span>
                        )) : <small style={{color: '#94a3b8'}}>None</small>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => openModalForEdit(u)} style={{ color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}><MdOutlineEdit size={18} /></button>
                      <button onClick={() => handleDelete(u._id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><MdOutlineDelete size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" style={overlayStyle}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', padding: '30px',  width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}><MdClose size={24} /></button>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>{editingUserId ? "Edit Account" : "Create New Account"}</h2>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                   <label style={labelStyle}>{editingUserId ? "New Password" : "Password"}</label>
                   <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingUserId} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>System Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} style={inputStyle}>
                    <option value="counsellor">Counsellor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* ✅ DYNAMIC DEPARTMENT CHECKLIST */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MdBusiness /> Assigned Departments
                </label>
                <div style={checklistGridStyle}>
                  {departmentsDb.map(dept => (
                    <label key={dept._id} style={checkItemStyle}>
                      <input 
                        type="checkbox" 
                        checked={formData.assignedDepartments.includes(dept.name)} 
                        onChange={() => handleDeptToggle(dept.name)}
                      />
                      <span style={{ fontSize: '13px' }}>{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ✅ REMOVED THE "OTHER" TEXT INPUT ENTIRELY */}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" style={submitBtnStyle}>{editingUserId ? "Update" : "Register Account"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const thStyle = { padding: '12px 20px', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '15px 20px', fontSize: '14px', color: '#111827' };
const overlayStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 };
const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px',  border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' };
const checklistGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: '#f8fafc', padding: '15px',  border: '1px solid #e2e8f0' };
const checkItemStyle = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const cancelBtnStyle = { padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none',  fontWeight: 'bold', cursor: 'pointer' };
const submitBtnStyle = { padding: '10px 20px', background: '#c00000', color: 'white', border: 'none',  fontWeight: 'bold', cursor: 'pointer' };

// Responsive styles injected via style tag
const responsiveStyles = `
  @media (max-width: 480px) {
    .new-account-btn {
      padding: 6px 8px !important;
      font-size: 12px !important;
      gap: 4px !important;
    }
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('manage-counselors-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'manage-counselors-styles';
  styleEl.textContent = responsiveStyles;
  document.head.appendChild(styleEl);
}

export default ManageCounselors;