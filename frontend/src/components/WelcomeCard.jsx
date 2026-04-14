import React from 'react';

// Catch the new props we passed from Dashboard.jsx
const WelcomeCard = ({ user, sessionsToday, pendingCases, totalActive, totalClients }) => {
  return (
    <div className="welcome-card" style={{ background: '#ff7e82', color: 'white', padding: '30px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '20px',
        marginRight: '20px' }}>
      
      <div className="welcome-text">
        <h2 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>
          Welcome back, {user.role || 'Counselor'}!
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', opacity: '0.9' }}>
          You have <strong>{sessionsToday}</strong> sessions today and <strong>{pendingCases}</strong> cases awaiting review.
        </p>
        <button style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          View Schedule
        </button>
      </div>

      <div className="welcome-stats" style={{ display: 'flex', gap: '15px' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', textAlign: 'center' }}>
          <strong>{totalClients}</strong> Total Clients
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', textAlign: 'center' }}>
          <strong>{totalActive}</strong> Active Cases
        </div>
      </div>

    </div>
  );
};

export default WelcomeCard;