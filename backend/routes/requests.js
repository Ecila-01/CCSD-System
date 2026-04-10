const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');

// POST: Submit a new dynamic form
router.post('/', async (req, res) => {
  try {
    // Pass the ENTIRE payload (req.body) directly into the new request
    // Mongoose will automatically map all the fields (studentName, requiresSchedule, etc.)
    const newRequest = new ServiceRequest(req.body);

    await newRequest.save();

    res.status(201).json({ 
      message: 'Request submitted successfully!',
      request: newRequest 
    });

  } catch (error) {
    // Pro-tip: Log the actual error message from Mongoose so you know exactly what failed!
    console.error("Submission Error:", error.message); 
    res.status(500).json({ message: 'Server error while saving request', error: error.message });
  }
});

// GET: Fetch requests for the Admin Dashboard
router.get('/', async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// PATCH: Update Status (Accept/Decline/Reschedule)
// NOTE: I changed this from '/api/requests/:id' to just '/:id' 
// Assuming this file is mounted in server.js using app.use('/api/requests', ...)
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id, 
      { status: status }, 
      { new: true } // Returns the updated document
    );
    res.json(updatedRequest);
  } catch (error) {
    console.error("Status Update Error:", error.message);
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;