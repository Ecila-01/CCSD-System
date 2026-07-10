const express = require('express');
const router = express.Router();
const Career = require('../models/Career');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const { requireAuth, requireRole } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('admin')];

// GET all career announcements (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const careers = await Career.find().sort({ datePosted: -1 });
    res.json(careers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new career announcement (admin only)
router.post('/', adminOnly, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.path : null;

    const career = new Career({
      title: req.body.title,
      shortDescription: req.body.shortDescription,
      content: req.body.content,
      category: req.body.category,
      eventDate: req.body.eventDate,
      image: imageUrl
    });

    const saved = await career.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a career announcement (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ message: "Career announcement not found" });
    }

    if (career.image && career.image.includes('cloudinary')) {
      const parts = career.image.split('/');
      const filename = parts.pop().split('.')[0];
      const folder = parts.pop();
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
    }

    await Career.findByIdAndDelete(req.params.id);
    res.json({ message: 'Career announcement and Cloudinary image deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// PATCH (Update) a career announcement (admin only)
router.patch('/:id', adminOnly, upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      ...(req.body.title !== undefined && { title: req.body.title }),
      ...(req.body.shortDescription !== undefined && { shortDescription: req.body.shortDescription }),
      ...(req.body.content !== undefined && { content: req.body.content }),
      ...(req.body.category !== undefined && { category: req.body.category }),
      ...(req.body.eventDate !== undefined && { eventDate: req.body.eventDate }),
      ...(req.body.status !== undefined && { status: req.body.status }),
    };
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updated = await Career.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Patch Error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
