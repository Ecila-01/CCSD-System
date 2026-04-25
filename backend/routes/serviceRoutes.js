const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
// Make sure this points to your new Cloudinary upload middleware!
const upload = require('../middleware/upload'); 
const cloudinary = require('cloudinary').v2; // ✅ Added Cloudinary for deletion

// GET all services
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
    // ✅ CLOUDINARY FIX: Grab the direct path from req.file
    const imageUrl = req.file 
      ? req.file.path 
      : req.body.image; // Fallback to URL if no file uploaded

    const service = new Service({
      name: req.body.name,  
      description: req.body.description, 
      status: "Inactive",
      image: imageUrl,
      requiresScheduling: req.body.requiresScheduling === 'true',
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

    // ✅ NEW: Tell Cloudinary to delete the image from the cloud
    if (service.image && service.image.includes('cloudinary')) {
      const parts = service.image.split('/');
      const filename = parts.pop().split('.')[0]; // Gets the random ID
      const folder = parts.pop(); // Gets 'ccsd_uploads'
      const publicId = `${folder}/${filename}`; 

      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
    }

    // Database Deletion
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service and Cloudinary image deleted successfully' });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH (Update) a service
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    
    if (req.body.requiresScheduling !== undefined) {
      updateData.requiresScheduling = req.body.requiresScheduling === 'true';
    }
    if (req.body.status) updateData.status = req.body.status;

    if (req.body.fields) {
      updateData.fields = typeof req.body.fields === 'string' 
        ? JSON.parse(req.body.fields) 
        : req.body.fields;
    }

    // ✅ CLOUDINARY FIX: Update the image using the secure cloud path
    if (req.file) {
      updateData.image = req.file.path;
    }

    // 🔍 NEW: Log the incoming data before updating
    console.log(`\n--- UPDATING SERVICE ID: ${req.params.id} ---`);
    console.log("Incoming data to apply:", updateData);

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { returnDocument: 'after' } 
    );

    if (!updatedService) {
      console.log("❌ Update failed: Service not found.");
      return res.status(404).json({ message: "Service not found" });
    }

    // 🔍 NEW: Log the final result after MongoDB saves it
    console.log("✅ Successfully updated! New MongoDB Document:");
    console.log(updatedService);
    console.log("------------------------------------------------\n");

    res.json(updatedService);
  } catch (err) {
    console.error("Patch Error:", err);
    res.status(400).json({ message: err.message });
  }
});

// GET a single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error("Error fetching single service:", error);
    res.status(500).json({ message: "Server error fetching service" });
  }
});

module.exports = router;