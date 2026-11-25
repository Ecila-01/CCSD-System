import test from 'node:test';
import assert from 'node:assert/strict';
import { sortCases, matchesStudent, untouched } from './caseQueue.js';
const r = (id, date, fields = {}) => ({_id: id, createdAt: date, status: 'Pending', ...fields});
test('queue prioritizes urgent then untouched then active, sorting submissions not appointments', () => {
 const rows = [r('active','2026-01-01',{status:'In-Progress'}),r('pending','2026-02-01'),r('urgent-new','2026-04-01',{priority:'Urgent'}),r('urgent-old','2026-03-01',{priority:'Urgent',appointmentDate:'2027-01-01'})];
 assert.deepEqual(sortCases(rows).map(x=>x._id), ['urgent-old','urgent-new','pending','active']);
 assert.equal(rows[0]._id,'active');
});
test('all sort choices keep every closed status below active cases', () => {
 const rows = ['Completed','Resolved','Declined','Cancelled','No-Show'].map((status,i)=>r(String(i),'2026-06-01',{status,priority:'Urgent'}));
 rows.push(r('a','2026-01-01'), r('b','2026-05-01'));
 for (const mode of ['queue','oldest','newest']) {
  const ids=sortCases(rows,mode).map(x=>x._id);
  assert.deepEqual(ids.slice(0,2),mode==='newest'?['b','a']:['a','b']);
 }
});
test('staff notes, assignment, history and priority changes mean touched; guest history does not',()=>{
 const base=r('a','2026-01-01');
 assert.equal(untouched({...base,statusUpdates:[{status:'Pending'}]}),true);
 for(const extra of [{caseNotes:[{}]},{assignedCounselor:'Staff'},{statusUpdates:[{updatedBy:'Staff'}]},{priorityUpdates:[{}]}]) assert.equal(untouched({...base,...extra}),false);
});
test('search normalizes spaces/case and never treats referrer email as student email',()=>{
 assert.equal(matchesStudent({studentName:'Ana   Cruz'},' ana cruz '),true);
 assert.equal(matchesStudent({studentEmail:'ANA@example.com'},'ana@'),true);
 assert.equal(matchesStudent({serviceName:'Referral',referrerEmail:'staff@example.com',requestData:{email:'staff@example.com'}},'staff@'),false);
});
