import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Schedules.css';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal';
import { MdOutlineDateRange, MdOutlineSchedule, MdOutlineCheckCircle } from "react-icons/md";

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
      const response = await fetch("http://localhost:5000/api/requests");
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
   
  const scheduledRequests = requests.filter(req => req.requiresSchedule === true);
  const pendingCount = scheduledRequests.filter(req => req.status === 'Pending').length;
  const completedCount = scheduledRequests.filter(req => req.status === 'Completed').length;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      
      <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
        <header className="content-header">
          <div className="search-box">
             <input type="text" placeholder="Search clients, cases, counselor..." />
          </div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill">
               <div style={{ margin: '10px' }}></div>
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        {/* ✅ WRAPPER SECTION: Centers everything and restricts the max width */}
        <section className="schedules-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px' }}>
          
          <div style={{ width: '100%', maxWidth: '1500px' }}>
            
            {/* 1. PAGE HEADER */}
            <div className="schedules-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#1e293b' }}>Schedules</h2>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Manage and track all counseling and referral sessions</p>
              </div>
              <button className="new-session-btn" style={{ padding: '10px 20px', background: '#c00000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                + New Counseling
              </button>
            </div>

            {/* 2. STATS ROW */}
            <div className="schedules-stats-row" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '20px', 
              width: '100%', 
              marginBottom: '30px' 
            }}>
              <div className="sched-stat-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <MdOutlineDateRange className="stat-icon red" size={40} style={{ color: '#ef4444', background: '#fee2e2', padding: '8px', borderRadius: '50%' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>{scheduledRequests.length}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Total Appointments</p>
                </div>
              </div>
              <div className="sched-stat-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <MdOutlineSchedule className="stat-icon blue" size={40} style={{ color: '#3b82f6', background: '#dbeafe', padding: '8px', borderRadius: '50%' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>{pendingCount}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Pending Requests</p>
                </div>
              </div>
              <div className="sched-stat-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <MdOutlineCheckCircle className="stat-icon green" size={40} style={{ color: '#22c55e', background: '#dcfce7', padding: '8px', borderRadius: '50%' }} />
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
                  <button onClick={handlePreviousWeek} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
                    &lt;
                  </button>
                  <span style={{ fontWeight: '700', minWidth: '150px', textAlign: 'center', color: '#1e293b' }}>
                    {formatWeekRange(currentWeekStart)}
                  </span>
                  <button onClick={handleNextWeek} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
                    &gt;
                  </button>
                </div>
              </div>

              {/* CSS GRID WEEKLY CALENDAR */}
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

                {[2,3,4,5,6,7,8,9,10].map(row => 
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
                      style={{ gridRow: `${gridRow} / span 1`, gridColumn: gridCol, cursor: 'pointer' }}
                      onClick={() => setViewingRequest(req)}
                    >
                      <strong>{timeString}</strong><br/>
                      {req.studentName}<br/>
                      <span style={{fontSize: '10px', textTransform: 'uppercase'}}>{req.serviceName}</span>
                    </div>
                  );
                })}
              </div>

              {/* REUSABLE TABLE INTEGRATION */}
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