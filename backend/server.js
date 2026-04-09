const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const serviceRoutes = require('./routes/serviceRoutes');
const authRoutes = require('./routes/authRoutes');
const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');
const requestRoutes = require('./routes/requests');
const announcementRoutes = require('./routes/announcements')

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON data from requests

//Routes
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  setHeaders: (res) => {
    // This tells the browser: "Yes, it is safe for React to read these image pixels"
    res.set('Access-Control-Allow-Origin', '*'); 
  }
}));
app.use('/api/requests', requestRoutes);
app.use('/api/announcements', announcementRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    // Note: process.env.MONGO_URI must match the variable name in your .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 MongoDB Connected: CCSD-Cluster is live!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Basic Test Route
app.get('/', (req, res) => {
  res.send("CCSD Backend API is running...");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});