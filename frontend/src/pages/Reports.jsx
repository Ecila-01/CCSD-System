import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { MdAssignment, MdDownload } from "react-icons/md";
import '../styles/Dashboard.css'; 
import PDFExportButton from '../components/PDFExportButton';

function Reports() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [reportType, setReportType] = useState('accomplishment'); 
  const [timeframe, setTimeframe] = useState('Semestral'); 

  const reportRef = useRef(null);

  // 1. Fetch Data & User on Mount
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (loggedInUser) setUser(loggedInUser);

    const fetchRequests = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests`);
        setRequests(res.data);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // ============================================================================
  // DATA PROCESSING ALGORITHMS
  // ============================================================================

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // --- ACCOMPLISHMENT REPORT DATA (Individual Counselor) ---
  const myAccomplishments = useMemo(() => {
    if (!user) return { completedCount: 0, weeklyData: [], myServicesData: [] };

    const myRequests = requests.filter(req => req.assignedCounselor === user.name);
    
    // 1. Calculate Completed This Month
    const completedThisMonth = myRequests.filter(req => {
      const updatedDate = new Date(req.updatedAt);
      return req.status === 'Completed' && updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear;
    });

    // 2. Build Weekly Data for Bar Chart
    const weeklyData = [
      { name: 'Week 1', completed: 0, pending: 0 },
      { name: 'Week 2', completed: 0, pending: 0 },
      { name: 'Week 3', completed: 0, pending: 0 },
      { name: 'Week 4', completed: 0, pending: 0 },
    ];

    myRequests.forEach(req => {
      const d = new Date(req.createdAt);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;

      let weekIndex = Math.floor((d.getDate() - 1) / 7);
      if (weekIndex > 3) weekIndex = 3; 

      if (req.status === 'Completed' || req.status === 'Resolved' || req.status === 'Issued') {
        weeklyData[weekIndex].completed += 1;
      } else if (req.status !== 'Declined' && req.status !== 'Cancelled') {
        weeklyData[weekIndex].pending += 1;
      }
    });

    // ✅ 3. NEW: Count Specific Services Handled by this Counselor
    const myServicesCount = {};
    myRequests.forEach(req => {
      if (req.serviceName) {
        const serviceName = req.serviceName.toUpperCase();
        myServicesCount[serviceName] = (myServicesCount[serviceName] || 0) + 1;
      }
    });

    const myServicesData = Object.keys(myServicesCount)
      .map(key => ({ name: key, value: myServicesCount[key] }))
      .sort((a, b) => b.value - a.value);

    return { completedCount: completedThisMonth.length, weeklyData, myServicesData };
  }, [requests, user, currentMonth, currentYear]);


  // --- OVERALL REPORT DATA ---
  const overallData = useMemo(() => {
    const monthsLimit = timeframe === 'Semestral' ? 6 : 12;
    const referralsByMonth = {};
    
    for (let i = monthsLimit - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      referralsByMonth[monthName] = 0;
    }

    requests.forEach(req => {
      if (req.serviceName && req.serviceName.toUpperCase() === 'REFERRAL') {
        const d = new Date(req.createdAt);
        const monthDiff = (currentYear - d.getFullYear()) * 12 + (currentMonth - d.getMonth());
        if (monthDiff >= 0 && monthDiff < monthsLimit) {
          const monthName = d.toLocaleString('default', { month: 'short' });
          if (referralsByMonth[monthName] !== undefined) {
            referralsByMonth[monthName] += 1;
          }
        }
      }
    });

    const referralsData = Object.keys(referralsByMonth).map(key => ({
      month: key,
      referrals: referralsByMonth[key]
    }));

    const servicesCount = {};
    requests.forEach(req => {
      if (req.serviceName) {
        const serviceName = req.serviceName.toUpperCase();
        servicesCount[serviceName] = (servicesCount[serviceName] || 0) + 1;
      }
    });

    const servicesAvailedData = Object.keys(servicesCount)
      .map(key => ({ name: key, value: servicesCount[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const counselorServiceCount = {};
    const uniqueServices = new Set(); 

    requests.forEach(req => {
      const counselor = req.assignedCounselor;
      const service = req.serviceName ? req.serviceName.toUpperCase() : 'UNKNOWN';

      if (counselor && counselor !== 'Unassigned') {
        if (!counselorServiceCount[counselor]) {
          counselorServiceCount[counselor] = { name: counselor, total: 0 };
        }
        
        counselorServiceCount[counselor][service] = (counselorServiceCount[counselor][service] || 0) + 1;
        counselorServiceCount[counselor].total += 1;
        uniqueServices.add(service);
      }
    });

    const workloadData = Object.values(counselorServiceCount).sort((a, b) => b.total - a.total);
    const serviceKeys = Array.from(uniqueServices);

    return { referralsData, servicesAvailedData, workloadData, serviceKeys };
  }, [requests, timeframe, currentMonth, currentYear]);


  const EXTENDED_COLORS = ['#c00000', '#1e293b', '#e2b05f', '#475569', '#0284c7', '#16a34a', '#d97706'];

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Report Data...</div>;
  // --- PDF EXPORT HELPERS ---
  const getReportTitle = () => {
    if (reportType === 'overall') return 'Overall CCSD Services Report';
    if (user && user.name) return `${user.name}'s Accomplishment Report`;
    return 'Individual Accomplishment Report';
  };

  const getReportFilename = () => {
    if (reportType === 'overall') return `CCSD_Overall_Report_${currentYear}`;
    const safeName = user && user.name ? user.name.replace(/\s+/g, '_') : 'My';
    return `${safeName}_Accomplishments_${currentMonth + 1}_${currentYear}`;
  };
  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />

      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        <header className="content-header" style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 25px' }}>
          <div className="header-right">
            <span style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <section style={{ padding: '0 25px 30px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px' }}>
            <div>
              <h2 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: '0' }}>CCSD Reports</h2>
              <p style={{ color: '#64748b', fontSize: '15px', marginTop: '5px' }}>Generate and view accomplishment and overall department reports.</p>
            </div>
            
            <PDFExportButton 
              targetRef={reportRef} 
              filename={getReportFilename()}
              reportTitle={getReportTitle()}
              generatedBy={user?.name || 'Staff'}
            />
          </div>

          {/* --- TAB NAVIGATION --- */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            <button 
              onClick={() => setReportType('accomplishment')}
              style={reportType === 'accomplishment' ? activeTabStyle : inactiveTabStyle}
            >
              My Accomplishment Report
            </button>
            <button 
              onClick={() => setReportType('overall')}
              style={reportType === 'overall' ? activeTabStyle : inactiveTabStyle}
            >
              Overall CCSD Report
            </button>
          </div>

          <div ref={reportRef} style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px' }}>
            
            {/* ======================================================== */}
            {/* VIEW 1: INDIVIDUAL ACCOMPLISHMENT REPORT (MONTHLY) */}
            {/* ======================================================== */}
            {reportType === 'accomplishment' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={kpiCardStyle}>
                    <div style={kpiIconWrapper('#e0f2fe', '#0284c7')}><MdAssignment size={24} /></div>
                    <div>
                      <p style={kpiLabelStyle}>My Cases Completed ({now.toLocaleString('default', { month: 'long' })})</p>
                      <h3 style={kpiValueStyle}>{myAccomplishments.completedCount}</h3>
                    </div>
                  </div>
                </div>

                {/* ✅ GRID LAYOUT FOR INDIVIDUAL REPORT */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  
                  {/* Left: Weekly Progression */}
                  <div style={chartContainerStyle}>
                    <h3 style={chartTitleStyle}>My Workload Progression (This Month)</h3>
                    <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={myAccomplishments.weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Legend />
                          <Bar dataKey="completed" name="Completed Cases" stackId="a" fill="#16a34a" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="pending" name="Active/Pending Cases" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: NEW Specific Services Pie Chart */}
                  <div style={chartContainerStyle}>
                    <h3 style={chartTitleStyle}>Services I Handled</h3>
                    <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
                      {myAccomplishments.myServicesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={myAccomplishments.myServicesData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {myAccomplishments.myServicesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                         <p style={{textAlign: 'center', color: '#94a3b8', marginTop: '100px'}}>No service data available.</p>
                      )}
                    </div>
                    {/* Custom Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                      {myAccomplishments.myServicesData.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                          <div style={{ width: '12px', height: '12px', backgroundColor: EXTENDED_COLORS[index % EXTENDED_COLORS.length], borderRadius: '3px' }}></div>
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: OVERALL CCSD REPORT (SEMESTRAL / ANNUAL) */}
            {/* ======================================================== */}
            {reportType === 'overall' && (
              <div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <select 
                    value={timeframe} 
                    onChange={(e) => setTimeframe(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    <option value="Semestral">Bi-Annual - 6 Months</option>
                    <option value="Annual">Annual - 12 Months</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  
                  <div style={chartContainerStyle}>
                    <h3 style={chartTitleStyle}>Total Referrals ({timeframe})</h3>
                    <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={overallData.referralsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Line type="monotone" dataKey="referrals" name="Referrals" stroke="#c00000" strokeWidth={3} dot={{ r: 4, fill: '#c00000' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={chartContainerStyle}>
                    <h3 style={chartTitleStyle}>Services Availed</h3>
                    <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
                      {overallData.servicesAvailedData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={overallData.servicesAvailedData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {overallData.servicesAvailedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                         <p style={{textAlign: 'center', color: '#94a3b8', marginTop: '100px'}}>No service data available.</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                      {overallData.servicesAvailedData.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                          <div style={{ width: '12px', height: '12px', backgroundColor: EXTENDED_COLORS[index % EXTENDED_COLORS.length], borderRadius: '3px' }}></div>
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={chartContainerStyle}>
                  <h3 style={chartTitleStyle}>Workload Distribution by Service Category</h3>
                  <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overallData.workloadData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={120} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        
                        {overallData.serviceKeys.map((service, index) => (
                          <Bar 
                            key={service} 
                            dataKey={service} 
                            name={service} 
                            stackId="a" 
                            fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// --- STYLES (Unchanged) ---

const activeTabStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: '16px',
  fontWeight: '800',
  color: '#c00000',
  cursor: 'pointer',
  padding: '0 10px 10px 10px',
  borderBottom: '3px solid #c00000',
  marginBottom: '-12px' 
};

const inactiveTabStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: '16px',
  fontWeight: '600',
  color: '#64748b',
  cursor: 'pointer',
  padding: '0 10px 10px 10px',
};

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

export default Reports;