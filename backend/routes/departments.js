const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// @route   GET /api/departments
// @desc    Get all departments and their courses
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching departments" });
  }
});

// @route   POST /api/departments
// @desc    Create a new department
router.post('/', async (req, res) => {
  try {
    const { name, fullName, courses } = req.body;
    
    const existing = await Department.findOne({ name: name.toUpperCase() });
    if (existing) return res.status(400).json({ message: "Department already exists" });

    const newDept = new Department({ name, fullName, courses: courses || [] });
    await newDept.save();
    
    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ message: "Server Error creating department" });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update a department (e.g., Add or remove courses)
router.put('/:id', async (req, res) => {
  try {
    const { name, fullName, courses } = req.body;
    
    const updatedDept = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: { name, fullName, courses } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedDept) return res.status(404).json({ message: "Department not found" });
    res.json(updatedDept);
  } catch (error) {
    res.status(500).json({ message: "Server Error updating department" });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete a department
router.delete('/:id', async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error deleting department" });
  }
});

module.exports = router;