import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Schedules.css';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal';
import { MdOutlineDateRange, MdOutlineSchedule, MdOutlineCheckCircle, MdOutlinePeople } from "react-icons/md";

function Schedules() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]); // Real data state
  const [viewingRequest, setViewingRequest] = useState(null); // Modal state
  const navigate = useNavigate();
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  // Handlers for the arrows
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
  // Format the text like "Apr 5 - 11, 2026"
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

  // Generate the 7 days for the dynamic headers
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  // Fetch real data from backend
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
   
  // 1. FILTER FOR SCHEDULED DATA
  const scheduledRequests = requests.filter(req => req.requiresSchedule === true);
  const pendingCount = scheduledRequests.filter(req => req.status === 'Pending').length;
  const completedCount = scheduledRequests.filter(req => req.status === 'Completed').length;

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
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

        <section className="schedules-view">
          <div className="schedules-page-header">
            <div>
              <h2>Schedules</h2>
              <p>Manage and track all counseling and referral sessions</p>
            </div>
            <button className="new-session-btn">+ New Counseling</button>
          </div>

          {/* STATS ROW (Now dynamic!) */}
          <div className="schedules-stats-row">
            <div className="sched-stat-card">
              <MdOutlineDateRange className="stat-icon red" />
              <div><h3>{scheduledRequests.length}</h3><p>Total Appointments</p></div>
            </div>
            <div className="sched-stat-card">
              <MdOutlineSchedule className="stat-icon blue" />
              <div><h3>{pendingCount}</h3><p>Pending Requests</p></div>
            </div>
            <div className="sched-stat-card">
              <MdOutlineCheckCircle className="stat-icon green" />
              <div><h3>{completedCount}</h3><p>Completed</p></div>
            </div>
            <div className="sched-stat-card">
              <MdOutlinePeople className="stat-icon gray" />
              <div><h3>17</h3><p>Total Counselors</p></div>
            </div>
          </div>

          <div className="schedules-layout">
            {/* LEFT PANEL: Counselors List */}
            <aside className="schedules-sidebar">
              <div className="mini-calendar-placeholder">
                <div className="mini-cal-header">APRIL 2026</div>
                <div className="mini-cal-grid">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  <span className="fade">29</span><span className="fade">30</span><span className="fade">31</span><span>1</span><span>2</span><span>3</span><span>4</span>
                  <span>5</span><span className="active">6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span>
                </div>
              </div>

              <div className="counselors-list-section">
                <div className="counselor-header">COUNSELORS <span className="count">17</span></div>
                <p className="counselor-category">DIRECTOR</p>
                <div className="counselor-item"><span className="dot blue"></span> Ms. Leny Estacio, RGC, LPT</div>
                <p className="counselor-category">COLLEGE GUIDANCE ASSOCIATES</p>
                <div className="counselor-item"><span className="dot pink"></span> Mr. Ian Alangdeo, RPM</div>
                <div className="counselor-item"><span className="dot pink"></span> Ms. Lara Joi Ilumin, RPM</div>
                <div className="counselor-item"><span className="dot pink"></span> Ms. Kristina Valdez, RPM</div>
                <div className="counselor-item"><span className="dot pink"></span> Ms. Jozenieh Bangibang, RPM</div>
              </div>
            </aside>

            {/* RIGHT PANEL: Main Calendar & Tables */}
            <div className="schedules-main-panel">
              <div className="calendar-controls" style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 20px' }}>
                <div className="date-navigator" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={handlePreviousWeek} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                    &lt;
                  </button>
                  
                  <span style={{ fontWeight: '600', minWidth: '140px', textAlign: 'center' }}>
                    {formatWeekRange(currentWeekStart)}
                  </span>
                  
                  <button onClick={handleNextWeek} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                    &gt;
                  </button>
                </div>
              </div>

              {/* CSS GRID WEEKLY CALENDAR */}
              <div className="weekly-calendar">
                {/* Headers */}
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

                {/* Grid Body (Times 8am to 5pm) */}
                <div className="time-label" style={{gridRow: 2}}>8 AM</div>
                <div className="time-label" style={{gridRow: 3}}>9 AM</div>
                <div className="time-label" style={{gridRow: 4}}>10 AM</div>
                <div className="time-label" style={{gridRow: 5}}>11 AM</div>
                <div className="time-label" style={{gridRow: 6}}>12 PM</div>
                <div className="time-label" style={{gridRow: 7}}>1 PM</div>
                <div className="time-label" style={{gridRow: 8}}>2 PM</div>
                <div className="time-label" style={{gridRow: 9}}>3 PM</div>
                <div className="time-label" style={{gridRow: 10}}>4 PM</div>

                {/* Grid Lines */}
                {[2,3,4,5,6,7,8,9,10].map(row => 
                  [2,3,4,5,6,7,8].map(col => (
                    <div key={`${row}-${col}`} className="grid-cell" style={{gridRow: row, gridColumn: col}}></div>
                  ))
                )}

                <div className="lunch-break" style={{gridRow: 6, gridColumn: '2 / 9'}}>
                  LUNCH BREAK
                </div>

                {/* DYNAMIC CALENDAR EVENTS */}
                {scheduledRequests.map((req) => {
                  if (!req.appointmentDate || !req.timeSlot) return null;

                  const eventDate = new Date(req.appointmentDate);
                  const currentWeekEnd = new Date(currentWeekStart);
                  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
                  currentWeekEnd.setHours(23, 59, 59, 999); // End of Saturday

                  // --- NEW: Skip events that are NOT in the currently viewed week ---
                  if (eventDate < currentWeekStart || eventDate > currentWeekEnd) {
                    return null; 
                  }
                  const dayOfWeek = eventDate.getDay(); 
                  const gridCol = dayOfWeek + 2;

                  // 2. Calculate the Row (Time of Day)
                  // Parse the hour (e.g., "14:30" -> 14). 8 AM is row 2. So Row = Hour - 6.
                  const hour = parseInt(req.timeSlot.split(':')[0], 10);
                  if (hour < 8 || hour > 16) return null; // Hide events outside working hours
                  const gridRow = hour - 6;

                  // 3. Styling based on STATUS
                  let colorClass = ""; 
                  
                  if (req.status === "Pending") {
                    colorClass = "blue-event"; // Light Blue for things that need approval
                  } else if (req.status === "Active") {
                    colorClass = "red-event"; // Red (University color) for confirmed appointments
                  } else if (req.status === "Completed") {
                    colorClass = "green-event"; // Green for finished sessions
                  } else {
                    colorClass = "gray-event"; // Fallback for declined/cancelled
                  }
                  
                  // Format time (e.g., "14:30" -> "2:30 PM")
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
              <div style={{ marginTop: '30px' }}>
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