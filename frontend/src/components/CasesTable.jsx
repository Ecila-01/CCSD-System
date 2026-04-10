import React from 'react';
import '../styles/CasesTable.css';

const CasesTable = ({ requests, onView }) => {
  
  // Helper to extract the student's name from your dynamic form data
  const getStudentName = (data) => {
    if (!data) return "N/A";
    // Updated to prioritize the new standardized keys
    return data.studentName || data.fullName || data.referrerName || "N/A";
  };
  // Helper to extract the course from your dynamic form data
  const getCourse = (data) => {
    if (!data) return "N/A";
    // Updated to include 'courseDescription' for Good Moral requests
    return data.courseYear || data.courseDescription || data.yearLevel || "N/A";
  };

  const formatDate = (dateString) => {
    const options = { month: 'long', day: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="cases-table-container">
      <div className="table-header">
        <h3>Updated Cases</h3>
      </div>
      
      <table className="cases-table">
        <thead>
          <tr>
            <th>CASES NO</th>
            <th>CASES</th>
            <th>STUDENT NAME</th>
            <th>COURSE & YEAR</th>
            <th>DATE</th>
            <th>TIME</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {/* Limit to the latest 6 for the dashboard view */}
          {requests.slice(0, 6).map((req, index) => (
            <tr key={req._id}>
              {/* Generate a dummy case number for UI purposes */}
              <td>00{index + 1}-001{index}</td>
              
              <td>
                <span className={`service-badge ${req.serviceName.toLowerCase().replace(/\s+/g, '-')}`}>
                  {req.serviceName}
                </span>
              </td>
              
              {/* We extract data from the flexible requestData object */}
              <td>
                {req.serviceName === "REFERRAL" ? (
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>{req.studentName}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      Ref by: {req.referrerName}
                    </span>
                  </div>
                ) : (
                  req.studentName
                )}
              </td>
              <td>{getCourse(req.requestData)}</td>
              
              <td>{formatDate(req.createdAt)}</td>
              <td>{formatTime(req.createdAt)}</td>
              
              <td>
                <span className={`case-status-badge ${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {req.status}
                </span>
              </td>
              
              <td>
                {/* Trigger the onView prop passed down from Dashboard.jsx */}
                <button 
                  className="action-btn" 
                  onClick={() => onView(req)}
                >
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {requests.length === 0 && (
        <div className="no-data">No cases found.</div>
      )}
      
      <div className="table-footer">
        <span>Showing {Math.min(requests.length, 6)} of {requests.length} cases</span>
      </div>

    </div>
  );
};

export default CasesTable;