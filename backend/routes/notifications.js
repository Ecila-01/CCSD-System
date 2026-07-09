const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/notifications/:userId/unread-count  → { count }
// (declared before /:userId so the extra segment matches this route)
router.get('/:userId/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.params.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error counting notifications' });
  }
});

// GET /api/notifications/:userId  → 50 most recent notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// PATCH /api/notifications/:userId/read-all  → mark every unread as read
router.patch('/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.params.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating notifications' });
  }
});

// PATCH /api/notifications/:id/read  → mark a single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const n = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json(n);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

module.exports = router;
