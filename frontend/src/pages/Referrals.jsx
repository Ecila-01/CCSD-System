import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Referrals.css';
import { MdOutlineAssignment, MdOutlineWarning, MdOutlinePending, MdOutlineCheckCircle } from "react-icons/md";

function Referrals() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));
  }, [navigate]);

  // HARDCODED MOCK DATA based on your 3-step form
  const mockReferrals = [
    { 
      id: "REF-001", 
      date: "Apr 06, 2026", 
      referrerName: "Prof. Alan Turing", 
      referrerRole: "Faculty", 
      studentName: "Neil San Miguel", 
      department: "School of Information Technology", 
      reason: "Frequent Absences", 
      recommendation: "Counseling",
      status: "Pending" 
    },
    { 
      id: "REF-002", 
      date: "Apr 05, 2026", 
      referrerName: "Dr. Marie Curie", 
      referrerRole: "Dean", 
      studentName: "Ashley Cornejo", 
      department: "School of Nursing", 
      reason: "Personal Concerns", 
      recommendation: "Counseling",
      status: "Reviewed" 
    },
    { 
      id: "REF-003", 
      date: "Apr 02, 2026", 
      referrerName: "Nurse Joy", 
      referrerRole: "Clinic Staff", 
      studentName: "Judy Ronquillo", 
      department: "School of Business Admin", 
      reason: "Behavioral", 
      recommendation: "Testing",
      status: "Pending" 
    },
    { 
      id: "REF-004", 
      date: "Apr 01, 2026", 
      referrerName: "John Doe", 
      referrerRole: "OSA Staff", 
      studentName: "Elyray Cerezo", 
      department: "School of Engineering", 
      reason: "Failed Grades", 
      recommendation: "Counseling",
      status: "Contacted" 
    },
  ];

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className="content-header">
          <div className="search-box">
             <input type="text" placeholder="Search referrals by student or faculty..." />
          </div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill">
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="referrals-view">
          <div className="page-header">
            <div>
              <h2>Referrals Management</h2>
              <p>Review and process student referrals submitted by university staff and faculty.</p>
            </div>
            <button className="export-btn">Export Log</button>
          </div>

          {/* STATS ROW */}
          <div className="stats-row">
            <div className="stat-card">
              <MdOutlineAssignment className="stat-icon gray" />
              <div><h3>124</h3><p>Total Referrals</p></div>
            </div>
            <div className="stat-card">
              <MdOutlinePending className="stat-icon blue" />
              <div><h3>8</h3><p>Pending Review</p></div>
            </div>
            <div className="stat-card">
              <MdOutlineWarning className="stat-icon red" />
              <div><h3>3</h3><p>High Priority (Behavioral)</p></div>
            </div>
            <div className="stat-card">
              <MdOutlineCheckCircle className="stat-icon green" />
              <div><h3>113</h3><p>Processed / Contacted</p></div>
            </div>
          </div>

          {/* REFERRALS TABLE */}
          <div className="table-wrapper">
            <div className="table-header-bar">
              <h3>Recent Referrals</h3>
              <div className="filter-group">
                <select className="filter-select">
                  <option>All Departments</option>
                  <option>SIT</option>
                  <option>SBAA</option>
                  <option>Nursing</option>
                </select>
                <select className="filter-select">
                  <option>Status: All</option>
                  <option>Pending</option>
                  <option>Reviewed</option>
                </select>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>REFERRED BY</th>
                  <th>STUDENT</th>
                  <th>DEPARTMENT</th>
                  <th>PRIMARY REASON</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {mockReferrals.map((ref, index) => (
                  <tr key={index}>
                    <td className="date-cell">{ref.date}</td>
                    <td>
                      <div className="referrer-info">
                        <strong>{ref.referrerName}</strong>
                        <span>{ref.referrerRole}</span>
                      </div>
                    </td>
                    <td><strong>{ref.studentName}</strong></td>
                    <td className="dept-cell">{ref.department}</td>
                    <td>
                      <span className={`reason-tag ${ref.reason.toLowerCase().replace(/\s+/g, '-')}`}>
                        {ref.reason}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${ref.status.toLowerCase()}`}>
                        {ref.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="table-footer">
              <span>Showing 4 of 124 referrals</span>
              <div className="pagination">
                <button>&lt;</button>
                <button className="active">1</button>
                <button>2</button>
                <button>3</button>
                <button>&gt;</button>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

export default Referrals;