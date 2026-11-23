import test from 'node:test';
import assert from 'node:assert/strict';
import { groupStudents, studentName } from './studentGroups.js';

const request = (id, fields = {}) => ({ _id: id, studentName: 'Test Student', createdAt: '2026-11-23', ...fields });
test('same student ID groups services even when email changes', () => {
  assert.equal(groupStudents([request('1', { studentIdNumber: '123', studentEmail: 'a@example.com' }),
    request('2', { studentIdNumber: '123', studentEmail: 'b@example.com' })]).length, 1);
});
test('email fallback is normalized and can link an ID-less request to one ID', () => {
  assert.equal(groupStudents([request('1', { studentIdNumber: '123', studentEmail: 'A@example.com ' }),
    request('2', { studentEmail: 'a@example.com' })]).length, 1);
});
test('conflicting IDs sharing an email are never joined through an ID-less record', () => {
  const groups = groupStudents([request('1', { studentIdNumber: '123', studentEmail: 'a@example.com' }),
    request('2', { studentIdNumber: '456', studentEmail: 'a@example.com' }), request('3', { studentEmail: 'a@example.com' })]);
  assert.equal(groups.length, 3);
});
test('same names alone, shared emails with different names, and invalid emails stay separate', () => {
  assert.equal(groupStudents([request('1'), request('2')]).length, 2);
  assert.equal(groupStudents([request('1', { studentEmail: 'a@example.com' }), request('2', { studentName: 'Another Student', studentEmail: 'a@example.com' })]).length, 2);
  assert.equal(groupStudents([request('1', { studentEmail: '09123456789' }), request('2', { studentEmail: '09123456789' })]).length, 2);
});
test('referrer email is never used for student grouping and top-level names render', () => {
  assert.equal(groupStudents([request('1', { serviceName: 'Referral', referrerEmail: 'staff@example.com' }),
    request('2', { serviceName: 'Referral', referrerEmail: 'staff@example.com' })]).length, 2);
  assert.equal(studentName(request('1')), 'Test Student');
});
