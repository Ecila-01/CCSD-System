const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  // Business hours (24-hour integers, e.g. 8 = 8 AM, 17 = 5 PM)
  businessHoursStart: { type: Number, default: 8 },
  businessHoursEnd:   { type: Number, default: 16 },
  // Slot interval in minutes
  slotIntervalMinutes: { type: Number, default: 30 },
  // Working days (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },

  // --- SUBMISSION LIMIT (anti-duplicate) ---
  // When enabled, a guest cannot hold more than `maxActivePerService` active
  // (non-terminal) requests for the same service. For scheduled services the
  // limit is applied per appointment day.
  submissionLimitEnabled: { type: Boolean, default: true },
  maxActivePerService: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
