const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Double check this path to your User model!

// @route   GET /api/users
// @desc    Get all staff accounts (exclude passwords from the result)
router.get('/', async (req, res) => {
  try {
    // .select('-password') ensures we don't accidentally send hashed passwords to the frontend
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error fetching users" });
  }
});

// @route   POST /api/users/register
// @desc    Create a new counselor or admin account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create and save the user
    const newUser = new User({
      name,
      email,
      password: hashedPassword, 
      role
    });

    await newUser.save();
    res.status(201).json({ message: "Account created successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error creating user" });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user account
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error deleting user" });
  }
});

module.exports = router;