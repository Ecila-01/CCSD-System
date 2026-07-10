const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'counsellor'],
    default: 'counsellor'
  },
  assignedDepartments: {
    type: [String],
    default: []
  },
  notificationPreferences: {
    newSubmissionEmails: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Failed OTP attempts for the current reset cycle (brute-force lockout).
  resetPasswordAttempts: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', userSchema);
