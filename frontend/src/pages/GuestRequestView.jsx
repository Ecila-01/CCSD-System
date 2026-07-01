import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MdEvent, MdAccessTime, MdHistory, MdInfoOutline, MdClose, MdEditCalendar, MdChatBubbleOutline, MdCheckCircleOutline } from "react-icons/md";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/AppointmentModal.css';

const GuestRequestView = () => {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for Rescheduling
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bizHours, setBizHours] = useState({ businessHoursStart: 8, businessHoursEnd: 16, slotIntervalMinutes: 30, workingDays: [1,2,3,4,5] });

  // States for Cancellation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/guest/${token}`);
        setRequest(res.data);
      } catch (err) {
        console.error("Invalid or expired link");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
    axios.get(`${import.meta.env.VITE_API_URL}/api/system/settings`)
      .then(res => setBizHours(res.data))
      .catch(err => console.error("Error fetching business hours:", err));
  }, [token]);

  const generateTimeSlots = () => {
    const { businessHoursStart: startH, businessHoursEnd: endH, slotIntervalMinutes: interval } = bizHours;
    const slots = [];
    let totalMins = startH * 60;
    const endMins = endH * 60;
    while (totalMins < endMins) {
      const hour = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const timeLabel = `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`;
      const timeValue = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      slots.push({ label: timeLabel, value: timeValue });
      totalMins += interval;
    }
    return slots;
  };

  // Logic to handle the reschedule submission
  const handleRescheduleSubmit = async () => {
    if (!newDate || !newTime) return alert("Please select both date and time.");
    
    setIsSubmitting(true);
    try {
      const formattedDate = newDate ? newDate.toLocaleDateString('en-CA') : "";
      // Update request: change date/time and set status back to "Pending Review"
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/guest/reschedule/${token}`, {
        appointmentDate: formattedDate,
        timeSlot: newTime,
        status: "Pending Review",
        statusNote: "Student updated the appointment schedule."
      });
      
      setRequest(res.data);
      setIsRescheduling(false);
      alert("Reschedule request submitted. Waiting for counselor review.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit reschedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = async () => {
    setIsCancelling(true);
    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/guest/cancel/${token}`, {
        reason: cancelReason
      });
      setRequest(res.data);
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel appointment.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return null;

  if (!request) return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h2 style={{ color: '#1e293b' }}>Link Expired or Invalid</h2>
      <p style={{ color: '#64748b' }}>Please check your email for the correct tracking URL.</p>
    </div>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending Review': return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
      case 'In-Progress': 
      case 'Processing': return { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' };
      case 'Reschedule Requested': return { bg: '#fff1f2', text: '#e11d48', border: '#ffe4e6' };
      case 'Ready for Pickup': return { bg: '#f0fdf4', text: '#15803d', border: '#dcfce7' };
      case 'Completed': return { bg: '#f0fdf4', text: '#15803d', border: '#dcfce7' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  const statusStyle = getStatusStyle(request.status);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '60px 20px' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#c00000', margin: '0', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>UB CCSD</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Request Tracking Portal</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          
          <div style={{ padding: '30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Current Status</span>
              <div style={{ 
                marginTop: '5px', padding: '6px 16px', borderRadius: '50px', fontSize: '14px', fontWeight: '700',
                backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`, display: 'inline-block' 
              }}>
                {request.status.toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Service Type</span>
              <h3 style={{ margin: '5px 0 0 0', color: '#1e293b' }}>{request.serviceName}</h3>
            </div>
          </div>

          <div style={{ padding: '30px' }}>
            
            {/* ✅ STATUS UPDATES TIMELINE */}
            {request.statusUpdates && request.statusUpdates.length > 0 && (
              <div style={{ marginBottom: '35px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                   <MdChatBubbleOutline size={18} /> Updates History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {request.statusUpdates.map((update, index) => (
                    <div key={index} style={{ 
                      padding: '15px', background: index === request.statusUpdates.length - 1 ? '#f8fafc' : '#ffffff', 
                      borderRadius: '12px', border: '1px solid #f1f5f9', position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: getStatusStyle(update.status).text }}>{update.status.toUpperCase()}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(update.updatedAt).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '14px', fontStyle: 'italic' }}>
                        "{update.note || "Status updated."}"
                      </p>
                    </div>
                  )).reverse()}
                </div>
              </div>
            )}

            <h4 style={{ margin: '0 0 20px 0', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdInfoOutline size={18} /> Submission Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <DetailBox label="Student Name" value={request.studentName} icon={<MdHistory color="#94a3b8" />} />
              <DetailBox label="Date Submitted" value={new Date(request.createdAt).toLocaleDateString()} icon={<MdHistory color="#94a3b8" />} />
              
              {request.requiresSchedule && (
                <>
                  <DetailBox label="Appointment Date" value={request.appointmentDate} icon={<MdEvent color="#3b82f6" />} />
                  <DetailBox label="Time Slot" value={request.timeSlot} icon={<MdAccessTime color="#3b82f6" />} />
                </>
              )}
            </div>

            {/* ✅ RESCHEDULE LOGIC SECTION */}
            {request.status === 'Reschedule Requested' && (
              <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f1f5f9' }}>
                {!isRescheduling ? (
                  <>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px', textAlign: 'center' }}>
                      The counselor has requested a reschedule. Please select a new slot.
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button onClick={() => setIsRescheduling(true)} style={secondaryBtnStyle}>
                        <MdEditCalendar size={18} /> Select New Date
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Select New Schedule</h5>
                    <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Date</p>
                        <div className="custom-datepicker-wrapper">
                          <DatePicker
                            selected={newDate}
                            onChange={(date) => setNewDate(date)}
                            minDate={new Date()}
                            maxDate={new Date(new Date().setMonth(new Date().getMonth() + 2))}
                            filterDate={(date) => (bizHours.workingDays || [1,2,3,4,5]).includes(date.getDay())}
                            placeholderText="Select appointment date"
                            dateFormat="MMMM d, yyyy"
                            className="react-datepicker-custom-input"
                            calendarClassName="ub-custom-calendar"
                          />
                        </div>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Time</p>
                        <div className="time-pill-grid">
                          {generateTimeSlots().map((slot) => {
                            const isSelected = newTime === slot.value;
                            return (
                              <label key={slot.value} className={`time-pill ${isSelected ? 'selected' : ''}`}>
                                <input
                                  type="radio"
                                  name="guestNewTime"
                                  value={slot.value}
                                  onChange={() => setNewTime(slot.value)}
                                  className="hidden-radio"
                                />
                                {slot.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setIsRescheduling(false)} style={{ ...secondaryBtnStyle, flex: 1 }}>Cancel</button>
                      <button onClick={handleRescheduleSubmit} disabled={isSubmitting} style={{ ...dangerBtnStyle, backgroundColor: '#c00000', color: 'white', flex: 2 }}>
                        {isSubmitting ? "Submitting..." : "Confirm & Resubmit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cancel button — only for cancellable statuses */}
          {['Pending Review', 'In-Progress', 'Reschedule Requested'].includes(request.status) && (
            <div style={{ padding: '20px 30px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                style={{ ...dangerBtnStyle, width: '100%', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
              >
                Cancel My Appointment
              </button>
            </div>
          )}

          <div style={{ backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              This is a secure guest view. No login required.
              <br/>For inquiries, contact ccsd@e.ubaguio.edu
            </p>
          </div>
        </div>
      </div>

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      {isCancelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Cancel Appointment</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>
              Are you sure you want to cancel your <strong>{request.serviceName}</strong> appointment? This will notify your counselor.
            </p>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Reason (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows="3"
              placeholder="e.g. Schedule conflict, no longer needed..."
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsCancelModalOpen(false)} style={{ ...secondaryBtnStyle, flex: 1 }}>Go Back</button>
              <button onClick={handleCancelSubmit} disabled={isCancelling} style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#dc2626', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                {isCancelling ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailBox = ({ label, value, icon }) => (
  <div style={{ backgroundColor: '#fcfcfc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
    <p style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '600', fontSize: '14px' }}>
      {value || 'Not Specified'}
    </div>
  </div>
);

// Styles
const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none'
};

const secondaryBtnStyle = {
  flex: 1,
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  backgroundColor: 'white',
  color: '#475569',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};

const dangerBtnStyle = {
  flex: 1,
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};

export default GuestRequestView;