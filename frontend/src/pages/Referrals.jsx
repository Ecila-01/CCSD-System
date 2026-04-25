import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal';
import '../styles/Referrals.css';
import {
  MdOutlineAssignment,
  MdOutlineWarning,
  MdOutlinePending,
  MdOutlineCheckCircle,
} from 'react-icons/md';

function Referrals() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [viewingRequest, setViewingRequest] = useState(null);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/requests`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));
    fetchRequests();
  }, [navigate]);

  if (!user) return null;

  const referralRequests = requests.filter(req => req.serviceName === 'REFERRAL');

  const totalCount    = referralRequests.length;
  const pendingReview = referralRequests.filter(r => r.status === 'Pending').length;
  const highPriority  = referralRequests.filter(
    r => r.requestData?.referralReason === 'Behavioral' && r.status === 'Pending'
  ).length;
  const processedCount = referralRequests.filter(r => r.status !== 'Pending').length;

  const stats = [
    { icon: <MdOutlineAssignment />,  value: totalCount,     label: 'Total Referrals', color: '#6b7280' },
    { icon: <MdOutlinePending />,     value: pendingReview,  label: 'Pending Review',  color: '#0369a1' },
    { icon: <MdOutlineWarning />,     value: highPriority,   label: 'High Priority',   color: '#c00000' },
    { icon: <MdOutlineCheckCircle />, value: processedCount, label: 'Processed',       color: '#15803d' },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        {/* ── Header ── */}
        <header className="content-header">
          <div className="search-box">
            <input type="text" placeholder="Search referrals by student or faculty..." />
          </div>
          <div className="header-right">
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            <div className="user-pill">
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        {/* ── Page body ── */}
        <section className="referrals-view">

          {/* Page title row */}
          <div className="page-header">
            <div className="page-header-text">
              <h2>Referrals Management</h2>
              <p>Review and process student referrals submitted by university staff and faculty.</p>
            </div>
            <button className="export-btn" onClick={() => window.print()}>
              Export Log
            </button>
          </div>

          {/* Stats row */}
          <div className="stats-row">
            {stats.map(({ icon, value, label, color }) => (
              <div className="ref-stat-card" key={label}>
                <div className="ref-stat-icon" style={{ color }}>{icon}</div>
                <div className="ref-stat-text">
                  <h3>{value}</h3>
                  <p>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="referral-table-container">
            <CasesTable
              requests={referralRequests}
              onView={setViewingRequest}
              title="Recent Referrals"
              itemsPerPage={10}
            />
          </div>

        </section>
      </main>

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