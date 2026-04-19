const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all staff accounts
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching users" });
  }
});

// @route   POST /api/users/register
// @desc    Create a new account with departments
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, assignedDepartments } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      assignedDepartments: assignedDepartments || [] // ✅ Save the departments array
    });

    await newUser.save();
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error creating user" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user details (including departments and password)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, role, assignedDepartments } = req.body;
    
    // 1. Find the user first
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Prepare update object
    const updateData = {
      name,
      email,
      role,
      assignedDepartments: assignedDepartments || [] // ✅ Update departments
    };

    // 3. Only hash and update password if a new one was typed
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { 
        returnDocument: 'after', // ✅ Modern syntax
        runValidators: true      // ✅ Recommended: ensures email/role logic is followed
      }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error updating user" });
  }
});

// @route   DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error deleting user" });
  }
});

module.exports = router;