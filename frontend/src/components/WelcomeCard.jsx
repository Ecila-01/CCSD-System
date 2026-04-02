import React from 'react';

const WelcomeCard = ({ user }) => {
  if (!user) return null;

  return (
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
  );
};

export default WelcomeCard;