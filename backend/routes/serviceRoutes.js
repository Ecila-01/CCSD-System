const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const { requireAuth, requireRole } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('admin')];

// GET all services (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new service with IMAGE UPLOAD (admin only)
router.post('/', adminOnly, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.path : req.body.image;

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

// DELETE a service (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.image && service.image.includes('cloudinary')) {
      const parts = service.image.split('/');
      const filename = parts.pop().split('.')[0];
      const folder = parts.pop();
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service and Cloudinary image deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// PATCH (Update) a service (admin only)
router.patch('/:id', adminOnly, upload.single('image'), async (req, res) => {
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
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(updatedService);
  } catch (err) {
    console.error("Patch Error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// GET a single service by ID (PUBLIC)
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching service" });
  }
});

module.exports = router;
