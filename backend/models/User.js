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
  // We keep it as an array of strings to allow multiples
  // But we remove the enum to make updates easier
  assignedDepartments: {
    type: [String], 
    default: []
  },
  createdAt: { type: Date, default: Date.now },
  // Add these inside your UserSchema definition
  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
});


module.exports = mongoose.model('User', userSchema);