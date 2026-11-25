import { useEffect, useState } from 'react';
import axios from 'axios';
import { isClosed } from '../utils/caseQueue';
export default function CasePriorityControl({ request, onUpdated, compact = false }) {
 const [priority, setPriority] = useState(request.priority || 'Normal');
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');
 useEffect(() => {setPriority(request.priority || 'Normal'); setError('');}, [request._id, request.priority]);
 const urgent = priority === 'Urgent';
 async function toggle() {
  if (saving || isClosed(request)) return;
  setSaving(true); setError('');
  try {
   const {data} = await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/${request._id}/priority`, {priority: urgent ? 'Normal' : 'Urgent'});
   setPriority(data.priority); onUpdated?.(data);
  } catch(e) {setError(e.response?.data?.message || 'Could not update priority. Try again.');}
  finally {setSaving(false);}
 }
 return <div className="case-priority-control">
  {!compact && <span>Priority: <strong>{priority}</strong> </span>}
  <button type="button" className={`case-priority-button ${urgent ? 'is-urgent' : ''}`} aria-pressed={urgent}
   aria-label={urgent ? 'Remove urgent priority' : 'Mark as urgent'} title={isClosed(request) ? 'Closed cases cannot change priority' : urgent ? 'Remove urgent priority' : 'Mark as urgent'} disabled={saving || isClosed(request)} onClick={toggle}>
   {saving ? 'Saving…' : compact ? '⚑' : urgent ? 'Remove urgent' : 'Mark as urgent'}</button>
  {error && <span role="alert" className="case-priority-error">{error}</span>}
 </div>;
}
