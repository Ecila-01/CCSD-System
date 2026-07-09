const express = require('express');
const router = express.Router();
const OfficeClosure = require('../models/OfficeClosure');

// GET /api/closures  → all closures, soonest first
router.get('/', async (req, res) => {
  try {
    const closures = await OfficeClosure.find().sort({ date: 1 });
    res.json(closures);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching closures' });
  }
});

// POST /api/closures  → add a closure (full day, or a time-range within a day)
router.post('/', async (req, res) => {
  try {
    const { date, allDay, startTime, endTime, reason, createdBy } = req.body;
    if (!date) return res.status(400).json({ message: 'A date is required.' });

    const isAllDay = allDay !== false;
    if (!isAllDay && (!startTime || !endTime)) {
      return res.status(400).json({ message: 'Partial closures need a start and end time.' });
    }

    const closure = await new OfficeClosure({
      date,
      allDay: isAllDay,
      startTime: isAllDay ? '' : startTime,
      endTime: isAllDay ? '' : endTime,
      reason: reason || '',
      createdBy: createdBy || '',
    }).save();

    res.status(201).json(closure);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/closures/:id  → remove a closure
router.delete('/:id', async (req, res) => {
  try {
    await OfficeClosure.findByIdAndDelete(req.params.id);
    res.json({ message: 'Closure removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting closure' });
  }
});

module.exports = router;
