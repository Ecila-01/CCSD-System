const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

// Ensure the caller may only act on their OWN notifications.
function ownUserId(req, res, next) {
  if (String(req.user.id) !== String(req.params.userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

// GET /:userId/unread-count
router.get('/:userId/unread-count', requireAuth, ownUserId, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.params.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error counting notifications' });
  }
});

// GET /:userId  → 50 most recent notifications for that user
router.get('/:userId', requireAuth, ownUserId, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// PATCH /:userId/read-all
router.patch('/:userId/read-all', requireAuth, ownUserId, async (req, res) => {
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

// PATCH /:id/read  → mark a single notification as read (only if it is yours)
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
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
