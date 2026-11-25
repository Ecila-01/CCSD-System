import useRequests from '../hooks/useRequests';
import RequestLoadState from '../components/RequestLoadState';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
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
  const {requests,loading,error,refresh:fetchRequests}=useRequests();
  const [viewingRequest, setViewingRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));
  }, [navigate]);

  if (!user) return null;

  const referralRequests = requests.filter(
    req => String(req.serviceName || '').trim().toUpperCase() === 'REFERRAL'
  );

  const totalCount    = referralRequests.length;
  const pendingReview = referralRequests.filter(r => r.status === 'Pending').length;
  const processedCount = referralRequests.filter(r => r.status === 'Completed').length;

  const stats = [
    { icon: <MdOutlineAssignment />,  value: totalCount,     label: 'Total Referrals', color: '#6b7280' },
    { icon: <MdOutlinePending />,     value: pendingReview,  label: 'Pending',  color: '#0369a1' },
    { icon: <MdOutlineCheckCircle />, value: processedCount, label: 'Processed',       color: '#15803d' },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <TopBar />
        <RequestLoadState loading={loading} error={error} onRetry={fetchRequests} />

        {/* ── Page body ── */}
        {(!loading && (!error || requests.length>0)) && <section className="referrals-view">

          {/* Page title row */}
          <div className="page-header">
            <div className="page-header-text">
              <h2>Referrals Management</h2>
              <p>Review and process student referrals submitted by university staff and faculty.</p>
            </div>
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
              onUpdated={fetchRequests}
              title="Recent Referrals"
              itemsPerPage={10}
            />
          </div>

        </section>}
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
