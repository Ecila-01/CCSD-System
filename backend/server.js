const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const serviceRoutes = require('./routes/serviceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON data from requests

//Routes
app.use('/api/services', serviceRoutes);

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