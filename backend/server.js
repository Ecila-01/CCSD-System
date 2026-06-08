const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const upload = require('./middleware/upload'); 
const serviceRoutes = require('./routes/serviceRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requests');
const announcementRoutes = require('./routes/announcements');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departments');
const aboutRoutes = require('./routes/aboutRoutes');
const systemRoutes = require('./routes/system');
const careerRoutes = require('./routes/career');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",       // ✅ Allows your local testing
        "https://ub-ccsd.vercel.app"   // ✅ Allows your live Vercel site
    ],
    credentials: true
}));
app.use(express.json());

// ==========================================
// NEW ROUTE: Cloudinary Upload
// ==========================================
// ✅ CORRECT (The Cloudinary Way)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Just send back the raw Cloudinary link!
  res.status(200).json({ imageUrl: req.file.path });
});

// ==========================================
// APP ROUTES
// ==========================================
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/careers', careerRoutes);
// Note: I removed the app.use('/uploads', express.static(...)) block.
// You no longer need it because Cloudinary hosts your images now!

// MongoDB Connection
const connectDB = async () => {
  try {
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