const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  image: String, 
  title: { type: String, required: true },
  desc: { type: String, required: true }
});

module.exports = mongoose.model('Service', serviceSchema);