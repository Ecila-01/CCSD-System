const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  // 1. What service did they request? (e.g., "COUNSELING", "GOOD MORAL")
  serviceName: { 
    type: String, 
    required: true 
  },
  
  // 2. Track the status for the admin dashboard
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Declined'],
    default: 'Pending' 
  },
  
  // 3. THE MAGIC FIELD: This accepts ANY form data
  requestData: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt dates
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);