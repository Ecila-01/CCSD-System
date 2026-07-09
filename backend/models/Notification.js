const mongoose = require('mongoose');

// In-app notification for staff. One document per recipient.
// This is the always-on channel that backs the notification bell — it stays
// on even when a counsellor opts out of "new submission" emails.
const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // new_submission | reschedule | cancellation
  type: { type: String, default: 'new_submission' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
  department: { type: String, default: '' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
