const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true 
  },
  fullName: {
    type: String, // e.g., "School of Information Technology"
    trim: true
  },
  courses: [{
    type: String, // e.g., ["BSCS", "BSIT", "BSCPE"]
    trim: true
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Department', departmentSchema);