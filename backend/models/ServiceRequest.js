const mongoose = require('mongoose');
const crypto = require('crypto');


const serviceRequestSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  serviceName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Active', 'Completed', 'Declined', 'Cancelled'], 
    default: 'Pending' 
  },
  assignedCounselor: { type: String, default: 'Unassigned' },
  // --- THE VITAL EXTRACTED FIELDS ---
  // The Student (The primary subject of the service)
  studentName: { type: String, required: true },
  studentEmail: { type: String }, // Optional, as referrals might only have their ID
  studentIdNumber: { type: String },

  // The Referrer (ONLY populated if serviceName === "REFERRAL")
  referrerName: { type: String },
  referrerEmail: { type: String },
  
  // --- SCHEDULING FIELDS ---
  requiresSchedule: { type: Boolean, default: false },
  appointmentDate: { type: String }, 
  timeSlot: { type: String },

  // --- THE FULL DYNAMIC FORM DATA ---
  requestData: { type: mongoose.Schema.Types.Mixed, required: true },

  guestToken: { 
    type: String, 
    default: () => crypto.randomUUID(), // ✅ This generates a standard UUID v4
    unique: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);