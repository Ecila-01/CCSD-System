import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MdOutlineMail, MdOutlineBadge, MdOutlineLock, MdVerifiedUser, MdHistory } from "react-icons/md";
import '../styles/Dashboard.css'; 

function Profile() {
  const [user, setUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

        <section style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '700px' }}>
            
            {/* --- HEADER SECTION --- */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: '0' }}>Profile Settings</h2>
              <p style={{ color: '#64748b', fontSize: '15px', marginTop: '5px' }}>Update your account identity and security credentials.</p>
            </div>

            {/* --- QUICK STATS BAR --- */}
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '25px' 
            }}>
              <div style={miniCardStyle}>
                <MdVerifiedUser style={{ color: '#10b981' }} size={20} />
                <div>
                  <p style={miniLabelStyle}>System Role</p>
                  <p style={miniValueStyle}>{user.role.toUpperCase()}</p>
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
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}>
              <form onSubmit={(e) => e.preventDefault()} style={{ padding: '40px' }}>
                
                {/* Section 1: Personal Info */}
                <div style={{ marginBottom: '35px' }}>
                  <h4 style={sectionHeaderStyle}>Personal Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <div style={{ position: 'relative' }}>
                        <MdOutlineBadge style={iconStyle} size={20} />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <MdOutlineMail style={iconStyle} size={20} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </div>

                <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', marginBottom: '35px' }} />

                {/* Section 2: Security */}
                <div style={{ marginBottom: '40px' }}>
                  <h4 style={sectionHeaderStyle}>Security & Password</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
                  <button type="button" style={{ 
                    padding: '12px 24px', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    background: 'white', 
                    color: '#475569', 
                    fontWeight: '600', 
                    cursor: 'pointer' 
                  }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ 
                    padding: '12px 32px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#c00000', 
                    color: 'white', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(192, 0, 0, 0.2)'
                  }}>
                    Update Profile
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
  borderRadius: '10px',
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
  borderRadius: '12px',
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