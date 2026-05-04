import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Schedules.css';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal';
import { MdOutlineDateRange, MdOutlineSchedule, MdOutlineCheckCircle } from "react-icons/md";
import PageHeader from '../components/PageHeader';

function Schedules() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]); 
  const [viewingRequest, setViewingRequest] = useState(null); 
  const navigate = useNavigate();
  
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };
  
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  
  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const formatWeekRange = (start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    } else if (startMonth !== endMonth) {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/requests`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));
    
    fetchRequests();
  }, [navigate]);

  if (!user) return null;

  // 1. Identify User Role & Departments
  const isAdmin = user.role === 'admin';
  const userDepts = user.assignedDepartments || [];

  // 🔥 THE MASTER FILTER: Restrict cases by department
  const authorizedRequests = requests.filter(req => {
    if (isAdmin) return true; // Admins see everything
    return userDepts.includes(req.requestData?.department);
  });
   
  // 2. Do the math using the FILTERED requests
  const scheduledRequests = authorizedRequests.filter(req => req.requiresSchedule === true);
  const pendingCount = scheduledRequests.filter(req => req.status === 'Pending Review').length;
  const completedCount = scheduledRequests.filter(req => req.status === 'Completed').length;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      
      <main className="main-content">
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

        {/* ✅ WRAPPER SECTION: Centers everything and restricts the max width */}
        <section className="schedules-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px' }}>
          
          <div style={{ width: '100%', maxWidth: '1500px' }}>
            
            {/* 1. PAGE HEADER */}
            <div className="schedules-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#1e293b' }}>Schedules</h2>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Manage and track all counseling and referral sessions</p>
              </div>
            </div>

            {/* 2. STATS ROW */}
            <div className="schedules-stats-row" style={{ 
              width: '100%', 
              marginBottom: '30px' 
            }}>
              <div className="sched-stat-card" style={{ background: 'white', padding: '20px',  display: 'flex', alignItems: 'center', gap: '15px' }}>
                <MdOutlineDateRange className="stat-icon red" size={42} style={{ color: '#C3151C',  padding: '8px'  }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>{scheduledRequests.length}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Total Appointments</p>
                </div>
              </div>
              <div className="sched-stat-card" style={{ background: 'white', padding: '20px',   display: 'flex', alignItems: 'center', gap: '15px' }}>
                <MdOutlineSchedule className="stat-icon blue" size={42} style={{ color: '#3b82f6',  padding: '8px' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>{pendingCount}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Pending Requests</p>
                </div>
              </div>
              <div className="sched-stat-card" style={{ background: 'white', padding: '20px',  display: 'flex', alignItems: 'center', gap: '15px' }}>
                <MdOutlineCheckCircle className="stat-icon green" size={42} style={{ color: '#146b34',  padding: '8px' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>{completedCount}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Completed</p>
                </div>
              </div>
            </div>

            {/* 3. CALENDAR & TABLE PANEL */}
            <div className="schedules-main-panel" style={{ width: '100%' }}>
              
              <div className="calendar-controls" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <div className="date-navigator" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={handlePreviousWeek} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1',  cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
                    &lt;
                  </button>
                  <span style={{ fontWeight: '700', minWidth: '150px', textAlign: 'center', color: '#1e293b' }}>
                    {formatWeekRange(currentWeekStart)}
                  </span>
                  <button onClick={handleNextWeek} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1',  cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
                    &gt;
                  </button>
                </div>
              </div>

              {/* CSS GRID WEEKLY CALENDAR */}
              <div className="schedules-main-panel">
              <div className="weekly-calendar">
                <div className="time-col-header"></div>
                {weekDays.map((dateObj, index) => {
                  const today = new Date();
                  const isToday = 
                    today.getDate() === dateObj.getDate() &&
                    today.getMonth() === dateObj.getMonth() &&
                    today.getFullYear() === dateObj.getFullYear();
                  
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                  
                  return (
                    <div key={index} className={`day-header ${isToday ? 'active' : ''}`}>
                      {dayName}<br/>{dateObj.getDate()}
                    </div>
                  );
                })}

                <div className="time-label" style={{gridRow: 2}}>8 AM</div>
                <div className="time-label" style={{gridRow: 3}}>9 AM</div>
                <div className="time-label" style={{gridRow: 4}}>10 AM</div>
                <div className="time-label" style={{gridRow: 5}}>11 AM</div>
                <div className="time-label" style={{gridRow: 6}}>12 PM</div>
                <div className="time-label" style={{gridRow: 7}}>1 PM</div>
                <div className="time-label" style={{gridRow: 8}}>2 PM</div>
                <div className="time-label" style={{gridRow: 9}}>3 PM</div>
                <div className="time-label" style={{gridRow: 10}}>4 PM</div>
                
                {/* ✅ FIX: Add 5 PM to cap off the bottom of the grid */}
                <div className="time-label" style={{gridRow: 11}}>5 PM</div>

                {/* ✅ FIX: Add '11' to the row array so it draws the bottom boxes */}
                {[2,3,4,5,6,7,8,9,10,11].map(row => 
                  [2,3,4,5,6,7,8].map(col => (
                    <div key={`${row}-${col}`} className="grid-cell" style={{gridRow: row, gridColumn: col}}></div>
                  ))
                )}

                <div className="lunch-break" style={{gridRow: 6, gridColumn: '2 / 9'}}>
                  LUNCH BREAK
                </div>

                {scheduledRequests.map((req) => {
                  if (!req.appointmentDate || !req.timeSlot) return null;

                  const eventDate = new Date(req.appointmentDate);
                  const currentWeekEnd = new Date(currentWeekStart);
                  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
                  currentWeekEnd.setHours(23, 59, 59, 999); 

                  if (eventDate < currentWeekStart || eventDate > currentWeekEnd) {
                    return null; 
                  }
                  const dayOfWeek = eventDate.getDay(); 
                  const gridCol = dayOfWeek + 2;

                  const hour = parseInt(req.timeSlot.split(':')[0], 10);
                  if (hour < 8 || hour > 16) return null; 
                  const gridRow = hour - 6;

                  let colorClass = ""; 
                  
                  if (req.status === "Pending") {
                    colorClass = "blue-event"; 
                  } else if (req.status === "Active") {
                    colorClass = "red-event"; 
                  } else if (req.status === "Completed") {
                    colorClass = "green-event"; 
                  } else {
                    colorClass = "gray-event"; 
                  }
                  
                  const timeString = new Date(`1970-01-01T${req.timeSlot}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                  return (
                  <div 
                    key={req._id} 
                    className={`cal-event ${colorClass}`} 
                    style={{ 
                      gridRow: `${gridRow} / span 1`, 
                      gridColumn: gridCol, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      padding: '8px 10px',
                      position: 'relative',
                      overflow: 'hidden',
                      justifyContent: 'flex-start',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onClick={() => setViewingRequest(req)}
                  >
                    {/* Time Header */}
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                      {timeString}
                    </div>

                    {/* Student Name - Bold and Clear */}
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '900', 
                      lineHeight: '1.1',
                      marginBottom: '2px',
                      color: '#1a202c'
                    }}>
                      {req.studentName}
                    </span>
                    
                    {/* Service Type - Subtle but readable */}
                    <span style={{ 
                      fontSize: '10px', 
                      textTransform: 'uppercase', 
                      fontWeight: '600',
                      letterSpacing: '0.3px',
                      opacity: 0.7
                    }}>
                      {req.serviceName}
                    </span>

                    {/* ✅ Counselor Badge - Larger and More Visible */}
                    <div style={{ 
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      fontSize: '10px', // Increased from 8px
                      background: 'rgba(255,255,255,0.85)', 
                      color: '#333',
                      padding: '3px 7px', // More padding for a "pill" look
                     
                      fontWeight: 'bold',
                      border: '1px solid rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <span style={{ fontSize: '12px' }}>👤</span> 
                      {req.assignedCounselor !== 'Unassigned' ? req.assignedCounselor.split(' ')[0] : 'None'}
                    </div>
                  </div>
                  );
                })}
              </div>{/* end weekly-calendar */}
              </div>{/* end schedules-main-panel */}
              <div style={{ marginTop: '40px' }}>
                <CasesTable 
                  requests={scheduledRequests} 
                  onView={setViewingRequest} 
                  title="All Scheduled Sessions / Pending Requests"
                />
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* RENDER THE MODAL IF A REQUEST IS CLICKED */}
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

export default Schedules;