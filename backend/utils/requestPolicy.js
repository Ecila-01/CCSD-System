const { escapeRegex } = require('./counselors');

// Use current database permissions, never client-side department filters.
function scopeForStaff(user) {
  if (user.role === 'admin') return {};
  return { 'requestData.department': { $in: (user.assignedDepartments || [])
    .filter(value => typeof value === 'string' && value.trim())
    .map(value => new RegExp(`^\\s*${escapeRegex(value.trim())}\\s*$`, 'i')) } };
}

function guestView(request) {
  return {
    _id: request._id,
    serviceName: request.serviceName,
    studentName: require('./displayName').personName(request),
    status: request.status,
    requiresSchedule: request.requiresSchedule,
    appointmentDate: request.appointmentDate,
    timeSlot: request.timeSlot,
    createdAt: request.createdAt,
    // Staff notes, author identities, form answers and journal are private.
    statusUpdates: (request.statusUpdates || []).map(update => ({
      status: update.status, updatedAt: update.updatedAt,
    })),
  };
}

function scheduleError(date, time, settings, closures, now = new Date()) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return 'Select a valid appointment date and time.';
  }
  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date) return 'Invalid appointment date.';
  const appointment = new Date(`${date}T${time}:00+08:00`);
  if (appointment <= now) return 'Choose a future appointment.';
  const [hour, minute] = time.split(':').map(Number);
  const minutes = hour * 60 + minute;
  const start = (settings.businessHoursStart ?? 8) * 60;
  const end = (settings.businessHoursEnd ?? 16) * 60;
  const interval = settings.slotIntervalMinutes ?? 30;
  if (!(settings.workingDays || [1, 2, 3, 4, 5]).includes(day.getUTCDay()) ||
      interval <= 0 || minutes < start || minutes >= end || (minutes - start) % interval !== 0) {
    return 'Choose an available slot during office hours.';
  }
  const toMinutes = value => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
  if (closures.some(closure => closure.date === date && (closure.allDay ||
      (minutes < toMinutes(closure.endTime) && minutes + interval > toMinutes(closure.startTime))))) {
    return 'The office is closed during this slot.';
  }
  return null;
}

module.exports = { scopeForStaff, guestView, scheduleError };
