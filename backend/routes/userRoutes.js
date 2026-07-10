const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

// @route   GET /api/users   (admin only — staff directory)
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordOtp -resetPasswordExpires');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching users" });
  }
});

// @route   POST /api/users/register   (admin only — create staff account)
router.post('/register', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, assignedDepartments } = req.body;

    const existingUser = await User.findOne({ email: String(email || '').toLowerCase() });
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
// Admins may edit anyone. A non-admin may edit ONLY their own account, and
// may NOT change privilege-relevant fields (role, assignedDepartments).
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isSelf = String(req.user.id) === String(req.params.id);
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Forbidden: you can only edit your own account" });
    }

    const { name, email, password, newPassword, role, assignedDepartments, notificationPreferences } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updateData = {};

    // Identity fields
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Privilege-relevant fields — ADMIN ONLY (blocks self-escalation)
    if (isAdmin) {
      if (role) updateData.role = role;
      if (assignedDepartments) updateData.assignedDepartments = assignedDepartments;
    }

    // Notification preferences (merge so partial updates don't wipe others)
    if (notificationPreferences !== undefined) {
      updateData.notificationPreferences = {
        ...(user.notificationPreferences ? user.notificationPreferences.toObject() : {}),
        ...notificationPreferences,
      };
    }

    // Password (admin dashboard sends 'password'; profile page sends 'newPassword')
    const passwordInput = newPassword || password;
    if (passwordInput && String(passwordInput).trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(passwordInput, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordOtp -resetPasswordExpires');

    res.json({
      message: "Update successful",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server Error updating user" });
  }
});

// @route   DELETE /api/users/:id   (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error deleting user" });
  }
});

module.exports = router;
