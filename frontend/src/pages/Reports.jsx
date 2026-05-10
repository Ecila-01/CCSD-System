import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { MdAssignment } from "react-icons/md";
import '../styles/Dashboard.css';
import '../styles/Reports.css';
import PDFExportButton from '../components/PDFExportButton';

function Reports() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(storedUser);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('Semestral');
  const reportRef = useRef(null);

  const [reportType, setReportType] = useState(storedUser?.role === 'admin' ? 'overall' : 'accomplishment');

  useEffect(() => {
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

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const getClientName = (req) => {
    const student = req.studentName || 'Unknown Student';
    if (req.serviceName && req.serviceName.toUpperCase() === 'REFERRAL') {
      const referrer = req.referrerName || 'Unknown Referrer';
      return `${student} (Referred by: ${referrer})`;
    }
    return student;
  };

  const myAccomplishments = useMemo(() => {
    if (!user) return { completedCount: 0, weeklyData: [], myServicesData: [], myRequestsThisMonth: [] };
    const myRequests = requests.filter(req => req.assignedCounselor === user.name);

    const myRequestsThisMonth = myRequests.filter(req => {
      const d = new Date(req.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const completedThisMonth = myRequestsThisMonth.filter(req => req.status === 'Completed');

    const weeklyData = [
      { name: 'Week 1', completed: 0, pending: 0 },
      { name: 'Week 2', completed: 0, pending: 0 },
      { name: 'Week 3', completed: 0, pending: 0 },
      { name: 'Week 4', completed: 0, pending: 0 },
    ];

    myRequestsThisMonth.forEach(req => {
      const d = new Date(req.createdAt);
      let weekIndex = Math.floor((d.getDate() - 1) / 7);
      if (weekIndex > 3) weekIndex = 3;
      if (req.status === 'Completed' || req.status === 'Resolved' || req.status === 'Issued') {
        weeklyData[weekIndex].completed += 1;
      } else if (req.status !== 'Declined' && req.status !== 'Cancelled') {
        weeklyData[weekIndex].pending += 1;
      }
    });

    const myServicesCount = {};
    myRequestsThisMonth.forEach(req => {
      if (req.serviceName) {
        const serviceName = req.serviceName.toUpperCase();
        myServicesCount[serviceName] = (myServicesCount[serviceName] || 0) + 1;
      }
    });

    const myServicesData = Object.keys(myServicesCount)
      .map(key => ({ name: key, value: myServicesCount[key] }))
      .sort((a, b) => b.value - a.value);

    return { completedCount: completedThisMonth.length, weeklyData, myServicesData, myRequestsThisMonth };
  }, [requests, user, currentMonth, currentYear]);

  const overallData = useMemo(() => {
    const monthsLimit = timeframe === 'Semestral' ? 6 : 12;
    const referralsByMonth = {};

    for (let i = monthsLimit - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      referralsByMonth[monthName] = 0;
    }

    const filteredRequests = requests.filter(req => {
      const d = new Date(req.createdAt);
      const monthDiff = (currentYear - d.getFullYear()) * 12 + (currentMonth - d.getMonth());
      return monthDiff >= 0 && monthDiff < monthsLimit;
    });

    filteredRequests.forEach(req => {
      if (req.serviceName && req.serviceName.toUpperCase() === 'REFERRAL') {
        const d = new Date(req.createdAt);
        const monthName = d.toLocaleString('default', { month: 'short' });
        if (referralsByMonth[monthName] !== undefined) referralsByMonth[monthName] += 1;
      }
    });

    const referralsData = Object.keys(referralsByMonth).map(key => ({ month: key, referrals: referralsByMonth[key] }));

    const servicesCount = {};
    filteredRequests.forEach(req => {
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

    filteredRequests.forEach(req => {
      const counselor = req.assignedCounselor;
      const service = req.serviceName ? req.serviceName.toUpperCase() : 'UNKNOWN';
      if (counselor && counselor !== 'Unassigned') {
        if (!counselorServiceCount[counselor]) counselorServiceCount[counselor] = { name: counselor, total: 0 };
        counselorServiceCount[counselor][service] = (counselorServiceCount[counselor][service] || 0) + 1;
        counselorServiceCount[counselor].total += 1;
        uniqueServices.add(service);
      }
    });

    const workloadData = Object.values(counselorServiceCount).sort((a, b) => b.total - a.total);
    const serviceKeys = Array.from(uniqueServices);

    return { referralsData, servicesAvailedData, workloadData, serviceKeys, filteredRequests };
  }, [requests, timeframe, currentMonth, currentYear]);

  const EXTENDED_COLORS = ['#c00000', '#1e293b', '#e2b05f', '#475569', '#0284c7', '#16a34a', '#d97706'];

  const getReportTitle = () => {
    if (reportType === 'overall') return `Overall CCSD Services Report (${timeframe})`;
    if (user && user.name) return `${user.name}'s Accomplishment Report`;
    return 'Individual Accomplishment Report';
  };

  const getReportFilename = () => {
    if (reportType === 'overall') return `CCSD_Overall_Report_${currentYear}`;
    const safeName = user && user.name ? user.name.replace(/\s+/g, '_') : 'My';
    return `${safeName}_Accomplishments_${currentMonth + 1}_${currentYear}`;
  };

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Report Data...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content" style={{ padding: '20px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <header className="content-header">
          <div className="header-right">
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="user-pill">
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="reports-view">
          <div className="reports-title-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0' }}>{reportType === 'overall' ? 'Overall Department Report' : 'My Accomplishment Report'}</h2>
              <p style={{ margin: 0, color: '#64748b' }}>Generate and view your official PDF reports below.</p>
            </div>
            <PDFExportButton targetRef={reportRef} filename={getReportFilename()} reportTitle={getReportTitle()} generatedBy={user?.name || 'Staff'} />
          </div>

          <div ref={reportRef} className="report-content" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            
            {/* ── ACCOMPLISHMENT VIEW ── */}
            {reportType === 'accomplishment' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={kpiCardStyle}>
                    <div style={kpiIconWrapper('#ffffff', '#0284c7')}><MdAssignment size={24} /></div>
                    <div>
                      <p style={kpiLabelStyle}>My Cases Completed ({now.toLocaleString('default', { month: 'long' })})</p>
                      <h3 style={kpiValueStyle}>{myAccomplishments.completedCount}</h3>
                    </div>
                  </div>
                </div>

                <div style={chartsGridStyle}>
                  <div style={chartCardStyle}>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>My Workload Progression</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={myAccomplishments.weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Legend />
                          <Bar dataKey="completed" name="Completed" stackId="a" fill="#16a34a" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={chartCardStyle}>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Services I Handled</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                      {myAccomplishments.myServicesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={myAccomplishments.myServicesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                              {myAccomplishments.myServicesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '100px' }}>No service data.</p>}
                    </div>
                    <div style={legendWrapperStyle}>
                      {myAccomplishments.myServicesData.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#475569' }}>
                          <div style={{ width: '10px', height: '10px', backgroundColor: EXTENDED_COLORS[index % EXTENDED_COLORS.length] }}></div>
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a' }}>
                    Case Log ({now.toLocaleString('default', { month: 'long' })})
                  </h3>
                  {/* ✅ THE RESPONSIVE TABLE WRAPPER */}
                  <div style={tableContainerStyle}>
                    {myAccomplishments.myRequestsThisMonth.length > 0 ? (
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Client Name</th>
                            <th style={thStyle}>Service Requested</th>
                            <th style={thStyle}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myAccomplishments.myRequestsThisMonth.map((req, i) => (
                            <tr key={req._id || i} style={i % 2 === 0 ? trEvenStyle : {}}>
                              <td style={tdStyle}>{new Date(req.createdAt).toLocaleDateString()}</td>
                              <td style={tdStyle}>{getClientName(req)}</td> 
                              <td style={tdStyle}>{req.serviceName || 'N/A'}</td>
                              <td style={{...tdStyle, fontWeight: 'bold', color: req.status === 'Completed' ? '#16a34a' : '#f59e0b'}}>{req.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p style={{ color: '#64748b' }}>No cases found for this month.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── OVERALL VIEW ── */}
            {reportType === 'overall' && (
              <div>
                <select className="timeframe-select" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ marginBottom: '20px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="Semestral">Bi-Annual - 6 Months</option>
                  <option value="Annual">Annual - 12 Months</option>
                </select>

                <div style={chartsGridStyle}>
                  <div style={chartCardStyle}>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Total Referrals ({timeframe})</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={overallData.referralsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <Line type="monotone" dataKey="referrals" name="Referrals" stroke="#c00000" strokeWidth={3} dot={{ r: 4, fill: '#c00000' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={chartCardStyle}>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Services Availed</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                      {overallData.servicesAvailedData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={overallData.servicesAvailedData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                              {overallData.servicesAvailedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '100px' }}>No service data.</p>}
                    </div>
                    <div style={legendWrapperStyle}>
                      {overallData.servicesAvailedData.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#475569' }}>
                          <div style={{ width: '10px', height: '10px', backgroundColor: EXTENDED_COLORS[index % EXTENDED_COLORS.length] }}></div>
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{...chartCardStyle, marginBottom: '40px'}}>
                  <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Workload Distribution</h3>
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overallData.workloadData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        {overallData.serviceKeys.map((service, index) => (
                          <Bar key={service} dataKey={service} name={service} stackId="a" fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a' }}>
                    Department Record ({timeframe})
                  </h3>
                  {/* ✅ THE RESPONSIVE TABLE WRAPPER */}
                  <div style={tableContainerStyle}>
                    {overallData.filteredRequests.length > 0 ? (
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Client Name</th>
                            <th style={thStyle}>Service Requested</th>
                            <th style={thStyle}>Assigned To</th>
                            <th style={thStyle}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overallData.filteredRequests.slice(0, 50).map((req, i) => (
                            <tr key={req._id || i} style={i % 2 === 0 ? trEvenStyle : {}}>
                              <td style={tdStyle}>{new Date(req.createdAt).toLocaleDateString()}</td>
                              <td style={tdStyle}>{getClientName(req)}</td> 
                              <td style={tdStyle}>{req.serviceName || 'N/A'}</td>
                              <td style={tdStyle}>{req.assignedCounselor || 'Unassigned'}</td>
                              <td style={tdStyle}>{req.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p style={{ color: '#64748b' }}>No records found for this timeframe.</p>}
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

// --- RESPONSIVE INLINE STYLES ---
const chartsGridStyle = {
  display: 'flex',
  flexWrap: 'wrap', // Forces stacking on small screens
  gap: '20px',
  marginBottom: '20px'
};

const chartCardStyle = {
  flex: '1 1 300px', // Starts at 300px, stretches to fill space
  minWidth: 0,
  backgroundColor: 'white', 
  padding: '15px', 
  borderRadius: '8px', 
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const legendWrapperStyle = {
  display: 'flex', 
  flexWrap: 'wrap', 
  gap: '8px', 
  justifyContent: 'center', 
  marginTop: '10px'
};

const kpiCardStyle = {
  background: 'white', padding: '15px', border: '1px solid #e2e8f0',
  display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
};
const kpiIconWrapper = (bg, color) => ({
  backgroundColor: bg, color, width: '40px', height: '40px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px'
});
const kpiLabelStyle = { fontSize: '11px', color: '#64748b', margin: '0 0 5px 0', textTransform: 'uppercase', fontWeight: '700' };
const kpiValueStyle = { fontSize: '20px', color: '#0f172a', margin: 0, fontWeight: '800' };

// --- RESPONSIVE TABLE STYLES ---
const tableContainerStyle = {
  width: '100%',
  overflowX: 'auto', // Adds horizontal scroll bar only on mobile!
  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS devices
};

const tableStyle = {
  width: '100%',
  minWidth: '700px', // This guarantees the table will never squish below 700px!
  borderCollapse: 'collapse',
  fontSize: '13px',
  textAlign: 'left'
};
const thStyle = { backgroundColor: '#f8fafc', color: '#475569', padding: '10px', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px', borderBottom: '1px solid #e2e8f0', color: '#334155' };
const trEvenStyle = { backgroundColor: '#f8fafc' };

export default Reports;