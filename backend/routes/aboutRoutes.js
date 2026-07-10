const express = require('express');
const router = express.Router();
const AboutContent = require('../models/AboutContent');
const { requireAuth, requireRole } = require('../middleware/auth');

// @route GET /api/about  (PUBLIC — anyone can view the About page)
router.get('/', async (req, res) => {
  try {
    let aboutData = await AboutContent.findOne();
    if (!aboutData) {
      aboutData = await AboutContent.create({
        missionStatement: "Mission coming soon...",
        objectives: [],
        teamMembers: []
      });
    }
    res.status(200).json(aboutData);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching About content" });
  }
});

// @route PUT /api/about  (admin only)
router.put('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // Whitelist the editable fields (prevents arbitrary key injection).
    const { missionStatement, objectives, teamMembers, visionStatement, orgChart } = req.body;
    const updateData = {
      ...(missionStatement !== undefined && { missionStatement }),
      ...(visionStatement !== undefined && { visionStatement }),
      ...(objectives !== undefined && { objectives }),
      ...(teamMembers !== undefined && { teamMembers }),
      ...(orgChart !== undefined && { orgChart }),
    };

    const updatedAbout = await AboutContent.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "About page updated successfully", data: updatedAbout });
  } catch (error) {
    res.status(500).json({ message: "Server error while updating About content" });
  }
});

module.exports = router;
