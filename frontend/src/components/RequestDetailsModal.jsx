import React, { useState, useEffect } from 'react';
import { MdClose, MdOutlineEmail, MdOutlineCalendarToday, MdEditNote } from "react-icons/md";
import '../styles/ServiceModal.css';
import axios from 'axios';
import StatusModal from './StatusModal'; // ✅ Importing your custom StatusModal

const RequestDetailsModal = ({ request, onClose, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [serviceFields, setServiceFields] = useState([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);

  // --- REASSIGN STATES ---
  const [allCounselors, setAllCounselors] = useState([]);
  const [reassignValue, setReassignValue] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // --- STATES FOR THE NOTE MODAL ---
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusNote, setStatusNote] = useState("");

  // --- ACCEPT-TIME SLOT CONFLICTS ---
  const [slotConflicts, setSlotConflicts] = useState([]);

  // --- Case journal (Phase 1) ---
  const [caseNotes, setCaseNotes] = useState(request?.caseNotes || []);
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [showStatusHistory, setShowStatusHistory] = useState(false);

  // The dashboard keeps this modal mounted and swaps the `request` prop, so
  // re-sync the journal whenever a different case is opened (otherwise the
  // previous case's notes/toggle state leak into the next one).
  useEffect(() => {
    setCaseNotes(request?.caseNotes || []);
    setNoteText("");
    setNoteError("");
    setShowStatusHistory(false);
  }, [request?._id]);

  // --- STATES FOR SUCCESS/ERROR POPUP ---
  const [statusPopup, setStatusPopup] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (!request) return;
    setReassignValue(request.assignedCounselor || '');

    // Fetch all staff for reassignment dropdown
    axios.get(`${import.meta.env.VITE_API_URL}/api/users`)
      .then(res => setAllCounselors(res.data))
      .catch(err => console.error("Error fetching counselors:", err));

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

  // --- REASSIGN HANDLER ---
  const handleReassign = async () => {
    if (!reassignValue || reassignValue === request.assignedCounselor) return;
    setIsReassigning(true);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/${request._id}`, {
        status: request.status,
        assignedCounselor: reassignValue,
        statusNote: `Case reassigned to ${reassignValue}.`
      });
      setStatusPopup({ isOpen: true, type: 'success', title: 'Reassigned', message: `Case has been reassigned to ${reassignValue}.` });
    } catch (err) {
      setStatusPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to reassign case.' });
    } finally {
      setIsReassigning(false);
    }
  };

  // --- OPEN NOTE MODAL ---
  const initiateStatusUpdate = async (status) => {
    setPendingStatus(status);
    setStatusNote("");
    setSlotConflicts([]);

    // When accepting a scheduled appointment, warn if the same slot is already
    // taken by another active request (heads-up only — the counsellor decides).
    if (status === 'In-Progress' && Boolean(request.requiresSchedule) && request.appointmentDate && request.timeSlot) {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/slot-conflicts`, {
          params: { date: request.appointmentDate, time: request.timeSlot, excludeId: request._id }
        });
        setSlotConflicts(res.data || []);
      } catch (err) {
        console.error("Error checking slot conflicts:", err);
      }
    }

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

  // --- Case journal: add a note ---
  const handleAddNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    setIsAddingNote(true);
    setNoteError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/requests/${request._id}/notes`,
        { text }
      );
      setCaseNotes(res.data.caseNotes || []);
      setNoteText("");
    } catch (error) {
      console.error("Failed to add note:", error);
      setNoteError("Could not save the note. Please try again.");
    } finally {
      setIsAddingNote(false);
    }
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

            {/* ── REASSIGN COUNSELOR ── */}
            <div style={{ margin: '20px 0', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Assigned Counselor
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={reassignValue}
                  onChange={e => setReassignValue(e.target.value)}
                  style={{ flex: 1, minWidth: '180px', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#334155' }}
                >
                  <option value="Unassigned">Unassigned</option>
                  {allCounselors.map(c => (
                    <option key={c._id} value={c.name}>{c.name} ({c.role})</option>
                  ))}
                </select>
                <button
                  onClick={handleReassign}
                  disabled={isReassigning || reassignValue === request.assignedCounselor}
                  style={{
                    padding: '8px 14px', backgroundColor: reassignValue !== request.assignedCounselor ? '#1976d2' : '#e2e8f0',
                    color: reassignValue !== request.assignedCounselor ? 'white' : '#94a3b8',
                    border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isReassigning ? 'wait' : 'pointer', fontSize: '13px'
                  }}
                >
                  {isReassigning ? 'Reassigning…' : 'Reassign'}
                </button>
              </div>
            </div>

            <hr className="divider" style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

            {/* CASE JOURNAL */}
            <div className="form-section case-journal">
              <h3 className="section-title" style={{ fontSize: '16px', color: '#444', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdEditNote size={20} /> Case Journal
              </h3>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>
                Notes on the concern, how sessions went, and follow-up plans. Each note is saved to the case record with your name and the date.
              </p>

              <textarea
                className="cj-input"
                placeholder="Write a case note (e.g. concern raised, how the session went, next meeting plan)…"
                value={noteText}
                onChange={e => { setNoteText(e.target.value); if (noteError) setNoteError(''); }}
              />
              <div className="cj-addrow" style={{ justifyContent: 'flex-end' }}>
                {noteError && <span style={{ color: '#c62828', fontSize: '12px', marginRight: 'auto' }}>{noteError}</span>}
                <button className="cj-add-btn" onClick={handleAddNote} disabled={isAddingNote || !noteText.trim()}>
                  {isAddingNote ? 'Saving…' : 'Add Note'}
                </button>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>
                  {caseNotes.length} note{caseNotes.length === 1 ? '' : 's'}
                </span>
                <button className="cj-toggle" onClick={() => setShowStatusHistory(v => !v)}>
                  {showStatusHistory ? 'Hide status history' : 'Show status history'}
                </button>
              </div>

              {(() => {
                const fmt = (d) => { try { return new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ''; } };
                const items = [
                  ...caseNotes.map(n => ({ kind: 'note', at: n.createdAt, ...n })),
                  ...(showStatusHistory ? (request.statusUpdates || []).map(su => ({ kind: 'status', at: su.updatedAt, ...su })) : []),
                ].sort((a, b) => new Date(b.at) - new Date(a.at));

                if (items.length === 0) {
                  return <p className="cj-empty">No case notes yet. Add the first note above.</p>;
                }
                return (
                  <div className="cj-timeline">
                    {items.map((it, i) => it.kind === 'note' ? (
                      <div key={'n' + i} className="cj-note">
                        <div className="cj-note-head">
                          <span className="cj-meta">{it.author || 'Staff'} · {fmt(it.at)}</span>
                        </div>
                        <div className="cj-note-text">{it.text}</div>
                      </div>
                    ) : (
                      <div key={'s' + i} className="cj-status-row">
                        <span>▸ Status → <strong>{it.status}</strong></span>
                        {it.note ? <span>· {it.note}</span> : null}
                        <span>· {it.updatedBy || 'Staff'} · {fmt(it.at)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
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
                  <button onClick={() => initiateStatusUpdate('Cancelled')} style={{ padding: '10px 15px', background: '#eceff1', color: '#455a64', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Cancel Case</button>
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
                      <button onClick={() => initiateStatusUpdate('Cancelled')} style={{ padding: '10px 15px', background: '#eceff1', color: '#455a64', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Cancel Case</button>
                      <button onClick={() => initiateStatusUpdate('Completed')} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Mark Completed</button>
                    </>
                  )}
                </>
              )}

              {request.status === 'Ready for Pickup' && (
                <button onClick={() => initiateStatusUpdate('Completed')} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Confirm Received</button>
              )}

              {(request.status === 'Reschedule Requested' || request.status === 'Cancelled') && (
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

              {/* ── SLOT CONFLICT REMINDER ── */}
              {slotConflicts.length > 0 && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '10px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>
                  <strong>⚠ Slot already booked:</strong> {slotConflicts.length} other active request{slotConflicts.length > 1 ? 's' : ''} at {request.appointmentDate} {request.timeSlot}:
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                    {slotConflicts.map(c => (
                      <li key={c._id}>
                        {c.studentName} — {c.status}
                        {c.assignedCounselor && c.assignedCounselor !== 'Unassigned' ? ` (with ${c.assignedCounselor})` : ''}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '6px', fontSize: '12px' }}>
                    You can still accept — this is just a reminder.
                  </div>
                </div>
              )}

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
