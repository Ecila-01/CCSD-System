import React from 'react';
import Sidebar from '../components/Sidebar';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { MdTrendingUp, MdWarning, MdTimer } from "react-icons/md";
import '../styles/Dashboard.css'; 

function Reports() {
  // --- MOCK DATA: Corrected Logic ---
  
  // 1. Counselors only have ACTIVE cases
  const counselorActiveData = [
    { name: 'Admin User', active: 12 },
    { name: 'Wifraim Neil', active: 28 },
    { name: 'Sarah Jenkins', active: 22 },
    { name: 'John Doe', active: 18 },
  ];

  // 2. Pending cases belong to DEPARTMENTS waiting to be grabbed
  const departmentPendingData = [
    { name: 'SBAA', pending: 15 },
    { name: 'SIT', pending: 8 },
    { name: 'SEA', pending: 5 },
    { name: 'SON', pending: 0 },
  ];

  // 3. Oldest unassigned requests
  const agingData = [
    { id: 'REQ-001', student: 'Maria Santos', service: 'Good Moral', department: 'SBAA', days: 4 },
    { id: 'REQ-042', student: 'James Cruz', service: 'Career Placement', department: 'SIT', days: 3 },
    { id: 'REQ-088', student: 'Ana Reyes', service: 'Counseling', department: 'SBAA', days: 2 },
  ];

  // UB Theme Colors
  const COLORS = ['#8b0000', '#1e293b', '#e2b05f', '#475569'];

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />

      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <header className="content-header" style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 25px' }}>
          <div className="header-right">
            <span style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <section style={{ padding: '0 25px 30px' }}>
          
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: '0' }}>Insights & Analytics</h2>
            <p style={{ color: '#64748b', fontSize: '15px', marginTop: '5px' }}>Monitor active counselor workloads and unassigned department queues.</p>
          </div>

          {/* --- TOP ROW: KPI CARDS --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={kpiCardStyle}>
              <div style={kpiIconWrapper('#e0f2fe', '#0284c7')}><MdTrendingUp size={24} /></div>
              <div>
                <p style={kpiLabelStyle}>Active Assigned Cases</p>
                <h3 style={kpiValueStyle}>80</h3>
              </div>
            </div>
            <div style={kpiCardStyle}>
              <div style={kpiIconWrapper('#fef3c7', '#d97706')}><MdWarning size={24} /></div>
              <div>
                <p style={kpiLabelStyle}>Unassigned / Pending</p>
                <h3 style={kpiValueStyle}>28</h3>
              </div>
            </div>
            <div style={kpiCardStyle}>
              <div style={kpiIconWrapper('#dcfce7', '#16a34a')}><MdTimer size={24} /></div>
              <div>
                <p style={kpiLabelStyle}>Avg. Time to Assign</p>
                <h3 style={kpiValueStyle}>1.2 Days</h3>
              </div>
            </div>
          </div>

          {/* --- MIDDLE ROW: CHARTS --- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            
            {/* Chart 1: Active Caseload per Counselor */}
            <div style={chartContainerStyle}>
              <h3 style={chartTitleStyle}>Active Caseload by Counselor</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={counselorActiveData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="active" name="Active Cases" fill="#1e293b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pending Queue per Department */}
            <div style={chartContainerStyle}>
              <h3 style={chartTitleStyle}>Unassigned Queue by Department</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentPendingData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={60} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="pending" name="Pending Cases" fill="#8b0000" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* --- BOTTOM ROW: PENDING AGING --- */}
          <div style={chartContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{...chartTitleStyle, margin: 0}}>Critical Queue: Oldest Unassigned Requests</h3>
              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '20px' }}>Action Required</span>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Requested Service</th>
                  <th style={thStyle}>Department Queue</th>
                  <th style={thStyle}>Time Waiting</th>
                </tr>
              </thead>
              <tbody>
                {agingData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}><strong>{row.student}</strong></td>
                    <td style={tdStyle}>{row.service}</td>
                    <td style={tdStyle}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                        {row.department}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MdWarning /> {row.days} Days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>
      </main>
    </div>
  );
}

// --- STYLES ---

const kpiCardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const kpiIconWrapper = (bg, color) => ({
  backgroundColor: bg,
  color: color,
  width: '50px',
  height: '50px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const kpiLabelStyle = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 5px 0',
  textTransform: 'uppercase',
  fontWeight: '700'
};

const kpiValueStyle = {
  fontSize: '24px',
  color: '#0f172a',
  margin: 0,
  fontWeight: '800'
};

const chartContainerStyle = {
  background: 'white',
  padding: '25px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const chartTitleStyle = {
  fontSize: '16px',
  color: '#0f172a',
  fontWeight: '700',
  margin: '0 0 20px 0'
};

const thStyle = {
  padding: '12px 15px',
  fontSize: '12px',
  color: '#64748b',
  textTransform: 'uppercase',
  fontWeight: '700'
};

const tdStyle = {
  padding: '15px',
  fontSize: '14px',
  color: '#1e293b'
};

export default Reports;