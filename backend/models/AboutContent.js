const mongoose = require('mongoose');

const OrgMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  departmentTag: { type: String, default: "" }, // e.g., "SIT & DAS"
  imageUrl: { type: String, default: "" },      // URL or upload path
  hierarchyLevel: { type: Number, default: 3 }  // e.g., 1 for Director, 2 for Psychometrician, 3 for Associate, 4 for Student Assistant
});

const AboutContentSchema = new mongoose.Schema({
  // Contact & Hero Info
  email: { type: String, default: 'ccsd@ubaguio.edu' },
  phone: { type: String, default: 'loc.225' },
  location: { type: String, default: 'Building F, 2nd Floor · F006' },
  heroDescriptionParagraphs: [{ type: String }], 
  
  // Mission & Objectives
  missionStatement: { type: String, default: '' },
  objectives: [{ type: String }],
  
  // Team / Org Chart
  teamMembers: [OrgMemberSchema],

  // Metadata
  lastUpdatedBy: { type: String, default: 'admin' }
}, { timestamps: true });

module.exports = mongoose.model('AboutContent', AboutContentSchema);