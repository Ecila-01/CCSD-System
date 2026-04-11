import React from 'react';
import '../styles/CasesTable.css';
import { useState } from 'react';
const CasesTable = ({ requests, onView, title = "Updated Cases", itemsPerPage = 6 }) => {
  const [currentPage, setCurrentPage] = useState(1);
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

  const getDisplayDate = (req) => {
    // If it has an appointment, use that. Otherwise, use the day they submitted the form.
    const dateString = (req.requiresSchedule && req.appointmentDate) ? req.appointmentDate : req.createdAt;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
  };

  const getDisplayTime = (req) => {
    if (req.requiresSchedule && req.timeSlot) {
      // Convert standard "14:30" string to "2:30 PM"
      return new Date(`1970-01-01T${req.timeSlot}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    // Fallback: Time the form was submitted
    return new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  // --- NEW: DYNAMIC COLOR GENERATOR ---
  // --- UPGRADED: HYBRID COLOR GENERATOR ---
  const getServiceColor = (serviceName) => {
    if (!serviceName) return { bg: '#f1f3f4', text: '#5f6368' }; // Default Gray

    const nameUpper = serviceName.toUpperCase();

    // 1. CORE SERVICES (Perfectly controlled colors)
    const coreColors = {
      'COUNSELING': { bg: '#fce4e4', text: '#c00000' },             // UB Red
      'REFERRAL': { bg: '#e8f0fe', text: '#1a73e8' },               // Professional Blue
      'GOOD MORAL CERTIFICATE': { bg: '#e6f4ea', text: '#137333' }, // Success Green
      'CAREER PLACEMENT': { bg: '#e0f2f1', text: '#00796b' }        // Modern Teal
    };

    if (coreColors[nameUpper]) {
      return coreColors[nameUpper];
    }

    // 2. CURATED FALLBACK PALETTE (For future services)
    // A list of guaranteed good-looking pastel combinations
    const fallbackPalette = [
      { bg: '#f3e8fd', text: '#6a1b9a' }, // Purple
      { bg: '#fff3e0', text: '#e65100' }, // Orange
      { bg: '#e8eaf6', text: '#283593' }, // Indigo
      { bg: '#fce4ec', text: '#ad1457' }, // Pink
      { bg: '#e0f7fa', text: '#006064' }  // Cyan
    ];

    // Math hash to pick consistently from our curated list
    let hash = 0;
    for (let i = 0; i < serviceName.length; i++) {
      hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % fallbackPalette.length;
    return fallbackPalette[index];
  };
  // --- NEW: PAGINATION LOGIC ---
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const indexOfLastRequest = currentPage * itemsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - itemsPerPage;
  
  // Slice the array to only get the items for the current page
  const currentRequests = requests.slice(indexOfFirstRequest, indexOfLastRequest);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };
  return (
    <div className="cases-table-container">
      <div className="table-header">
        <h3>{title}</h3>
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
          {currentRequests.map((req, index) => (
            <tr key={req._id}>
              <td>00{indexOfFirstRequest + index + 1}-001{indexOfFirstRequest + index}</td>
              
              <td>
                <span 
                  className="service-badge"
                  style={{ 
                    backgroundColor: getServiceColor(req.serviceName).bg,
                    color: getServiceColor(req.serviceName).text
                  }}
                >
                  {req.serviceName}
                </span>
              </td>
              
              <td>
                {req.serviceName === "REFERRAL" ? (
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>{req.studentName}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>Ref by: {req.referrerName}</span>
                  </div>
                ) : (
                  getStudentName(req.requestData)
                )}
              </td>
              
              <td>{getCourse(req.requestData)}</td>
              
              {/* --- UPDATED SMART DATE & TIME COLUMNS --- */}
              <td>
                {getDisplayDate(req)}
                {/* Helpful tiny label so the user knows WHICH date they are looking at */}
                <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', fontWeight: '500', textTransform: 'uppercase' }}>
                  {req.requiresSchedule ? 'Appointment' : 'Submitted'}
                </div>
              </td>
              <td>
                <span style={{ fontWeight: req.requiresSchedule ? 'bold' : 'normal', color: '#333' }}>
                  {getDisplayTime(req)}
                </span>
              </td>
              
              <td>
                <span className={`case-status-badge ${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {req.status}
                </span>
              </td>
              
              <td>
                <button className="action-btn" onClick={() => onView(req)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {requests.length === 0 && (
        <div className="no-data">No cases found.</div>
      )}
      
      <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #eee' }}>
        <span style={{ fontSize: '13px', color: '#666' }}>
          {requests.length > 0 
            ? `Showing ${indexOfFirstRequest + 1} to ${Math.min(indexOfLastRequest, requests.length)} of ${requests.length} cases`
            : `Showing 0 of 0 cases`
          }
        </span>

        {/* Only show buttons if there is more than 1 page */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === 1 ? '#f9f9f9' : '#fff',
                color: currentPage === 1 ? '#aaa' : '#333',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Prev
            </button>
            
            <span style={{ padding: '6px 14px', backgroundColor: '#fce4e4', color: '#c00000', borderRadius: '4px', fontWeight: 'bold' }}>
              {currentPage}
            </span>

            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === totalPages ? '#f9f9f9' : '#fff',
                color: currentPage === totalPages ? '#aaa' : '#333',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default CasesTable;