import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, 
  MdOutlineEdit, 
  MdOutlineDelete, 
  MdClose, 
  MdOutlinePersonOutline, 
  MdOutlineMail, 
  MdOutlineLock, 
  MdOutlineVisibilityOff, 
  MdOutlineVisibility 
} from "react-icons/md";
import Sidebar from '../components/Sidebar'; 
import '../styles/ServiceModal.css'; 
import '../styles/Dashboard.css'; 

const ManageCounselors = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  // ✅ 1. NEW STATE: Track which user is being edited
  const [editingUserId, setEditingUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'counsellor' 
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
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
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ 2. NEW FUNCTION: Open modal for Creating
  const openModalForCreate = () => {
    setEditingUserId(null); // Clear editing state
    setFormData({ name: '', email: '', password: '', role: 'counsellor' }); // Reset form
    setIsModalOpen(true);
  };

  // ✅ 3. NEW FUNCTION: Open modal for Editing
  const openModalForEdit = (userToEdit) => {
    setEditingUserId(userToEdit._id); // Set the ID we are editing
    // Populate form with existing data. 
    // IMPORTANT: Don't populate password, keep it blank for security.
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', 
      role: userToEdit.role
    });
    setIsModalOpen(true);
  };

  // ✅ 4. UPDATED FUNCTION: Handles both Create and Update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        // --- UPDATE EXISTING USER ---
        // Adjust API call if your route is different! (e.g., PUT vs PATCH)
        await axios.put(`http://localhost:5000/api/users/${editingUserId}`, formData);
        alert("Account updated successfully!");
      } else {
        // --- CREATE NEW USER ---
        await axios.post('http://localhost:5000/api/users/register', formData);
        alert("Account created successfully!");
      }
      
      setIsModalOpen(false);
      fetchUsers(); // Refresh the table
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.response?.data?.message || "Failed to submit form.");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this account? This cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
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
          <div className="search-box">
             <input type="text" placeholder="Search accounts..." />
          </div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill"> 
              <div style={{ margin: '10px' }}></div>
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-view" style={{ padding: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#3C3736', margin: 0 }}>Manage Staff Accounts</h2>
            {/* ✅ UPDATED: Call openModalForCreate */}
            <button 
              onClick={openModalForCreate}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <MdAdd size={20} /> New Account
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Loading accounts...</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '15px 20px', fontWeight: '500', color: '#111827' }}>{u.name}</td>
                      <td style={{ padding: '15px 20px', color: '#4b5563' }}>{u.email}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span className={`case-status-badge ${u.role === 'admin' ? 'active' : 'pending'}`} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px' }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px', display: 'flex', gap: '10px' }}>
                        {/* ✅ UPDATED: Call openModalForEdit */}
                        <button onClick={() => openModalForEdit(u)} style={{ color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer' }}><MdOutlineEdit size={18} /></button>
                        <button onClick={() => handleDelete(u._id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><MdOutlineDelete size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </section>
      </main>

      {/* CREATE / EDIT ACCOUNT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', color: '#1e293b', padding: '35px 30px', borderRadius: '12px', width: '100%', maxWidth: '420px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <MdClose size={24} />
            </button>

            {/* ✅ 5a. DYNAMIC UI: Change Title */}
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1e293b', fontSize: '20px', fontWeight: '700' }}>
              {editingUserId ? "Edit Account" : "Create New Account"}
            </h2>
            
            {/* ✅ UPDATED: Call handleFormSubmit */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <MdOutlinePersonOutline style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., John D. Doe" style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <MdOutlineMail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="admin@ubaguio.edu" style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                  {/* ✅ DYNAMIC UI: Change Label */}
                  {editingUserId ? "Change Password (Leave blank to keep current)" : "Temporary Password"}
                </label>
                <div style={{ position: 'relative' }}>
                  <MdOutlineLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                  {/* ✅ DYNAMIC UI: Password is NOT required when editing */}
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} required={!editingUserId} placeholder="••••••••" style={{ width: '100%', padding: '10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                  >
                    {showPassword ? <MdOutlineVisibility size={20} /> : <MdOutlineVisibilityOff size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>System Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', cursor: 'pointer', color: '#1e293b', boxSizing: 'border-box' }}>
                  <option value="counsellor">Counsellor</option>
                  <option value="admin">Administrator</option>
                </select>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '6px 0 0 0' }}>
                  {formData.role === 'admin' 
                    ? "Administrator account with full access" 
                    : "Counsellor account for managing cases"}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                  Cancel
                </button>
                {/* ✅ 5b. DYNAMIC UI: Change Button Text */}
                <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                  {editingUserId ? "Update Account" : "Create Account"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCounselors;