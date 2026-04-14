import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import WelcomeCard from '../components/WelcomeCard';
import StatsGrid from '../components/StatsGrid';
import CaseCategories from '../components/CaseCategories';
import CasesTable from '../components/CasesTable';
import '../styles/Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) {
      navigate('/');
    } else {
      setUser(JSON.parse(loggedInUser));
    }

    const fetchRequests = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/requests");
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className="content-header">
          <div className="search-box">
             <input type="text" placeholder="Search clients, cases, counselor..." />
          </div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill"> 
              <div style={{ margin: '10px' }}></div>
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-view">
          <h2 style={{ color: '#3C3736' }}>Case Dashboard</h2>
          
          {/* THE MODULAR COMPONENTS */}
          <WelcomeCard user={user} />
          
          <StatsGrid requests={requests} />
          
          <CaseCategories />
          
          <CasesTable requests={requests} />

        </section>
      </main>
    </div>
  );
}

export default Dashboard;