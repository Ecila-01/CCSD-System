const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const { requireAuth, requireRole } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('admin')];

// GET all announcements (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ datePosted: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new announcement (admin only)
router.post('/', adminOnly, (req, res, next) => {
  upload.single('image')(req, res, (uploadErr) => {
    if (uploadErr) {
      console.error('Upload middleware error:', uploadErr.message);
      return res.status(500).json({ message: 'Image upload failed: ' + uploadErr.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.path : null;
    if (!imageUrl) {
      return res.status(400).json({ message: 'An image is required.' });
    }

    const news = new Announcement({
      title: req.body.title,
      shortDescription: req.body.shortDescription,
      content: req.body.content,
      category: req.body.category,
      eventDate: req.body.eventDate,
      image: imageUrl
    });

    const savedNews = await news.save();
    res.status(201).json(savedNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an announcement (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (announcement.image && announcement.image.includes('cloudinary')) {
      const parts = announcement.image.split('/');
      const filename = parts.pop().split('.')[0];
      const folder = parts.pop();
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement and Cloudinary image deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// PATCH (Update) an announcement (admin only)
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

    const updated = await Announcement.findByIdAndUpdate(
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
