import React, { useState } from 'react'; // 1. Add useState
import CaseDetailsModal from './CaseDetailsModal'; // 2. Import the Modal
import './CasesTable.css';

const CasesTable = ({ requests }) => {
  // 3. Add state to track which case is currently being viewed
  const [selectedCase, setSelectedCase] = useState(null);

  const getStudentName = (data) => {
    return data.studentName || data.fullName || data.referrerName || "N/A";
  };

  const getCourse = (data) => {
    return data.courseYear || data.courseDescription || data.department || "N/A";
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
          {requests.slice(0, 6).map((req, index) => (
            <tr key={req._id}>
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
                {/* 4. SET THE SELECTED CASE ON CLICK */}
                <button 
                  className="action-btn" 
                  onClick={() => setSelectedCase(req)}
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

      {/* 5. RENDER THE MODAL AT THE BOTTOM */}
      <CaseDetailsModal 
        isOpen={!!selectedCase} 
        onClose={() => setSelectedCase(null)} 
        request={selectedCase} 
      />

    </div>
  );
};

export default CasesTable;