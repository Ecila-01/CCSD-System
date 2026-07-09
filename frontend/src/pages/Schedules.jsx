import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import '../styles/Schedules.css';
import CasesTable from '../components/CasesTable';
import RequestDetailsModal from '../components/RequestDetailsModal';
import { MdOutlineDateRange, MdOutlineSchedule, MdOutlineCheckCircle } from "react-icons/md";

function Schedules() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]); 
  const [viewingRequest, setViewingRequest] = useState(null); 
  const [hoveredCell, setHoveredCell] = useState(null);
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

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const userDepts = user.assignedDepartments || [];

  const authorizedRequests = requests.filter(req => {
    if (isAdmin) return true; 
    return userDepts.includes(req.requestData?.department);
  });
   
  const scheduledRequests = authorizedRequests.filter(req => req.requiresSchedule === true);
  const pendingCount = scheduledRequests.filter(req => req.status === 'Pending Review' || req.status === 'Pending').length;
  const completedCount = scheduledRequests.filter(req => req.status === 'Completed').length;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      
      <main className="main-content" style={{ flex: 1, maxWidth: '100vw', overflowX: 'hidden' }}>
        
        {/* ✅ BULLETPROOF MOBILE STYLES */}
        <style>{`
          .schedules-stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            width: 100%;
            margin-bottom: 30px;
          }
          .sched-stat-card {
            background: white; padding: 20px; display: flex; align-items: center; gap: 15px; 
            border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border: 1px solid #e2e8f0;
          }
          
          /* Colors applied to wrapper, not SVG */
          .stat-icon-wrapper {
            padding: 12px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          }
          .red-bg { background-color: #fef2f2; color: #C3151C; }
          .blue-bg { background-color: #eff6ff; color: #3b82f6; }
          .green-bg { background-color: #dcfce3; color: #16a34a; }

          .stat-value {
            margin: 0; font-size: 24px; color: #1e293b; font-weight: bold;
          }
          .stat-label {
            margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;
          }

          /* MOBILE OVERRIDES */
          @media (max-width: 768px) {
            .schedules-page-header {
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 15px !important;
              width: 100% !important;
            }
            .schedules-page-header > div:first-child {
              text-align: center;
            }
            .calendar-controls {
              width: 100% !important;
              margin: 0 !important;
            }
            .date-navigator {
              display: flex !important;
              width: 100% !important;
              justify-content: space-between !important; 
            }
            .date-navigator span {
              flex: 1 !important; 
              text-align: center !important; 
              font-size: 14px !important;
            }
            
            /* Stats Row Force Row */
            .schedules-stats-row {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              gap: 8px !important;
              width: 100% !important;
            }
            .sched-stat-card {
              flex: 1 1 0px !important; 
              flex-direction: row !important; 
              padding: 12px 5px !important;
              gap: 8px !important;
              justify-content: center !important;
              align-items: center !important;
              min-width: 0 !important; 
            }
            
            /* Remove padding from wrapper on mobile so SVG can breathe */
            .stat-icon-wrapper {
              padding: 0 !important;
              background: transparent !important; 
              flex: 0 0 24px !important; 
              width: 24px !important;
              height: 24px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .stat-icon-wrapper svg {
              width: 24px !important;  
              height: 24px !important;
              display: block !important;
            }
            .stat-text-container {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-width: 0 !important;
            }
            .stat-value {
              font-size: 20px !important; 
              line-height: 1 !important;
              margin: 0 !important;
            }
            .stat-label {
              display: none !important; 
            }
          }
        `}</style>

        <TopBar />

        <section className="schedules-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px' }}>
          
          <div style={{ width: '100%', maxWidth: '1500px' }}>
            
            <div className="schedules-page-header">
              <div>
                <h2 style={{ margin: 0, color: '#1e293b' }}>Schedules</h2>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Manage and track all counseling and referral sessions</p>
              </div>
              
              <div className="calendar-controls">
                <div className="date-navigator">
                  <button onClick={handlePreviousWeek} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1',  cursor: 'pointer', fontWeight: 'bold', color: '#475569', borderRadius: '4px' }}>&lt;</button>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{formatWeekRange(currentWeekStart)}</span>
                  <button onClick={handleNextWeek} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1',  cursor: 'pointer', fontWeight: 'bold', color: '#475569', borderRadius: '4px' }}>&gt;</button>
                </div>
              </div>
            </div>

            {/* ✅ FIXED STATS CARDS: Cleaned up SVGs */}
            <div className="schedules-stats-row">
              <div className="sched-stat-card">
                <div className="stat-icon-wrapper red-bg">
                  <MdOutlineDateRange size={32} />
                </div>
                <div className="stat-text-container">
                  <h3 className="stat-value">{scheduledRequests.length}</h3>
                  <p className="stat-label">Total Appointments</p>
                </div>
              </div>

              <div className="sched-stat-card">
                <div className="stat-icon-wrapper blue-bg">
                  <MdOutlineSchedule size={32} />
                </div>
                <div className="stat-text-container">
                  <h3 className="stat-value">{pendingCount}</h3>
                  <p className="stat-label">Pending Requests</p>
                </div>
              </div>

              <div className="sched-stat-card">
                <div className="stat-icon-wrapper green-bg">
                  <MdOutlineCheckCircle size={32} />
                </div>
                <div className="stat-text-container">
                  <h3 className="stat-value">{completedCount}</h3>
                  <p className="stat-label">Completed</p>
                </div>
              </div>
            </div>

            <div className="schedules-main-panel" style={{ width: '100%' }}>
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '10px' }}>
                <div className="weekly-calendar" style={{ minWidth: '900px' }}>
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
                  <div className="time-label" style={{gridRow: 11}}>5 PM</div>

                  {[2,3,4,5,6,7,8,9,10,11].map(row => 
                    [2,3,4,5,6,7,8].map(col => (
                      <div key={`${row}-${col}`} className="grid-cell" style={{gridRow: row, gridColumn: col}}></div>
                    ))
                  )}

                  <div className="lunch-break" style={{gridRow: 6, gridColumn: '2 / 9'}}>
                    LUNCH BREAK
                  </div>

                  {(() => {
                    const groupedEvents = {};

                    scheduledRequests.forEach((req) => {
                      if (!req.appointmentDate || !req.timeSlot) return;

                      const eventDate = new Date(req.appointmentDate);
                      const currentWeekEnd = new Date(currentWeekStart);
                      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
                      currentWeekEnd.setHours(23, 59, 59, 999); 

                      if (eventDate < currentWeekStart || eventDate > currentWeekEnd) return; 

                      const dayOfWeek = eventDate.getDay(); 
                      const gridCol = dayOfWeek + 2;

                      const hour = parseInt(req.timeSlot.split(':')[0], 10);
                      if (hour < 8 || hour > 16) return; 
                      const gridRow = hour - 6;

                      const cellKey = `${gridRow}-${gridCol}`;
                      if (!groupedEvents[cellKey]) {
                        groupedEvents[cellKey] = [];
                      }
                      groupedEvents[cellKey].push(req);
                    });

                    const renderEventCard = (req) => {
                      let colorClass = ""; 
                      if (req.status === "Pending Review" || req.status === "Pending") colorClass = "blue-event"; 
                      else if (req.status === "Active" || req.status === "In-Progress") colorClass = "red-event"; 
                      else if (req.status === "Completed") colorClass = "green-event"; 
                      else colorClass = "gray-event"; 

                      const timeString = new Date(`1970-01-01T${req.timeSlot}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                      return (
                        <div 
                          key={req._id} 
                          className={`cal-event ${colorClass}`} 
                          style={{ 
                            width: '100%',
                            minHeight: '60px',
                            cursor: 'pointer', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            padding: '6px',
                            position: 'relative',
                            overflow: 'hidden',
                            justifyContent: 'flex-start',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            borderRadius: '6px'
                          }}
                          onClick={() => setViewingRequest(req)}
                        >
                          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px', opacity: 0.8, whiteSpace: 'nowrap' }}>
                            {timeString}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '900', lineHeight: '1.1', marginBottom: '2px', color: '#1a202c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.studentName}
                          </span>
                          <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.serviceName}
                          </span>
                          <div style={{ position: 'absolute', bottom: '4px', right: '4px', fontSize: '9px', background: 'rgba(255,255,255,0.85)', color: '#333', padding: '2px 5px', fontWeight: 'bold', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '2px', borderRadius: '4px' }}>
                            👤 {req.assignedCounselor !== 'Unassigned' ? req.assignedCounselor.split(' ')[0] : 'None'}
                          </div>
                        </div>
                      );
                    };

                    return Object.entries(groupedEvents).map(([cellKey, events]) => {
                      const [rowStr, colStr] = cellKey.split('-');
                      const gridRow = parseInt(rowStr, 10);
                      const gridCol = parseInt(colStr, 10);

                      return (
                        <div 
                          key={cellKey}
                          style={{
                            gridRow: `${gridRow} / span 1`,
                            gridColumn: gridCol,
                            padding: '2px',           
                            position: 'relative',
                          }}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {events.length > 1 ? (
                            <>
                              <div style={{
                                width: '100%', height: '100%',
                                backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1',
                                borderRadius: '6px', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                color: '#334155'
                              }}>
                                <span style={{ fontSize: '16px', fontWeight: '900' }}>{events.length}</span>
                                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Sessions</span>
                              </div>

                              {hoveredCell === cellKey && (
                                <div style={{
                                  position: 'absolute', top: 0, left: 0,
                                  width: '180px',
                                  backgroundColor: 'white',
                                  borderRadius: '8px', 
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                  zIndex: 100, 
                                  padding: '8px', 
                                  display: 'flex', flexDirection: 'column', gap: '8px',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '4px' }}>
                                    Conflicts at {events[0].timeSlot}
                                  </div>
                                  {events.map(req => renderEventCard(req))}
                                </div>
                              )}
                            </>
                          ) : (
                            renderEventCard(events[0])
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div> 

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