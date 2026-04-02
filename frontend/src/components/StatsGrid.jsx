import React from 'react';
import { MdOutlineAssignmentTurnedIn, MdOutlinePendingActions, MdOutlineGroup, MdOutlineHistory } from "react-icons/md";

const StatsGrid = ({ requests }) => {
  // Dynamically calculate the numbers based on the database
  const totalCases = requests.length;
  const pendingCases = requests.filter(r => r.status === 'Pending').length;
  const completedCases = requests.filter(r => r.status === 'Completed').length;

  return (
    <div className="small-stats-grid">
      <div className="stat-card">
        <div className="icon-circle" style={{color: '#ff7e7e'}}><MdOutlineHistory /></div>
        <div className="stat-info"><h4>{totalCases}</h4><p>Total Cases</p></div>
      </div>
      <div className="stat-card">
        <div className="icon-circle" style={{color: '#4caf50'}}><MdOutlineAssignmentTurnedIn /></div>
        <div className="stat-info"><h4>{completedCases}</h4><p>Resolved Cases</p></div>
      </div>
      <div className="stat-card">
        <div className="icon-circle" style={{color: '#ffb300'}}><MdOutlinePendingActions /></div>
        <div className="stat-info"><h4>{pendingCases}</h4><p>Pending Cases</p></div>
      </div>
      <div className="stat-card">
        <div className="icon-circle" style={{color: '#2196f3'}}><MdOutlineGroup /></div>
        <div className="stat-info"><h4>6</h4><p>Active Counselors</p></div>
      </div>
    </div>
  );
};

export default StatsGrid;