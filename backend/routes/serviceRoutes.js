const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST a new service with IMAGE UPLOAD
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Note: req.file is populated by the upload middleware
    // Note: because you are sending FormData, everything in req.body might be a string.
    // We need to parse 'fields' if it's sent as a stringified array.
    
    const imageUrl = req.file 
      ? `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}` 
      : req.body.image; // Fallback to URL if no file uploaded

    const service = new Service({
      name: req.body.name,  
      description: req.body.description, 
      status: "Inactive",
      image: imageUrl,
      requiresScheduling: req.body.requiresScheduling === 'true',
      // Parse fields if it's a string, otherwise use as is
      fields: typeof req.body.fields === 'string' ? JSON.parse(req.body.fields) : req.body.fields
    });

    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.image) {
      // 1. Extract filename from URL
      const filename = service.image.split('/').pop();
      
      // 2. Correct Path: From backend/routes -> up to backend -> public -> upload
      const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);

      // Debugging: This will print the exact path to your terminal
      console.log("Attempting to delete:", filePath);

      // 3. Physical Deletion
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("✅ Physical file deleted successfully.");
      } else {
        console.log("❌ File not found at path. Check if filename matches.");
      }
    }

    // 4. Database Deletion
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service and physical image deleted successfully' });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});
// Update only specific fields (like Status)
// Update only specific fields (Handles both simple JSON and complex Form Data with images)
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = {};

    // 1. Grab basic text fields if they exist in the request
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    
    if (req.body.requiresScheduling !== undefined) {
      updateData.requiresScheduling = req.body.requiresScheduling === 'true';
    }

    // This allows your Active/Inactive toggle feature to still work perfectly
    if (req.body.status) updateData.status = req.body.status;

    // 2. Parse the stringified fields array if the frontend sent it
    if (req.body.fields) {
      updateData.fields = typeof req.body.fields === 'string' 
        ? JSON.parse(req.body.fields) 
        : req.body.fields;
    }

    // 3. Handle the image ONLY if a new file was actually uploaded
    if (req.file) {
      updateData.image = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { returnDocument: 'after' } // Returns the newly updated document
    );

    res.json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// GET a single service by ID
router.get('/:id', async (req, res) => {
  try {
    // Find the service in MongoDB using the ID from the URL
    const service = await Service.findById(req.params.id);
    
    // If it doesn't exist, send a 404 back
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // If it does exist, send the service data (including the fields!) back to React
    res.json(service);
  } catch (error) {
    console.error("Error fetching single service:", error);
    res.status(500).json({ message: "Server error fetching service" });
  }
});
module.exports = router;