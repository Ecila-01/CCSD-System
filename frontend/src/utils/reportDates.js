export const completedStatus = status => ['Completed', 'Resolved', 'Issued'].includes(status);

export function reportDate(request, type) {
  if (type === 'overall') return request.createdAt;
  const history = (request.statusUpdates || [])
    .filter(entry => !Number.isNaN(Date.parse(entry.updatedAt)))
    .sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
  let previousStatus;
  let changedAt;
  for (const entry of history) {
    // Reassignment can repeat the same status; it must not move a completion date.
    if (entry.status === request.status && previousStatus !== entry.status) changedAt = entry.updatedAt;
    previousStatus = entry.status;
  }
  if (changedAt) return changedAt;
  // Do not invent completion dates for historical records without an outcome date.
  return completedStatus(request.status) ? null : request.createdAt;
}

export function reportMonth(value) {
  if (!value || Number.isNaN(Date.parse(value))) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date(value));
  return parts.find(part => part.type === 'year').value + '-' + parts.find(part => part.type === 'month').value;
}
