const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: String,
  label: String,
  type: String,
  options: [String],
  required: Boolean,
  section: Number, // <--- ADD THIS
  content: String  // <--- ADD THIS (for the info type fields)
});

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  fields: [fieldSchema]
});

module.exports = mongoose.model('Service', serviceSchema);