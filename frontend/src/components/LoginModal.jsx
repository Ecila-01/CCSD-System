import React, { useState } from 'react';
import '../styles/LoginModal.css';
import ubLogo from "../assets/darkUBlogo.png";
import { useNavigate } from 'react-router-dom'; 
const LoginModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook for redirection
  if (!isOpen) return null;

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        onClose(); // Close modal
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeButton" onClick={onClose}>&times;</button>
        
        <div className="modalHeader">
          <img src={ubLogo} alt="UB Logo" className="modalLogo" />
          <h2>STAFF LOGIN</h2>
          <p>Access for Counsellors and Administrators</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your UB email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="inputGroup">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className="forgotPassword">
            <a href="#">Forgot Password?</a>
          </div>

          <button type="submit" className="loginSubmitBtn">SIGN IN</button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;