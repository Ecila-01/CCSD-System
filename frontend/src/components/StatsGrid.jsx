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
      
      <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ background: '#ffebee', padding: '10px', borderRadius: '50%', color: '#d32f2f' }}>
          <MdOutlineAccessTime size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>{totalCases}</h3>
          <span style={{ fontSize: '12px', color: '#777' }}>Total Cases</span>
        </div>
      </div>

      <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '50%', color: '#2e7d32' }}>
          <MdOutlineCheckCircleOutline size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>{resolvedCases}</h3>
          <span style={{ fontSize: '12px', color: '#777' }}>Resolved Cases</span>
        </div>
      </div>

      <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ background: '#fff8e1', padding: '10px', borderRadius: '50%', color: '#f57f17' }}>
          <MdOutlinePendingActions size={24} />
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