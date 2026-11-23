const clean = value => typeof value === 'string' ? value.trim() : '';
const normalize = value => clean(value).toLowerCase();
const meaningful = value => !['', 'n/a', 'unknown student', 'unknown', 'unassigned'].includes(normalize(value));

export function studentName(request) {
  return [request.studentName, request.requestData?.studentName, request.requestData?.fullName]
    .find(meaningful) || 'Name not recorded';
}

export function studentIdentity(request) {
  const data = request.requestData || {};
  const id = clean(request.studentIdNumber || data.studentIdNumber || data.studentId);
  // Never use the referring faculty member's email to identify a student.
  const email = normalize(request.studentEmail || data.studentEmail ||
    (normalize(request.serviceName) !== 'referral' ? data.email : ''));
  return {
    id: meaningful(id) ? normalize(id) : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '',
    name: normalize(studentName(request)),
  };
}

export function groupStudents(requests) {
  const emailIds = new Map();
  const emailNames = new Map();
  for (const request of requests) {
    const { id, email, name } = studentIdentity(request);
    if (!email) continue;
    if (!emailIds.has(email)) emailIds.set(email, new Set());
    if (!emailNames.has(email)) emailNames.set(email, new Set());
    if (id) emailIds.get(email).add(id);
    emailNames.get(email).add(name);
  }
  const groups = new Map();
  for (const request of requests) {
    const { id, email } = studentIdentity(request);
    const ids = emailIds.get(email);
    const safeEmail = email && ids?.size <= 1 && emailNames.get(email)?.size === 1;
    const linkedId = id || (safeEmail && ids.size === 1 ? [...ids][0] : '');
    const key = linkedId ? `id:${linkedId}` : safeEmail ? `email:${email}` : `request:${request._id}`;
    if (!groups.has(key)) groups.set(key, { key, requests: [], match: linkedId ? 'Student ID' : safeEmail ? 'Email' : 'Separate request' });
    groups.get(key).requests.push(request);
  }
  return [...groups.values()].map(group => ({
    ...group,
    requests: group.requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  })).sort((a, b) => new Date(b.requests[0].createdAt) - new Date(a.requests[0].createdAt));
}
