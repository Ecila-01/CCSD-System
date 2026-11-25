import useRequests from '../hooks/useRequests';
import RequestLoadState from '../components/RequestLoadState';
import React, { useEffect, useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import WelcomeCard from '../components/WelcomeCard';
import StatsGrid from '../components/StatsGrid';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal';
import '../styles/Dashboard.css';
import WalkInModal from '../components/WalkInModal';


function Dashboard() {
  const [user, setUser] = useState(null);
  const {requests,loading,error,refresh:fetchRequests}=useRequests();
  const [viewingRequest, setViewingRequest] = useState(null);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const navigate = useNavigate();
  const location=useLocation();
  const targetId=new URLSearchParams(location.search).get('case');

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));
  }, [navigate]);

  if (!user) return null;

  // --- DATA CALCULATIONS ---
  const isAdmin = user.role === 'admin';
  const userDepts = user.assignedDepartments || [];

  const authorizedRequests = requests;

  const todayString = new Date().toDateString();
  const sessionsToday = authorizedRequests.filter(req => {
    if (!req.requiresSchedule || !req.appointmentDate) return false;
    const isToday = new Date(req.appointmentDate).toDateString() === todayString;
    if (isAdmin) return isToday;
    return isToday && req.assignedCounselor === user.name;
  }).length;

  // 3. Department Queue (Awaiting Review)
  // ✅ Updated to match the exact 'Pending' status
  const displayQueue = authorizedRequests.filter(req => req.status === 'Pending').length;

  // 4. "YOUR" Cases (All Assigned Cases)
  // ✅ Removed the 'Active' restriction. Now grabs ALL cases assigned to the user.
  const yourActive = authorizedRequests.filter(req => {
    // Admins see everything in the authorized department
    if (isAdmin) return true; 
    
    // Counselors see EVERY case assigned to them, regardless of status
    return req.assignedCounselor === user.name; 
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
        <TopBar />
        <RequestLoadState loading={loading} error={error} onRetry={fetchRequests} />

        {(!loading && (!error || requests.length>0)) && <section className="dashboard-view">
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
              targetId={targetId} targetVisit={location.state?.notificationVisit}
              requests={authorizedRequests}
              onView={(request) => setViewingRequest(request)}
              onUpdated={fetchRequests}
              itemsPerPage={10}
            />
          </div>
        </section>}
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
