import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MdOutlineMail, MdOutlineBadge, MdOutlineLock, MdVerifiedUser, MdHistory, MdDomain } from "react-icons/md";
import axios from 'axios'; // Make sure to import axios
import '../styles/Dashboard.css';
import '../styles/ManagePages.css'; 

function Profile() {
  const [user, setUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // NEW: State for showing success/error messages
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) {
      navigate('/');
    } else {
      const userData = JSON.parse(loggedInUser);
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
    }
  }, [navigate]);

  if (!user) return null;

  // --- SUBMIT LOGIC ---
  // --- SUBMIT LOGIC ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // 1. Check if they changed anything
    const nameChanged = name !== user.name;
    const emailChanged = email !== user.email;
    const passwordAttempt = newPassword !== '';

    if (!nameChanged && !emailChanged && !passwordAttempt) {
      setMessage({ type: 'info', text: 'No changes detected.' });
      return;
    }

    // 2. Password Validation (only if they typed something)
    if (passwordAttempt) {
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match.' });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
        return;
      }
    }

    // 3. Build Payload based on Role
    // Admin sends Name/Email if changed. Counselors only ever send password.
    const payload = {};
    if (isAdmin) {
      if (nameChanged) payload.name = name;
      if (emailChanged) payload.email = email;
    }
    if (passwordAttempt) {
      payload.newPassword = newPassword; // Using 'newPassword' to match backend logic
    }

    setIsUpdating(true);
    try {
      const userId = user._id || user.id;
      
      // ✅ Using your existing /:id route
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, payload);

      // ✅ SUCCESS: Update Local Storage so Sidebar/Navbar updates immediately
      if (response.data.user) {
        // We merge the old user data with the new user data from server
        const updatedUserData = { ...user, ...response.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        setUser(updatedUserData);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error("Update error:", error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile.' 
      });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // --- ROLE & DEPARTMENT LOGIC ---
  const isAdmin = user.role === 'admin';
  const assignedDepts = isAdmin 
    ? "Global Administrator (All)" 
    : (user.assignedDepartments?.length > 0 ? user.assignedDepartments.join(", ") : "Unassigned");

  // Dynamic style for disabled inputs
  const getDynamicInputStyle = (isDisabled) => ({
    ...inputStyle,
    backgroundColor: isDisabled ? '#f1f5f9' : '#fcfcfc',
    color: isDisabled ? '#94a3b8' : '#1e293b',
    cursor: isDisabled ? 'not-allowed' : 'text',
    borderColor: isDisabled ? '#e2e8f0' : '#cbd5e1'
  });

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />

      <main className="main-content" style={{ flex: 1 }}>
        <header className="content-header">
          <div className="search-box" style={{ visibility: 'hidden' }}></div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <section className="profile-section">
          <div className="profile-inner">
            
            {/* --- HEADER SECTION --- */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: '0' }}>Profile Settings</h2>
              <p style={{ color: '#64748b', fontSize: '15px', marginTop: '5px' }}>
                {isAdmin 
                  ? "Update your account identity and security credentials." 
                  : "Update your security credentials. Contact an administrator to change your personal details."}
              </p>
            </div>

            {/* --- MESSAGE ALERT BOX --- */}
            {message.text && (
              <div style={{
                padding: '12px 15px',
                marginBottom: '20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: message.type === 'error' ? '#fee2e2' : message.type === 'success' ? '#dcfce7' : '#e0f2fe',
                color: message.type === 'error' ? '#dc2626' : message.type === 'success' ? '#16a34a' : '#0284c7',
                border: `1px solid ${message.type === 'error' ? '#f87171' : message.type === 'success' ? '#4ade80' : '#7dd3fc'}`
              }}>
                {message.text}
              </div>
            )}

            {/* --- QUICK STATS BAR --- */}
            <div className="profile-mini-cards">
              <div style={miniCardStyle}>
                <MdVerifiedUser style={{ color: '#10b981' }} size={20} />
                <div>
                  <p style={miniLabelStyle}>System Role</p>
                  <p style={miniValueStyle}>{user.role.toUpperCase()}</p>
                </div>
              </div>
              <div style={miniCardStyle}>
                <MdDomain style={{ color: '#8b0000' }} size={20} />
                <div>
                  <p style={miniLabelStyle}>Department(s)</p>
                  <p style={miniValueStyle}>{assignedDepts}</p>
                </div>
              </div>
              <div style={miniCardStyle}>
                <MdHistory style={{ color: '#3b82f6' }} size={20} />
                <div>
                  <p style={miniLabelStyle}>Account Status</p>
                  <p style={miniValueStyle}>Active</p>
                </div>
              </div>
            </div>

            {/* --- MAIN FORM CARD --- */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <form onSubmit={handleUpdateProfile} style={{ padding: '40px' }}>
                
                {/* Section 1: Personal Info */}
                <div style={{ marginBottom: '35px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ ...sectionHeaderStyle, margin: 0 }}>Personal Information</h4>
                    {!isAdmin && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>Ask admin to change information</span>}
                  </div>
                  
                  <div className="profile-form-grid">
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <div style={{ position: 'relative' }}>
                        <MdOutlineBadge style={iconStyle} size={20} />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={getDynamicInputStyle(!isAdmin)} disabled={!isAdmin} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <MdOutlineMail style={iconStyle} size={20} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={getDynamicInputStyle(!isAdmin)} disabled={!isAdmin} />
                      </div>
                    </div>
                  </div>
                </div>

                <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', marginBottom: '35px' }} />

                {/* Section 2: Security */}
                <div style={{ marginBottom: '40px' }}>
                  <h4 style={sectionHeaderStyle}>Security & Password</h4>
                  <div className="profile-form-grid">
                    <div>
                      <label style={labelStyle}>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <MdOutlineLock style={iconStyle} size={20} />
                        <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Confirm Password</label>
                      <div style={{ position: 'relative' }}>
                        <MdOutlineLock style={iconStyle} size={20} />
                        <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                    Leave password fields blank if you do not wish to change your current password.
                  </p>
                </div>

                {/* --- BUTTONS --- */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                  <button type="button" onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} style={{ padding: '12px 32px', border: 'none', background: isUpdating ? '#fca5a5' : '#c00000', color: 'white', fontWeight: '700', cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: '0 4px 10px rgba(192, 0, 0, 0.2)' }}>
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

// --- STYLES ---

const sectionHeaderStyle = {
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#c00000',
  marginBottom: '20px',
  fontWeight: '700'
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#475569',
  marginBottom: '8px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 12px 12px 42px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#fcfcfc',
  transition: 'border-color 0.2s'
};

const iconStyle = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#94a3b8'
};

const miniCardStyle = {
  flex: 1,
  background: 'white',
  padding: '15px 20px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const miniLabelStyle = {
  fontSize: '11px',
  color: '#64748b',
  margin: 0,
  textTransform: 'uppercase',
  fontWeight: '700'
};

const miniValueStyle = {
  fontSize: '14px',
  color: '#0f172a',
  margin: 0,
  fontWeight: '600'
};

export default Profile;