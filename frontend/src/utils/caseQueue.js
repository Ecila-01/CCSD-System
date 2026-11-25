import { personName } from './displayName.js';
export const isClosed = r => ['Completed', 'Resolved', 'Declined', 'Cancelled', 'No-Show'].includes(r.status);
const norm = v => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();
export const studentName = r => personName(r);
export function matchesStudent(r, query) {
 const d = r.requestData || {};
 const email = r.studentEmail || d.studentEmail || (norm(r.serviceName) !== 'referral' ? d.email || d['Email Address'] : '');
 return [studentName(r), r.studentName, [d.studentFirstName,d.studentMiddleName,d.studentLastName].filter(Boolean).join(' '), email].some(v => norm(v).includes(norm(query)));
}
export const untouched = r => r.status === 'Pending' && (!r.assignedCounselor || r.assignedCounselor === 'Unassigned') && !r.caseNotes?.length && !r.priorityUpdates?.length && !(r.statusUpdates || []).some(h => h.updatedBy);
const time = v => Date.parse(v) || 0;
const closedAt = r => [...(r.statusUpdates || [])].reverse().find(h => h.status === r.status)?.updatedAt || r.createdAt;
export function sortCases(requests, mode = 'queue') {
 return [...requests].sort((a,b) => {
  const closed = Number(isClosed(a)) - Number(isClosed(b));
  if (closed) return closed;
  if (mode === 'queue') {
   if (isClosed(a)) return time(closedAt(b)) - time(closedAt(a)) || String(a._id).localeCompare(String(b._id));
   const rank = r => r.priority === 'Urgent' ? 0 : untouched(r) ? 1 : 2;
   if (rank(a) !== rank(b)) return rank(a) - rank(b);
  }
  return (mode === 'newest' ? -1 : 1) * (time(a.createdAt) - time(b.createdAt)) || String(a._id).localeCompare(String(b._id));
 });
}
