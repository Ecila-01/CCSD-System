import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import WelcomeCard from '../components/WelcomeCard';
import StatsGrid from '../components/StatsGrid';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal'; 
import '../styles/Dashboard.css';
import WalkInModal from '../components/WalkInModal';


function Dashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [viewingRequest, setViewingRequest] = useState(null); 
  const [isWalkInOpen, setIsWalkInOpen] = useState(false); // ✅ State for Walk-in Modal
  // NEW: State for our active category filter
  const [activeFilter, setActiveFilter] = useState('All');
  
  const navigate = useNavigate();
  const fetchRequests = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/requests`);
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
  
  // 1. Identify User Role & Departments
  const isAdmin = user.role === 'admin';
  const userDepts = user.assignedDepartments || [];

  // 🔥 THE MASTER FILTER: Decide what cases this user is allowed to see
  const authorizedRequests = requests.filter(req => {
    if (isAdmin) return true; // Admins see everything
    return userDepts.includes(req.requestData?.department);
  });

  // 2. Calculate Today's Sessions
  // ✅ Now strictly using authorizedRequests
  const todayString = new Date().toDateString();
  const sessionsToday = authorizedRequests.filter(req => {
    if (!req.requiresSchedule || !req.appointmentDate) return false;
    const isToday = new Date(req.appointmentDate).toDateString() === todayString;
    
    if (isAdmin) return isToday; 
    return isToday && req.assignedCounselor === user.name; 
  }).length;

  // 3. Pending Queue
  const displayQueue = authorizedRequests.filter(req => {
    if (isAdmin) return req.status === 'Pending Review'; // Admin: ALL pending
    
    // Counselor: ONLY pending in their specific department
    return req.status === 'Pending Review' && req.department === user.department; 
  }).length;

  // 4. Total Cases 
  const totalCases = authorizedRequests.filter(req => {
    if (isAdmin) return true; // Admin: OVERALL Total (counts literally every request)
    
    // Counselor: ALL cases assigned to them, regardless of status (Active, Closed, etc.)
    return req.assignedCounselor === user.name; 
  }).length;

  // 5. SMART EMAIL CALCULATION 
  const getClientEmail = (req) => {
    if (req.guestEmail) return req.guestEmail; 
    if (req.requestData) {
      return req.requestData.email || req.requestData["Email Address"] || null;
    }
    return null;
  };

  // ✅ Make sure this uses authorizedRequests too!
  const uniqueEmails = authorizedRequests.map(getClientEmail).filter(email => email !== null);
  const uniqueClientsCount = new Set(uniqueEmails).size;

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className="content-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* Search box removed - justifyContent: 'flex-end' keeps everything else on the right */}
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill"> 
              <div style={{ margin: '10px' }}></div>
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ color: '#3C3736' }}>Case Dashboard</h2>
            {/*
            <button 
              onClick={() => setIsWalkInOpen(true)}
              style={{
                background: '#c00000',
                color: 'white',
                border: 'none',
                padding: '10px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(195, 21, 28, 0.2)',
                transition: 'transform 0.2s',
                marginRight: '20px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '18px' }}>+</span>Walk-in Session
            </button>*/}
          </div>
          
          {/* Pass the dynamic math into the Welcome Card */}
          <WelcomeCard 
            user={user} 
            sessionsToday={sessionsToday} 
            displayQueue={displayQueue} 
            yourActive={totalCases} // 👈 Pass the new totalCases variable here
            isAdmin={isAdmin}
          />
          
          <StatsGrid requests={authorizedRequests} />
          
          
          {/* Pass the FILTERED requests to the table */}
          <CasesTable 
            requests={authorizedRequests}
            onView={(request) => setViewingRequest(request) } 
            maxItems={6}
          />

        </section>
      </main>
      <WalkInModal 
        isOpen={isWalkInOpen} 
        onClose={() => setIsWalkInOpen(false)} 
        onSuccess={fetchRequests} // This refreshes your dashboard automatically!
        user={user} 
      />
      <RequestDetailsModal 
        request={viewingRequest} 
        onClose={() => setViewingRequest(null)} 
        onStatusUpdate={fetchRequests}
      />
    </div>
  );
}

export default Dashboard;