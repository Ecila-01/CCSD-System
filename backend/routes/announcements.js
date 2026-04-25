const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const upload = require('../middleware/upload'); 
const cloudinary = require('cloudinary').v2;

// GET all announcements (Admin View - should show all)
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ datePosted: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new announcement
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // ✅ CLOUDINARY FIX: Just use req.file.path, which is the secure Cloudinary URL
    const imageUrl = req.file ? req.file.path : null;

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

// DELETE an announcement
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // ✅ NEW: Tell Cloudinary to delete the image
    if (announcement.image && announcement.image.includes('cloudinary')) {
      // Extract the 'public_id' from the URL (Cloudinary needs this to know which file to delete)
      // Example URL: https://res.cloudinary.com/.../ccsd_uploads/d0qpirf9ry0hmaypkr9.jpg
      const parts = announcement.image.split('/');
      const filename = parts.pop().split('.')[0]; // Gets 'd0qpirf9ry0hmaypkr9'
      const folder = parts.pop(); // Gets 'ccsd_uploads'
      const publicId = `${folder}/${filename}`; 

      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
    }

    // Delete the database document
    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Announcement and Cloudinary image deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// PATCH (Update) an announcement
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    let updateData = req.body;

    // ✅ CLOUDINARY FIX: Again, just use req.file.path
    if (req.file) {
      updateData.image = req.file.path;
    }

    // 🔍 NEW: Log the incoming data before updating
    console.log(`\n--- UPDATING ANNOUNCEMENT ID: ${req.params.id} ---`);
    console.log("Incoming data to apply:", updateData);

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { 
        returnDocument: 'after', 
        runValidators: true      
      }
    );

    if (!updated) {
      console.log("❌ Update failed: Announcement not found.");
      return res.status(404).json({ message: "Not found" });
    }

    // 🔍 NEW: Log the final result after MongoDB saves it
    console.log("✅ Successfully updated! New MongoDB Document:");
    console.log(updated);
    console.log("------------------------------------------------\n");

    res.json(updated);
  } catch (err) {
    console.error("Patch Error:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;