import React from 'react';
import './CasesTable.css';

const CasesTable = ({ requests }) => {
  // HELPER FUNCTIONS: Since your data is dynamic (NoSQL), 
  // we need to translate different form fields into a unified table view.
  const getStudentName = (data) => {
    return data.studentName || data.fullName || data.referrerName || "N/A";
  };

  const getCourse = (data) => {
    return data.courseYear || data.courseDescription || data.department || "N/A";
  };

  // Helper to format the MongoDB timestamp into "April 06, 2026"
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
          {requests.slice(0, 6).map((req, index) => ( // Showing only top 6 for dashboard
            <tr key={req._id}>
              {/* Fake Case Number for now based on index */}
              <td>00{index + 1}-001{index}</td>
              
              <td>
                <span className={`service-badge ${req.serviceName.toLowerCase().replace(/\s+/g, '-')}`}>
                  {req.serviceName}
                </span>
              </td>
              
              <td>{getStudentName(req.requestData)}</td>
              <td>{getCourse(req.requestData)}</td>
              <td>{formatDate(req.createdAt)}</td>
              <td>{formatTime(req.createdAt)}</td>
              
              <td>
                <span className={`status-badge ${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {req.status}
                </span>
              </td>
              
              <td>
                <button className="action-btn">Open</button>
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