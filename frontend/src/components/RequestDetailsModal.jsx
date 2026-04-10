import React from 'react';
import { MdClose, MdOutlineEmail, MdOutlineCalendarToday } from "react-icons/md";
import '../styles/ServiceModal.css'; // Reusing your existing modal styles!
import { useState } from 'react';
import axios from 'axios';

const RequestDetailsModal = ({ request, onClose, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  // If no request is selected, don't render anything
  if (!request) return null;

  const handleUpdateStatus = async (newStatus) => {
    console.log(request)
    setIsUpdating(true);
    try {
      await axios.patch(`http://localhost:5000/api/requests/${request._id}`, {
        status: newStatus
      });
      // Tell the Dashboard to re-fetch the data, then close the modal
      if (onStatusUpdate) onStatusUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card" style={{ maxWidth: '650px' }}>
        
        <div className="modal-header bg-red">
          <h2>REQUEST DETAILS</h2>
          <button className="close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Scrollable body in case the form is really long */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
          
          {/* SECTION 1: Client Vitals */}
          <div className="form-section" style={{ marginBottom: '25px' }}>
            {request.serviceName === "REFERRAL" ? (
              /* --- REFERRAL SPECIFIC HEADER: TWO COLUMNS --- */
              <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '20px', 
                  background: '#fcfcfc', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid #eee',
                  position: 'relative'
                }}>
                {/* Status Badge */}
                  <div style={{ position: 'absolute', top: '15px', right: '15px', textAlign: 'right' }}>
                    <span className={`case-status-badge ${request.status?.toLowerCase() || 'pending'}`} style={{ display: 'inline-block', marginBottom: '5px', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                      {request.status || 'Pending'}
                    </span>
                    <div style={{ fontSize: '10px', color: '#aaa' }}>{new Date(request.createdAt).toLocaleDateString()}</div>
                  </div>

                  {/* COLUMN A: THE REFERRER (Now on the Left) */}
                  <div style={{ borderRight: '1px solid #eee', paddingRight: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Referred By</label>
                    <h3 style={{ margin: '8px 0 5px 0', color: '#333', fontSize: '18px' }}>
                      {request.referrerName || "Unknown Staff"}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '13px' }}>
                      <MdOutlineEmail size={16} /> 
                      {request.referrerEmail || request.requestData?.email || "No contact info"}
                    </div>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                      Role: {request.requestData?.referredBy || "Staff"}
                    </p>
                  </div>

                {/* COLUMN B: THE STUDENT (Now on the Right) */}
                  <div style={{ paddingLeft: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Being Referred</label>
                    <h2 style={{ margin: '8px 0 5px 0', color: '#c00000', fontSize: '22px' }}>
                      {request.studentName || "Unknown Student"}
                    </h2>
                    <p style={{ margin: 0, fontSize: '14px', color: '#444', fontWeight: '500' }}>
                      {request.requestData?.courseYear}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#777' }}>
                      {request.requestData?.department}
                    </p>
                  </div>
              </div>
            ) : (
              /* --- STANDARD HEADER: COUNSELING & GOOD MORAL --- */
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#333', fontWeight: '700' }}>
                    {request.guestName || request.requestData?.studentName || request.requestData?.fullName || "Unknown Client"}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '15px' }}>
                    <MdOutlineEmail size={18} /> 
                    {request.guestEmail || request.requestData?.email || "No email provided"}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span className={`case-status-badge ${request.status?.toLowerCase() || 'pending'}`} style={{ display: 'inline-block', marginBottom: '8px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                    {request.status || 'Pending'}
                  </span>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    Submitted: {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SERVICE REQUESTED</label>
                <div style={{ fontWeight: '600', color: '#333' }}>{request.serviceName}</div>
              </div>

              {/* Only show schedule box if this service requires a calendar appointment */}
              {request.requiresSchedule && (
                 <div style={{ flex: 1, padding: '15px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #bbdefb' }}>
                   <label style={{ fontSize: '11px', color: '#1565c0', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>REQUESTED SCHEDULE</label>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d47a1', fontWeight: '600' }}>
                      <MdOutlineCalendarToday />
                      {request.appointmentDate ? new Date(request.appointmentDate).toLocaleDateString() : 'No Date'} 
                      {request.timeSlot ? ` at ${request.timeSlot}` : ''}
                   </div>
                 </div>
              )}
            </div>
          </div>

          <hr className="divider" style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

          {/* SECTION 2: Dynamic Form Answers */}
          <div className="form-section">
            <h3 className="section-title" style={{ fontSize: '16px', color: '#444', marginBottom: '15px' }}>Form Submission Details</h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {request.requestData ? (
                Object.entries(request.requestData).map(([question, answer], index) => {
                  // Skip displaying the Name and Email here since they are already at the top!
                  if (question.toLowerCase().includes('name') || question.toLowerCase().includes('email')) {
                    return null;
                  }

                  return (
                    <div key={index} style={{ padding: '12px 15px', background: '#fcfcfc', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {question}
                      </span>
                      <span style={{ display: 'block', color: '#222', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                        {/* If the answer is an array (like multiple checkboxes), join them with commas */}
                        {Array.isArray(answer) ? answer.join(', ') : (answer || <em style={{color: '#aaa'}}>No answer provided</em>)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No additional form data provided.</p>
              )}
            </div>
          </div>

        </div>

        <div className="modal-footer" style={{ 
            padding: '15px 20px', 
            borderTop: '1px solid #eee', 
            background: '#fafafa', 
            borderRadius: '0 0 8px 8px',
            display: 'flex',
            justifyContent: 'space-between', // Pushes Close to left, Actions to right
            alignItems: 'center'
        }}>
          
          <button 
            onClick={onClose} 
            disabled={isUpdating}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}
          >
            Close
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* IF PENDING: Show Accept/Decline */}
            {request.status === 'Pending' && (
              <>
                <button 
                  onClick={() => handleUpdateStatus('Declined')}
                  disabled={isUpdating}
                  style={{ padding: '10px 20px', background: '#ffebee', color: '#c00000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Decline
                </button>

                {/* NEW: Reschedule Button directly on the Pending screen */}
                {request.requiresSchedule && (
                  <button 
                    // For now, we can keep it in Pending status, but later this will trigger the email modal
                    onClick={() => {
                      alert(`Later, this will open an email to ${request.guestEmail || 'the student'} to propose a new time.`);
                      // handleUpdateStatus('Pending - Rescheduling'); // Optional: Create a new status for this
                    }} 
                    disabled={isUpdating}
                    style={{ padding: '10px 20px', background: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Request Reschedule
                  </button>
                )}

                <button 
                  onClick={() => handleUpdateStatus('Active')}
                  disabled={isUpdating}
                  style={{ padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {request.requiresSchedule ? 'Confirm Appointment' : 'Accept Request'}
                </button>
              </>
            )}

            {/* IF ACTIVE: Show Complete/Reschedule */}
            {request.status === 'Active' && (
              <>
                <button 
                  onClick={() => handleUpdateStatus('Pending')} // Bounces it back to pending for rescheduling
                  disabled={isUpdating}
                  style={{ padding: '10px 20px', background: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Request Reschedule
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Completed')}
                  disabled={isUpdating}
                  style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Mark as Completed
                </button>
              </>
            )}

            {/* If Completed or Declined, no extra action buttons are shown */}
            {isUpdating && <span style={{ alignSelf: 'center', fontSize: '14px', color: '#888' }}>Updating...</span>}
          </div>

        </div>

      </div>
    </div>
  );
};

export default RequestDetailsModal;