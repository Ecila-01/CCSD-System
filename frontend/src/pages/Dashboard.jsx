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
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
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
  const isAdmin = user.role === 'admin';
  const userDepts = user.assignedDepartments || [];

  const authorizedRequests = requests.filter(req => {
    if (isAdmin) return true;
    return userDepts.includes(req.requestData?.department);
  });

  const todayString = new Date().toDateString();
  const sessionsToday = authorizedRequests.filter(req => {
    if (!req.requiresSchedule || !req.appointmentDate) return false;
    const isToday = new Date(req.appointmentDate).toDateString() === todayString;
    if (isAdmin) return isToday;
    return isToday && req.assignedCounselor === user.name;
  }).length;

  // 3. Department Queue (Awaiting Review)
  // ✅ Super simple now: authorizedRequests already filters out other departments!
  const displayQueue = authorizedRequests.filter(req => req.status === 'Pending').length;

  // 4. "YOUR" Active Cases
  // ✅ Also simplified
  const yourActive = authorizedRequests.filter(req => {
    if (isAdmin) return req.status === 'Active'; 
    return req.status === 'Active' && req.assignedCounselor === user.name;
  }).length;

  const getClientEmail = (req) => {
    if (req.guestEmail) return req.guestEmail;
    if (req.requestData) {
      return req.requestData.email || req.requestData["Email Address"] || null;
    }
    return null;
  };

  const uniqueEmails = authorizedRequests.map(getClientEmail).filter(email => email !== null);
  const uniqueClientsCount = new Set(uniqueEmails).size;

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
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

        <section className="dashboard-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Case Dashboard</h2>
          </div>
          
          {/* Pass the dynamic math into the Welcome Card */}
          <WelcomeCard 
            user={user} 
            sessionsToday={sessionsToday} 
            displayQueue={displayQueue} 
            yourActive={yourActive} // 👈 Simplified
            isAdmin={isAdmin}
          />

          <StatsGrid requests={authorizedRequests} />

          {/* Responsive table wrapper prevents layout overflow on mobile */}
          <div className="cases-table-wrapper">
            <CasesTable
              requests={authorizedRequests}
              onView={(request) => setViewingRequest(request)}
              maxItems={6}
            />
          </div>
        </section>
      </main>

      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onSuccess={fetchRequests}
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