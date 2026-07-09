const mongoose = require('mongoose');

// A day (or time-range within a day) when the CCSD office is closed and should
// not accept appointment bookings — holidays, school-wide events, etc.
const officeClosureSchema = new mongoose.Schema({
  date: { type: String, required: true },      // "YYYY-MM-DD"
  allDay: { type: Boolean, default: true },
  startTime: { type: String, default: '' },    // "HH:MM" (24h) — used only when allDay === false
  endTime: { type: String, default: '' },      // "HH:MM" (24h) — exclusive upper bound
  reason: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('OfficeClosure', officeClosureSchema);
