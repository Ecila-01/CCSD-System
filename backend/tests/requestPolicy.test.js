const test = require('node:test');
const assert = require('node:assert/strict');
const { scopeForStaff, guestView, scheduleError } = require('../utils/requestPolicy');

test('counselor scope matches only assigned departments, including whitespace/case', () => {
  const filter = scopeForStaff({ role: 'counsellor', assignedDepartments: [' SBAA '] });
  const patterns = filter['requestData.department'].$in;
  assert.ok(patterns.some(pattern => pattern.test('sbaa')));
  assert.ok(!patterns.some(pattern => pattern.test('SIT')));
  assert.deepEqual(scopeForStaff({ role: 'counsellor' })['requestData.department'].$in, []);
  assert.deepEqual(scopeForStaff({ role: 'admin' }), {});
});

test('guest response excludes notes, author identities, forms and tokens', () => {
  const response = guestView({ studentName: 'Test', status: 'Pending Review', caseNotes: [{ text: 'private' }],
    requestData: { confidential: true }, guestToken: 'secret',
    statusUpdates: [{ status: 'Pending Review', updatedAt: '2026-01-01', note: 'private', updatedBy: 'Staff' }] });
  for (const field of ['caseNotes', 'requestData', 'guestToken']) assert.ok(!(field in response));
  assert.deepEqual(response.statusUpdates, [{ status: 'Pending Review', updatedAt: '2026-01-01' }]);
});

test('schedule enforces Manila future times, working days, intervals and closures', () => {
  const now = new Date('2026-11-23T00:00:00Z');
  const check = (date, time, closures = []) => scheduleError(date, time, {}, closures, now);
  assert.equal(check('2026-11-24', '09:00'), null);
  assert.ok(check('2026-11-24', '03:00'));
  assert.ok(check('2026-11-24', '16:00'));
  assert.ok(check('2026-11-24', '09:17'));
  assert.ok(check('2026-11-22', '09:00'));
  assert.ok(check('2026-11-29', '09:00'));
  assert.ok(check('2026-02-30', '09:00'));
  assert.ok(check('2026-11-24', '09:00', [{ date: '2026-11-24', allDay: true }]));
  assert.ok(check('2026-11-24', '09:00', [{ date: '2026-11-24', allDay: false, startTime: '09:15', endTime: '10:00' }]));
  assert.equal(check('2026-11-24', '10:00', [{ date: '2026-11-24', allDay: false, startTime: '09:00', endTime: '10:00' }]), null);
});
