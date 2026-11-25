const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
function personName(request, role = 'student') {
  const data = request.requestData || {};
  const first = clean(data[role + 'FirstName']);
  const last = clean(data[role + 'LastName']);
  if (first && last) {
    const middle = clean(data[role + 'MiddleName']);
    const initials = (middle.match(/[\p{L}\p{M}]+/gu) || [])
      .map(word => Array.from(word)[0].toLocaleUpperCase()).join('.');
    return last + ', ' + first + (initials ? ' ' + initials : '');
  }
  return clean(request[role + 'Name']) || clean(data[role + 'Name']) ||
    (role === 'student' ? clean(data.fullName) || 'N/A' : 'Unknown Referrer');
}
module.exports = { personName };
