const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: String,
  label: String,
  type: String,
  options: [String],
  required: Boolean,
  section: Number, 
  content: String,
  dependsOnLabel: { type: String, default: "" },
  optionsMap: { type: mongoose.Schema.Types.Mixed, default: {} },
  isSystemLinked: String 
  
});

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true },
  description: { type: String, required: true },
  requiresScheduling: { type: Boolean, default: false },
  image: { type: String },
  fields: [fieldSchema]
});

module.exports = mongoose.model('Service', serviceSchema);