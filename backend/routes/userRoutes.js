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
      assignedDepartments: assignedDepartments || []
    });

    await newUser.save();
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error creating user" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user details (Handles Admin Dashboard AND Profile Page)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, newPassword, role, assignedDepartments, notificationPreferences } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updateData = {};

    // 1. Only update Identity fields if provided (for Admins)
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (assignedDepartments) updateData.assignedDepartments = assignedDepartments;

    // 1b. Notification preferences (merge so partial updates don't wipe others)
    if (notificationPreferences !== undefined) {
      updateData.notificationPreferences = {
        ...(user.notificationPreferences ? user.notificationPreferences.toObject() : {}),
        ...notificationPreferences,
      };
    }

    // 2. Handle Password (check for 'password' from admin dashboard OR 'newPassword' from profile)
    const passwordInput = newPassword || password;
    if (passwordInput && passwordInput.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(passwordInput, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    // Return the updated user object so the frontend can update LocalStorage
    res.json({
      message: "Update successful",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update error:", error);
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
