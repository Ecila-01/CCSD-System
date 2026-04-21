const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const multer = require('multer'); // Brought this to the top

// Route Imports
const serviceRoutes = require('./routes/serviceRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requests');
const announcementRoutes = require('./routes/announcements')
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departments');
const aboutRoutes = require('./routes/aboutRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON data from requests

// ==========================================
// YOUR EXISTING MULTER CONFIGURATION
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Saves inside your public folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ==========================================
// NEW ROUTE: specifically for uploading images
// ==========================================
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // This constructs the URL using your static uploads route
  const imageUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

// ==========================================
// APP ROUTES
// ==========================================
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);

// Your existing static folder setup
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  setHeaders: (res) => {
    // This tells the browser: "Yes, it is safe for React to read these image pixels"
    res.set('Access-Control-Allow-Origin', '*'); 
  }
}));

app.use('/api/requests', requestRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/about', aboutRoutes);

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

// Exporting upload just in case your other route files are requiring it from here!
module.exports = upload;