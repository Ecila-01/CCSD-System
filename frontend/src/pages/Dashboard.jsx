import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import WelcomeCard from '../components/WelcomeCard';
import StatsGrid from '../components/StatsGrid';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal'; 
import '../styles/Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [viewingRequest, setViewingRequest] = useState(null); 
  
  // NEW: State for our active category filter
  const [activeFilter, setActiveFilter] = useState('All');
  
  const navigate = useNavigate();
  const fetchRequests = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/requests");
    const data = await response.json();
    setRequests(data);
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
};

  useEffect(() => {
  const loggedInUser = localStorage.getItem("user");
  if (!loggedInUser) navigate('/');
  else setUser(JSON.parse(loggedInUser));

  fetchRequests();
}, [navigate]);

  if (!user) return null;

// --- DATA CALCULATIONS ---
  
  // 1. Calculate Today's Sessions
  const todayString = new Date().toDateString();
  const sessionsToday = requests.filter(req => {
    if (!req.requiresSchedule || !req.appointmentDate) return false;
    return new Date(req.appointmentDate).toDateString() === todayString;
  }).length;

  // 2. Calculate Pending/Urgent Cases
  const pendingCases = requests.filter(req => req.status === 'Pending').length;


  // 4. SMART EMAIL CALCULATION (Filters out old blank tests)
  const getClientEmail = (req) => {
    // Check top-level guestEmail first (New Format)
    if (req.guestEmail) return req.guestEmail; 
    
    // Then check inside requestData (Old/Flexible Formats)
    if (req.requestData) {
      return req.requestData.email || req.requestData["Email Address"] || null;
    }
    
    return null;
  };

  // This creates a Set of unique emails, but removes 'null' so blank test cases don't count as 1
  const uniqueEmails = requests.map(getClientEmail).filter(email => email !== null);
  const uniqueClientsCount = new Set(uniqueEmails).size;


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
          
          {/* Pass the dynamic math into the Welcome Card */}
          <WelcomeCard 
            user={user} 
            sessionsToday={sessionsToday} 
            pendingCases={pendingCases} 
            totalActive={requests.filter(r => r.status !== 'Completed').length}
            totalClients={uniqueClientsCount}
          />
          
          <StatsGrid requests={requests} />
          
          
          {/* Pass the FILTERED requests to the table */}
          <CasesTable 
            requests={requests} 
            onView={(request) => setViewingRequest(request) } 
            maxItems={6}
          />

        </section>
      </main>

      <RequestDetailsModal 
        request={viewingRequest} 
        onClose={() => setViewingRequest(null)} 
        onStatusUpdate={fetchRequests}
      />
    </div>
  );
}

export default Dashboard;