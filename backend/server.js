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
const cron = require('node-cron');
const ServiceRequest = require('./models/ServiceRequest');
const { sendAppointmentReminder } = require('./utils/mailer');
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

// ── APPOINTMENT REMINDER CRON JOB ──
// Runs every 15 minutes; finds appointments 60–75 min away that haven't been reminded yet
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000);  // 60 min from now
    const windowEnd   = new Date(now.getTime() + 75 * 60 * 1000);  // 75 min from now

    // Appointments store date as "YYYY-MM-DD" and time as "HH:MM"
    // Build date strings for today/tomorrow to limit the search scope
    const todayStr    = now.toISOString().slice(0, 10);
    const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const candidates = await ServiceRequest.find({
      requiresSchedule: true,
      reminderSent: false,
      status: { $in: ['Pending Review', 'In-Progress'] },
      appointmentDate: { $in: [todayStr, tomorrowStr] },
      studentEmail: { $exists: true, $ne: '' }
    });

    for (const req of candidates) {
      // Parse "HH:MM" into today's datetime
      const [hour, min] = (req.timeSlot || '').split(':').map(Number);
      if (isNaN(hour) || isNaN(min)) continue;

      const apptTime = new Date(req.appointmentDate + 'T' + String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':00');
      if (apptTime >= windowStart && apptTime <= windowEnd) {
        try {
          await sendAppointmentReminder(
            req.studentEmail,
            req.studentName,
            req.serviceName,
            req.appointmentDate,
            req.timeSlot
          );
          req.reminderSent = true;
          await req.save();
          console.log(`Reminder sent to ${req.studentEmail} for ${req.serviceName}`);
        } catch (mailErr) {
          console.error(`Reminder failed for ${req._id}:`, mailErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Reminder cron error:', err.message);
  }
});

// Basic Test Route
app.get('/', (req, res) => {
  res.send("CCSD Backend API is running...");
});

// Global error handler — catches errors from middleware (e.g. multer/Cloudinary failures)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});