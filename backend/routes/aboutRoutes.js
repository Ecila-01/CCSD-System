const express = require('express');
const router = express.Router();
const AboutContent = require('../models/AboutContent');

// @route   GET /api/about
// @desc    Get the About Page content
// @access  Public (Anyone can view the about page)
router.get('/', async (req, res) => {
  try {
    // Find the single about document
    let aboutData = await AboutContent.findOne();

    // Fallback: If for some reason the database is empty, return a default object
    if (!aboutData) {
      aboutData = await AboutContent.create({
        missionStatement: "Mission coming soon...",
        objectives: [],
        teamMembers: []
      });
    }

    res.status(200).json(aboutData);
  } catch (error) {
    console.error("Error fetching About content:", error);
    res.status(500).json({ message: "Server error while fetching About content" });
  }
});

// @route   PUT /api/about
// @desc    Update the About Page content
// @access  Private (Admin Only)
router.put('/', async (req, res) => {
  try {
    // NOTE: If you have an authentication middleware, you should add it to this route
    // e.g., router.put('/', verifyToken, isAdmin, async (req, res) => { ... }

    // Find the very first document and update it with everything in req.body
    const updatedAbout = await AboutContent.findOneAndUpdate(
      {}, // Empty filter means "just grab the first document you find"
      { $set: req.body }, 
      { new: true, upsert: true } // 'new' returns updated doc, 'upsert' creates it if it doesn't exist
    );

    res.status(200).json({ 
      message: "About page updated successfully", 
      data: updatedAbout 
    });
  } catch (error) {
    console.error("Error updating About content:", error);
    res.status(500).json({ message: "Server error while updating About content" });
  }
});

module.exports = router;