const express = require('express');
const router = express.Router();
const Career = require('../models/Career');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;

// GET all career announcements (Admin View - shows all)
router.get('/', async (req, res) => {
  try {
    const careers = await Career.find().sort({ datePosted: -1 });
    res.json(careers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new career announcement
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Cloudinary stores the secure URL in req.file.path
    const imageUrl = req.file ? req.file.path : null;

    const career = new Career({
      title: req.body.title,
      shortDescription: req.body.shortDescription, // included (the announcement route is missing this)
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

// DELETE a career announcement
router.delete('/:id', async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);

    if (!career) {
      return res.status(404).json({ message: "Career announcement not found" });
    }

    // Tell Cloudinary to delete the image
    if (career.image && career.image.includes('cloudinary')) {
      const parts = career.image.split('/');
      const filename = parts.pop().split('.')[0];
      const folder = parts.pop();
      const publicId = `${folder}/${filename}`;

      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted image from Cloudinary: ${publicId}`);
    }

    await Career.findByIdAndDelete(req.params.id);

    res.json({ message: 'Career announcement and Cloudinary image deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH (Update) a career announcement - also handles status toggle
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    let updateData = req.body;

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updated = await Career.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        returnDocument: 'after',
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Patch Error:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
