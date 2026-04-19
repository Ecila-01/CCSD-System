import React from 'react';
import { MdOutlineAccessTime, MdOutlineCheckCircleOutline, MdOutlinePendingActions } from "react-icons/md";

const StatsGrid = ({ requests }) => {
  const totalCases = requests.length;
  const resolvedCases = requests.filter(req => req.status === 'Completed').length;
  const pendingCases = requests.filter(req => req.status === 'Pending').length;

  return (
    <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginTop: '20px',
        // ADDED THESE MARGINS TO MATCH THE REST OF THE DASHBOARD
        marginLeft: '20px', 
        marginRight: '20px' 
    }}>
      
      <div className="stat-card" style={{ background: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{  padding: '10px', color: '#d32f2f' }}>
          <MdOutlineAccessTime size={30} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>{totalCases}</h3>
          <span style={{ fontSize: '12px', color: '#777' }}>Total Cases</span>
        </div>
      </div>

      <div className="stat-card" style={{ background: 'white', padding: '20px',  display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '10px', color: '#2e7d32' }}>
          <MdOutlineCheckCircleOutline size={30} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>{resolvedCases}</h3>
          <span style={{ fontSize: '12px', color: '#777' }}>Resolved Cases</span>
        </div>
      </div>

      <div className="stat-card" style={{ background: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '10px', color: '#f57f17' }}>
          <MdOutlinePendingActions size={30} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>{pendingCases}</h3>
          <span style={{ fontSize: '12px', color: '#777' }}>Pending Cases</span>
        </div>
      </div>

    </div>
  );
};

export default StatsGrid;