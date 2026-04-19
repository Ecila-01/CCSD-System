import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MdEvent, MdAccessTime, MdHistory, MdInfoOutline, MdClose, MdEditCalendar } from "react-icons/md";

const GuestRequestView = () => {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/requests/guest/${token}`);
        setRequest(res.data);
      } catch (err) {
        console.error("Invalid or expired link");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [token]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
      <p style={{ color: '#64748b', fontWeight: '500' }}>Verifying secure link...</p>
    </div>
  );

  if (!request) return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h2 style={{ color: '#1e293b' }}>Link Expired or Invalid</h2>
      <p style={{ color: '#64748b' }}>Please check your email for the correct tracking URL.</p>
    </div>
  );

  // Helper to get status colors
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
      case 'completed': return { bg: '#f0fdf4', text: '#15803d', border: '#dcfce7' };
      case 'declined': return { bg: '#fef2f2', text: '#b91c1c', border: '#fee2e2' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  const statusStyle = getStatusStyle(request.status);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '60px 20px' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#c00000', margin: '0', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>UB CCSD</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Request Tracking Portal</p>
        </div>

        {/* Main Card */}
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          
          {/* Top Status Banner */}
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

            {/* Actions Section */}
            {request.requiresSchedule && (
              <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px', textAlign: 'center' }}>
                  Need to change your appointment? Use the options below.
                </p>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button style={secondaryBtnStyle}>
                    <MdEditCalendar size={18} /> Reschedule
                  </button>
                  <button style={dangerBtnStyle}>
                    <MdClose size={18} /> Cancel Appointment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              This is a secure guest view. No login required. 
              <br/>For inquiries, contact ccsd@e.ubaguio.edu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Detail Component
const DetailBox = ({ label, value, icon }) => (
  <div style={{ backgroundColor: '#fcfcfc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
    <p style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '600' }}>
      {value || 'Not Specified'}
    </div>
  </div>
);

// Button Styles
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
  gap: '8px',
  transition: '0.2s'
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
  gap: '8px',
  transition: '0.2s'
};

export default GuestRequestView;