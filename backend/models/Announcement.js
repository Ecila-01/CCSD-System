const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: { type: String, required: true },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String, 
    enum: ['EVENT', 'UPDATE', 'MEMO', 'INFO'],
    default: 'UPDATE'
  },
  image: {
    type: String, // URL path to the uploaded image
    required: true
  },
  datePosted: {
    type: Date,
    default: Date.now
  },
  eventDate: {
    type: String, // Optional: e.g., "March 17-19, 2026"
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);