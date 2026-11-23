import { useEffect, useRef } from 'react';
import { studentName, studentIdentity } from '../utils/studentGroups';
import '../styles/StudentHistory.css';

export default function StudentHistoryModal({ group, onClose, onView }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const latest = group.requests[0];
  const identity = studentIdentity(latest);
  return (
    <dialog ref={dialog} className="student-history" aria-labelledby="student-history-title" onCancel={onClose}>
      <header className="student-history-header">
        <div>
          <h2 id="student-history-title">{studentName(latest)}</h2>
          <p>{identity.id ? `Student ID: ${identity.id}` : identity.email || 'No student identifier recorded'}</p>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <p>{group.requests.length} service request{group.requests.length === 1 ? '' : 's'} · Matched by {group.match.toLowerCase()}.</p>
      <p className="student-history-hint">Identifiers are supplied on guest forms. Confirm the student’s identity before handling a case. Only requests you can access are shown.</p>
      <ul className="student-history-list">
        {group.requests.map(request => (
          <li key={request._id}>
            <div>
              <h3>{request.serviceName}</h3>
              <p>{new Date(request.createdAt).toLocaleDateString()} · {request.requestData?.department || 'Department not recorded'}</p>
              <p>{request.status} · {request.assignedCounselor || 'Unassigned'}</p>
              {request.requiresSchedule && <p>Appointment: {request.appointmentDate} {request.timeSlot}</p>}
            </div>
            <button type="button" onClick={() => onView(request)}>Open request</button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
