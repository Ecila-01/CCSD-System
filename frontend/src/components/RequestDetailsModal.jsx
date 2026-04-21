import React, { useState, useEffect } from 'react';
import { MdClose, MdOutlineEmail, MdOutlineCalendarToday, MdEditNote } from "react-icons/md";
import '../styles/ServiceModal.css'; 
import axios from 'axios';
import StatusModal from './StatusModal'; // ✅ Importing your custom StatusModal

const RequestDetailsModal = ({ request, onClose, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [serviceFields, setServiceFields] = useState([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);

  // --- STATES FOR THE NOTE MODAL ---
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusNote, setStatusNote] = useState("");

  // --- STATES FOR SUCCESS/ERROR POPUP ---
  const [statusPopup, setStatusPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (!request) return;

    const fetchServiceTemplate = async () => {
      try {
        setIsLoadingFields(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/services/${request.serviceId}`);
        setServiceFields(response.data.fields || []);
      } catch (error) {
        console.error("Error fetching service fields:", error);
      } finally {
        setIsLoadingFields(false);
      }
    };

    if (typeof request.serviceId === 'object' && request.serviceId.fields) {
      setServiceFields(request.serviceId.fields);
      setIsLoadingFields(false);
    } else {
      fetchServiceTemplate();
    }
  }, [request]); 

  const getFieldLabel = (key) => {
    const matchingField = serviceFields.find(field => field.name === key);
    if (matchingField && matchingField.label) {
      return matchingField.label;
    }
    const spaced = key.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  if (!request) return null;
  
  // --- OPEN NOTE MODAL ---
  const initiateStatusUpdate = (status) => {
    setPendingStatus(status);
    setIsNoteModalOpen(true);
  };

  // --- FINAL SUBMISSION FROM NOTE MODAL ---
  const handleFinalUpdate = async () => {
    setIsUpdating(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      let counselorToAssign = request.assignedCounselor || 'Unassigned';
      
      if (request.status === 'Pending Review' && pendingStatus === 'In-Progress') {
        counselorToAssign = currentUser.name; 
      }

      await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/${request._id}`, {
        status: pendingStatus,
        assignedCounselor: counselorToAssign,
        statusNote: statusNote
      });

      // ✅ Show your custom StatusModal on success
      setIsNoteModalOpen(false);
      setStatusPopup({
        isOpen: true,
        type: 'success',
        title: 'Status Updated',
        message: `The request has been moved to ${pendingStatus} successfully.`
      });

    } catch (error) {
      console.error("Failed to update status:", error);
      setIsNoteModalOpen(false);
      setStatusPopup({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: 'There was an error updating the status. Please try again.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle closing the final success modal
  const handleFinalConfirm = () => {
    setStatusPopup({ ...statusPopup, isOpen: false });
    if (onStatusUpdate) onStatusUpdate(); // Refresh dashboard
    onClose(); // Close the detail modal
  };

  // Logic Helpers
  const isGoodMoral = request.serviceName.toUpperCase().includes('GOOD MORAL');
  const isReferral = request.serviceName.toUpperCase() === "REFERRAL";
  const requiresSchedule = Boolean(request.requiresSchedule);

  return (
    <>
      <div className="service-modal-overlay">
        <div className="service-modal-card" style={{ maxWidth: '650px' }}>
          
          <div className="modal-header bg-red" style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            position: 'relative', padding: '15px 20px' 
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Request Details</h2>
            <button type="button" className="close-btn" onClick={onClose} style={{ 
                background: 'transparent', border: 'none', color: 'white', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', padding: '5px'
              }}>
              <MdClose size={28} />
            </button>
          </div>

          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
            
            {/* --- FORM CONTENT --- */}
            <div className="form-section" style={{ marginBottom: '25px' }}>
              {isReferral ? (
                <div style={{ 
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', 
                    background: '#fcfcfc', padding: '20px', borderRadius: '12px', 
                    border: '1px solid #eee', position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: '15px', right: '15px', textAlign: 'right' }}>
                      <span className={`case-status-badge ${request.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`} style={{ display: 'inline-block', marginBottom: '5px', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                        {request.status || 'Pending Review'}
                      </span>
                      <div style={{ fontSize: '10px', color: '#aaa' }}>{new Date(request.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div style={{ borderRight: '1px solid #eee', paddingRight: '10px' }}>
                      <label style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Referred By</label>
                      <h3 style={{ margin: '8px 0 5px 0', color: '#333', fontSize: '18px' }}>{request.referrerName || "Unknown Staff"}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '13px' }}>
                        <MdOutlineEmail size={16} /> {request.referrerEmail || request.requestData?.email || "No contact info"}
                      </div>
                    </div>

                    <div style={{ paddingLeft: '10px' }}>
                      <label style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Being Referred</label>
                      <h2 style={{ margin: '8px 0 5px 0', color: '#c00000', fontSize: '22px' }}>{request.studentName || "Unknown Student"}</h2>
                      <p style={{ margin: 0, fontSize: '14px', color: '#444' }}>{request.requestData?.courseYear}</p>
                    </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#333', fontWeight: '700' }}>{request.studentName || "Unknown Client"}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '15px' }}>
                      <MdOutlineEmail size={18} /> {request.studentEmail || "No email provided"}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`case-status-badge ${request.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`} style={{ display: 'inline-block', marginBottom: '8px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {request.status || 'Pending Review'}
                    </span>
                    <div style={{ fontSize: '12px', color: '#888' }}>Submitted: {new Date(request.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                  <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SERVICE REQUESTED</label>
                  <div style={{ fontWeight: '600', color: '#333' }}>{request.serviceName}</div>
                </div>
                {requiresSchedule && (
                   <div style={{ flex: 1, padding: '15px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #bbdefb' }}>
                     <label style={{ fontSize: '11px', color: '#1565c0', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>REQUESTED SCHEDULE</label>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d47a1', fontWeight: '600' }}>
                        <MdOutlineCalendarToday /> {request.appointmentDate} at {request.timeSlot}
                     </div>
                   </div>
                )}
              </div>
            </div>

            <hr className="divider" style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

            <div className="form-section">
              <h3 className="section-title" style={{ fontSize: '16px', color: '#444', marginBottom: '15px' }}>Form Submission Details</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {isLoadingFields ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>Loading details...</div>
                ) : request.requestData ? (
                  Object.entries(request.requestData).map(([questionKey, answer], index) => {
                    if (questionKey.toLowerCase().includes('name') || questionKey.toLowerCase().includes('email')) return null;
                    if (answer === "" || answer === null || answer === undefined) return null;
                    return (
                      <div key={index} style={{ padding: '12px 15px', background: '#fcfcfc', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getFieldLabel(questionKey)}</span>
                        <span style={{ display: 'block', color: '#222', fontSize: '14px' }}>{Array.isArray(answer) ? answer.join(', ') : typeof answer === 'boolean' ? (answer ? "Yes" : "No") : answer}</span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#888', fontStyle: 'italic' }}>No additional data.</p>
                )}
              </div>
            </div>
          </div>

          {/* LOGICAL FOOTER BUTTONS */}
          <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #eee', background: '#fafafa', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={onClose} disabled={isUpdating} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold', color: '#555' }}>Close</button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {request.status === 'Pending Review' && (
                <>
                  {requiresSchedule && (
                    <button onClick={() => initiateStatusUpdate('Reschedule Requested')} style={{ padding: '10px 15px', background: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Request Reschedule</button>
                  )}
                  <button onClick={() => initiateStatusUpdate('In-Progress')} style={{ padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                    {isReferral ? "Accept Referral" : "Accept Request"}
                  </button>
                </>
              )}

              {request.status === 'In-Progress' && (
                <>
                  {isGoodMoral ? (
                    <button onClick={() => initiateStatusUpdate('Ready for Pickup')} style={{ padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Ready for Pickup</button>
                  ) : isReferral ? (
                    <button onClick={() => initiateStatusUpdate('Completed')} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Mark Completed</button>
                  ) : (
                    <>
                      <button onClick={() => initiateStatusUpdate('Reschedule Requested')} style={{ padding: '10px 15px', background: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Reschedule</button>
                      <button onClick={() => initiateStatusUpdate('No-Show')} style={{ padding: '10px 15px', background: '#eceff1', color: '#455a64', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>No-Show</button>
                      <button onClick={() => initiateStatusUpdate('Completed')} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Mark Completed</button>
                    </>
                  )}
                </>
              )}

              {request.status === 'Ready for Pickup' && (
                <button onClick={() => initiateStatusUpdate('Completed')} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Confirm Received</button>
              )}

              {(request.status === 'Reschedule Requested' || request.status === 'No-Show') && (
                <button onClick={() => initiateStatusUpdate('In-Progress')} style={{ padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Resume Case</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- SEPARATE MODAL FOR STATUS NOTES --- */}
      {isNoteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px', backgroundColor: '#8b0000', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Status Update: {pendingStatus}</h3>
              <MdEditNote size={24} />
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>ADD A NOTE (OPTIONAL)</label>
              <textarea 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', outline: 'none', fontSize: '14px' }}
                placeholder="Include instructions or reason for change..."
                rows="4"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => { setIsNoteModalOpen(false); setStatusNote(""); }} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleFinalUpdate} disabled={isUpdating} style={{ flex: 1, padding: '10px', background: '#8b0000', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isUpdating ? "Saving..." : "Confirm Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ✅ YOUR STATUS MODAL INTEGRATION --- */}
      <StatusModal 
        isOpen={statusPopup.isOpen}
        type={statusPopup.type}
        title={statusPopup.title}
        message={statusPopup.message}
        onConfirm={handleFinalConfirm}
      />
    </>
  );
};

export default RequestDetailsModal;