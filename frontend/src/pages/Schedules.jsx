import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Schedules.css';
import { MdOutlineDateRange, MdOutlineSchedule, MdOutlineCheckCircle, MdOutlinePeople } from "react-icons/md";

function Schedules() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));
  }, [navigate]);

  // HARDCODED MOCK DATA FOR NOW
  const mockSessions = [
    { id: 1, caseNo: "001-0010", type: "COUNSELING", student: "Elyray Cerezo", course: "BSIT - 4th", counselor: "Ms. Manalo", date: "April 06, 2026", time: "10:00 AM", status: "Done" },
    { id: 2, caseNo: "002-0012", type: "COUNSELING", student: "Ashley Cornejo", course: "BSN - 3rd", counselor: "Ms. Bangibang", date: "April 06, 2026", time: "10:00 AM", status: "Active" },
    { id: 3, caseNo: "003-0013", type: "REFERRAL", student: "Judy Ronquillo", course: "BSBAA - 3rd", counselor: "Mr. Alangdeo", date: "April 06, 2026", time: "01:00 PM", status: "Active" },
    { id: 4, caseNo: "004-0014", type: "REFERRAL", student: "Wifraim San Miguel", course: "BSCS - 3rd", counselor: "Mr. Ayodoc", date: "April 08, 2026", time: "11:00 AM", status: "Pending" },
  ];

  if (!user) return null;

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

          {/* STATS ROW */}
          <div className="schedules-stats-row">
            <div className="sched-stat-card">
              <MdOutlineDateRange className="stat-icon red" />
              <div><h3>18</h3><p>This Month</p></div>
            </div>
            <div className="sched-stat-card">
              <MdOutlineSchedule className="stat-icon blue" />
              <div><h3>2</h3><p>Today's Counseling</p></div>
            </div>
            <div className="sched-stat-card">
              <MdOutlineCheckCircle className="stat-icon green" />
              <div><h3>11</h3><p>Completed</p></div>
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
                  {/* Just a visual placeholder for the mockup */}
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
              
              {/* CALENDAR CONTROLS */}
              <div className="calendar-controls">
                <div className="view-toggles">
                  <button>Day</button>
                  <button>Week</button>
                  <button>Month</button>
                  <button>List</button>
                  <button className="active">Today</button>
                </div>
                <div className="date-navigator">
                  <button>&lt;</button>
                  <span>Apr 6 - 11, 2026</span>
                  <button>&gt;</button>
                </div>
              </div>

              {/* CSS GRID WEEKLY CALENDAR */}
              <div className="weekly-calendar">
                {/* Headers */}
                <div className="time-col-header"></div>
                <div className="day-header">SUN<br/>5</div>
                <div className="day-header active">MON<br/>6</div>
                <div className="day-header">TUE<br/>7</div>
                <div className="day-header">WED<br/>8</div>
                <div className="day-header">THU<br/>9</div>
                <div className="day-header">FRI<br/>10</div>
                <div className="day-header">SAT<br/>11</div>

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

                {/* Grid Lines (Draws the empty boxes) */}
                {[2,3,4,5,6,7,8,9,10].map(row => 
                  [2,3,4,5,6,7,8].map(col => (
                    <div key={`${row}-${col}`} className="grid-cell" style={{gridRow: row, gridColumn: col}}></div>
                  ))
                )}

                {/* Lunch Break Bar */}
                <div className="lunch-break" style={{gridRow: 6, gridColumn: '2 / 9'}}>
                  LUNCH BREAK
                </div>

                {/* HARDCODED EVENTS using Grid Placement! */}
                {/* Mon (Col 3), 10am to 12pm (Row 4 span 2) */}
                <div className="cal-event red-event" style={{gridRow: '4 / span 2', gridColumn: 3}}>
                  <strong>10:00 AM</strong><br/>Ashley Cornejo<br/>002-0012 Ms. Bangibang
                </div>

                {/* Mon (Col 3), 1pm to 2pm (Row 7 span 1) */}
                <div className="cal-event blue-event" style={{gridRow: '7 / span 1', gridColumn: 3}}>
                  <strong>1:00 PM</strong><br/>Judy Ronquillo<br/>003-0013 Mr. Alangdeo
                </div>

                {/* Wed (Col 5), 9am to 10am (Row 3 span 1) */}
                <div className="cal-event green-event" style={{gridRow: '3 / span 1', gridColumn: 5}}>
                  <strong>9:00 AM</strong><br/>Kim Mendoza<br/>005-0015 Ms. Estacio
                </div>
              </div>

              {/* TABLE: ALL SCHEDULED SESSIONS */}
              <div className="sessions-table-wrapper">
                <div className="sessions-table-header">
                  <h3>All Scheduled Sessions / Pending Requests</h3>
                </div>
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>CASE NO</th>
                      <th>CASE TYPE</th>
                      <th>STUDENT NAME</th>
                      <th>COURSE & YEAR</th>
                      <th>COUNSELOR</th>
                      <th>DATE</th>
                      <th>TIME</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSessions.map(session => (
                      <tr key={session.id}>
                        <td>{session.caseNo}</td>
                        <td className={`type-${session.type.toLowerCase()}`}>{session.type}</td>
                        <td>{session.student}</td>
                        <td className="course-text">{session.course}</td>
                        <td>{session.counselor}</td>
                        <td>{session.date}</td>
                        <td>{session.time}</td>
                        <td><span className={`status-pill ${session.status.toLowerCase()}`}>{session.status}</span></td>
                        <td><button className="action-btn">Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Schedules;