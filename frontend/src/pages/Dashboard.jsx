import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';
import { MdOutlineAssignmentTurnedIn, MdOutlinePendingActions, MdOutlineGroup, MdOutlineHistory } from "react-icons/md";

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) {
      navigate('/');
    } else {
      setUser(JSON.parse(loggedInUser));
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="content-header">
          <div className="search-box">
             <input type="text" placeholder="Search clients, cases, counselor..." />
          </div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill">
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-view">
          <h2>Case Dashboard</h2>
            <div className="welcome-card">
            <div className="welcome-text">
                <h3>Welcome back, {user.role === 'admin' ? 'Admin' : 'Counselor'}!</h3>
                <p>You have 2 sessions today and 2 urgent cases awaiting review.</p>
                <button className="view-schedule">View Schedule</button>
            </div>
            <div className="stat-bubbles">
                <div className="bubble"><strong>93</strong> Total Clients</div>
                <div className="bubble"><strong>24</strong> Active Cases</div>
            </div>
            </div>
            <div className="small-stats-grid">
                <div className="stat-card">
                <div className="icon-circle" style={{color: '#ff7e7e'}}><MdOutlineHistory /></div>
                <div className="stat-info"><h4>136</h4><p>Total Cases</p></div>
                </div>
                <div className="stat-card">
                <div className="icon-circle" style={{color: '#4caf50'}}><MdOutlineAssignmentTurnedIn /></div>
                <div className="stat-info"><h4>56</h4><p>Resolved Cases</p></div>
                </div>
                <div className="stat-card">
                <div className="icon-circle" style={{color: '#ffb300'}}><MdOutlinePendingActions /></div>
                <div className="stat-info"><h4>34</h4><p>Pending Cases</p></div>
                </div>
                <div className="stat-card">
                <div className="icon-circle" style={{color: '#2196f3'}}><MdOutlineGroup /></div>
                <div className="stat-info"><h4>6</h4><p>Active Counselors</p></div>
                </div>
            </div>
            {/* 2. Case Categories */}
            <div className="categories-section">
                <h3>Case Categories</h3>
                <div className="categories-grid">
                <div className="category-card">
                    <h4>COUNSELING</h4>
                    <p>Mental Health - Level II</p>
                    <div className="progress-bar"><div className="progress-fill" style={{width: '38%'}}></div></div>
                </div>
                <div className="category-card">
                    <h4>REFERRALS</h4>
                    <p>Student & Staffs</p>
                    <div className="progress-bar"><div className="progress-fill" style={{width: '25%'}}></div></div>
                </div>
                <div className="category-card">
                    <h4>CAREERS</h4>
                    <p>Students Support</p>
                    <div className="progress-bar"><div className="progress-fill" style={{width: '85%'}}></div></div>
                </div>
                <div className="category-card">
                    <h4>TESTING</h4>
                    <p>Psychological Assessments</p>
                    <div className="progress-bar"><div className="progress-fill" style={{width: '50%'}}></div></div>
                </div>
                </div>
            </div>
          {/* We will add the categories and table here next! */}
        </section>
        
      </main>
    </div>
  );
}

export default Dashboard;