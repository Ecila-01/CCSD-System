const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const upload = require('../middleware/upload'); 
const fs = require('fs');
const path = require('path');

// GET all announcements (Admin View - should show all)
router.get('/', async (req, res) => {
  try {
    // REMOVE: { status: 'Active' } 
    // This ensures both Active and Archived show up in your dashboard
    const announcements = await Announcement.find().sort({ datePosted: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new announcement
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file 
      ? `http://localhost:5000/uploads/${req.file.filename}` 
      : null;

    const news = new Announcement({
      title: req.body.title,
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


router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // 1. Only attempt to delete if it's a local file (not a placeholder URL)
    if (announcement.image && announcement.image.includes('localhost')) {
      try {
        const filename = announcement.image.split('/').pop();
        
        // Path logic: Up from 'routes', into 'public', then 'upload'
        const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);

        console.log("Attempting to delete image:", filePath);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("✅ Physical announcement image deleted.");
        } else {
          console.log("❌ Physical file not found at path.");
        }
      } catch (fileErr) {
        console.error("Error during file system unlinking:", fileErr);
      }
    }

    // 2. Delete the database document
    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Announcement and associated image deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});


router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    // If it's a simple Archive toggle, req.body might just be { status: "Archived" }
    let updateData = req.body;

    // If there's an image, handle the URL
    if (req.file) {
      updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: 'after', // ✅ Modern syntax
        runValidators: true      // ✅ Ensures model logic is followed
      }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Patch Error:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;