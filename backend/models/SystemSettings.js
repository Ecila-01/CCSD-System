const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  // Business hours (24-hour integers, e.g. 8 = 8 AM, 17 = 5 PM)
  businessHoursStart: { type: Number, default: 8 },
  businessHoursEnd:   { type: Number, default: 16 },
  // Slot interval in minutes
  slotIntervalMinutes: { type: Number, default: 30 },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
