import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal';
import '../styles/Referrals.css';
import { MdOutlineAssignment, MdOutlineWarning, MdOutlinePending, MdOutlineCheckCircle } from "react-icons/md";

function Referrals() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]); // Real dynamic data
  const [viewingRequest, setViewingRequest] = useState(null);
  const navigate = useNavigate();

  // 1. FETCH ACTUAL DATA
  const fetchRequests = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/requests");
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));

    fetchRequests();
  }, [navigate]);

  if (!user) return null;

  // 2. FILTER SPECIFICALLY FOR REFERRALS
  const referralRequests = requests.filter(req => req.serviceName === "REFERRAL");

  // 3. DYNAMIC STATS CALCULATION
  const totalCount = referralRequests.length;
  const pendingReview = referralRequests.filter(r => r.status === 'Pending').length;
  // High Priority: Behavioral referrals (as seen in your Mock Data logic)
  const highPriority = referralRequests.filter(r => 
    r.requestData?.referralReason === 'Behavioral' && r.status === 'Pending'
  ).length;
  const processedCount = referralRequests.filter(r => r.status !== 'Pending').length;

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className="content-header">
          <div className="search-box">
             <input type="text" placeholder="Search referrals by student or faculty..." />
          </div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill">
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="referrals-view">
          <div className="page-header">
            <div>
              <h2>Referrals Management</h2>
              <p>Review and process student referrals submitted by university staff and faculty.</p>
            </div>
            <button className="export-btn" onClick={() => window.print()}>Export Log</button>
          </div>

          {/* DYNAMIC STATS ROW */}
          <div className="stats-row">
            <div className="stat-card">
              <MdOutlineAssignment className="stat-icon gray" />
              <div><h3>{totalCount}</h3><p>Total Referrals</p></div>
            </div>
            <div className="stat-card">
              <MdOutlinePending className="stat-icon blue" />
              <div><h3>{pendingReview}</h3><p>Pending Review</p></div>
            </div>
            <div className="stat-card">
              <MdOutlineWarning className="stat-icon red" />
              <div><h3>{highPriority}</h3><p>High Priority</p></div>
            </div>
            <div className="stat-card">
              <MdOutlineCheckCircle className="stat-icon green" />
              <div><h3>{processedCount}</h3><p>Processed</p></div>
            </div>
          </div>

          {/* REUSABLE TABLE INTEGRATION */}
          <div className="referral-table-container" style={{ marginTop: '20px' }}>
            <CasesTable 
              requests={referralRequests} 
              onView={setViewingRequest} 
              title="Recent Referrals"
              itemsPerPage={10} 
            />
          </div>

        </section>
      </main>

      {/* RENDER THE MODAL IF A REFERRAL IS CLICKED */}
      {viewingRequest && (
        <RequestDetailsModal 
          request={viewingRequest} 
          onClose={() => setViewingRequest(null)} 
          onStatusUpdate={fetchRequests} 
        />
      )}
    </div>
  );
}

export default Referrals;