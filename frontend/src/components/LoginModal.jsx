import React, { useState } from 'react';
import '../styles/LoginModal.css';
import ubLogo from "../assets/darkUBlogo.png";
import { useNavigate } from 'react-router-dom'; 
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'; // ✅ Import Eye Icons

const LoginModal = ({ isOpen, onClose }) => {
  // View states: 'LOGIN', 'FORGOT_EMAIL', 'FORGOT_OTP', 'RESET_PWD'
  const [view, setView] = useState('LOGIN'); 
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // ✅ NEW: Visibility states for passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Status states
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  if (!isOpen) return null;

  // --- HELPER: Reset modal state when closing or swapping views ---
  const resetStates = () => {
    setError('');
    setMessage('');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    // ✅ Reset eye toggles
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetStates();
    setView('LOGIN');
    onClose();
  };

  // --- 1. LOGIN SUBMIT ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (email.length > 100 || password.length > 50) {
      setError("Credentials exceed maximum allowed length.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        handleClose(); 
        navigate('/dashboard'); 
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. FORGOT PASSWORD: SEND OTP ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("OTP sent to your email.");
        setView('FORGOT_OTP');
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. FORGOT PASSWORD: VERIFY OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("OTP Verified. Please set a new password.");
        setView('RESET_PWD');
      } else {
        setError(data.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. FORGOT PASSWORD: RESET PASSWORD ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password reset successfully! Please log in.");
        handleClose(); 
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderAlerts = () => (
    <>
      {error && <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', fontWeight: 'bold' }}>{message}</div>}
    </>
  );

  // ✅ NEW: Reusable style for the eye button
  const eyeBtnStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    padding: '0'
  };

  return (
    <div className="modalOverlay" onClick={handleClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeButton" onClick={handleClose}>&times;</button>
        
        <div className="modalHeader">
          <img src={ubLogo} alt="UB Logo" className="modalLogo" />
          <h2>
            {view === 'LOGIN' ? "STAFF LOGIN" : "ACCOUNT RECOVERY"}
          </h2>
          <p>
            {view === 'LOGIN' ? "Access for Counsellors and Administrators" : "Follow the steps to reset your password"}
          </p>
        </div>

        {renderAlerts()}

        {/* VIEW: LOGIN */}
        {view === 'LOGIN' && (
          <form onSubmit={handleLogin}>
            <div className="inputGroup">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="Enter your UB email" 
                value={email}
                maxLength={100}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="inputGroup">
              <label>Password</label>
              {/* ✅ Wrapped input in a relative div to position the eye icon */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter password" 
                  value={password}
                  maxLength={50} 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  style={{ width: '100%', paddingRight: '40px' }} // Extra padding so text doesn't hide under icon
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={eyeBtnStyle}
                  tabIndex="-1" // Prevents the tab key from focusing the eye icon while typing
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>
            <div className="forgotPassword" style={{ textAlign: 'right', marginBottom: '15px' }}>
              <span 
                style={{ color: '#c00000', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} 
                onClick={() => { resetStates(); setView('FORGOT_EMAIL'); }}
              >
                Forgot Password?
              </span>
            </div>
            <button type="submit" className="loginSubmitBtn" disabled={isLoading}>
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        )}

        {/* VIEW: FORGOT PASSWORD - REQUEST OTP */}
        {view === 'FORGOT_EMAIL' && (
          <form onSubmit={handleSendOtp}>
            <div className="inputGroup">
              <label>Registered Email Address</label>
              <input 
                type="email" 
                placeholder="Enter your email to receive an OTP" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="loginSubmitBtn" disabled={isLoading} style={{ marginBottom: '10px' }}>
              {isLoading ? 'SENDING...' : 'SEND OTP'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#64748b', cursor: 'pointer', fontSize: '12px' }} onClick={() => { resetStates(); setView('LOGIN'); }}>
                Back to Login
              </span>
            </div>
          </form>
        )}

        {/* VIEW: FORGOT PASSWORD - VERIFY OTP */}
        {view === 'FORGOT_OTP' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="inputGroup">
              <label>Enter 6-Digit OTP</label>
              <input 
                type="text" 
                placeholder="000000" 
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                required 
                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
              />
            </div>
            <button type="submit" className="loginSubmitBtn" disabled={isLoading} style={{ marginBottom: '10px' }}>
              {isLoading ? 'VERIFYING...' : 'VERIFY OTP'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#64748b', cursor: 'pointer', fontSize: '12px' }} onClick={() => setView('FORGOT_EMAIL')}>
                Didn't get it? Try sending again.
              </span>
            </div>
          </form>
        )}

        {/* VIEW: FORGOT PASSWORD - SET NEW PASSWORD */}
        {view === 'RESET_PWD' && (
          <form onSubmit={handleResetPassword}>
            <div className="inputGroup">
              <label>New Password</label>
              <div style={{ position: 'relative', display: 'flex' }}>
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  placeholder="Enter new password" 
                  value={newPassword}
                  maxLength={50}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)} 
                  style={eyeBtnStyle}
                  tabIndex="-1"
                >
                  {showNewPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>
            <div className="inputGroup">
              <label>Confirm New Password</label>
              <div style={{ position: 'relative', display: 'flex' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Re-type new password" 
                  value={confirmPassword}
                  maxLength={50}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  style={eyeBtnStyle}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>
            <button type="submit" className="loginSubmitBtn" disabled={isLoading}>
              {isLoading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginModal;