const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');

// POST: Submit a new dynamic form
router.post('/', async (req, res) => {
  try {
    // req.body will contain the payload from your React modal
    const { serviceName, requestData } = req.body;

    // Create a new record using the universal schema
    const newRequest = new ServiceRequest({
      serviceName,
      requestData // MongoDB will swallow the entire formData object here!
    });

    await newRequest.save();

    res.status(201).json({ 
      message: 'Request submitted successfully!',
      request: newRequest 
    });

  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ message: 'Server error while saving request' });
  }
});

// GET: Fetch requests for the Admin Dashboard
router.get('/', async (req, res) => {
  try {
    // Sort by newest first
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

module.exports = router;