const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const upload = require('./middleware/upload');
const { requireAuth, requireRole } = require('./middleware/auth');
const { securityHeaders, sanitizeBody, rateLimit } = require('./middleware/security');
const serviceRoutes = require('./routes/serviceRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requests');
const announcementRoutes = require('./routes/announcements');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departments');
const aboutRoutes = require('./routes/aboutRoutes');
const systemRoutes = require('./routes/system');
const careerRoutes = require('./routes/career');
const notificationRoutes = require('./routes/notifications');
const closureRoutes = require('./routes/closures');
const cron = require('node-cron');
const ServiceRequest = require('./models/ServiceRequest');
const { sendAppointmentReminder } = require('./utils/mailer');
const app = express();
const PORT = process.env.PORT || 5000;

// Behind a hosting proxy (Render/Vercel/etc.) so req.ip reflects the real client
app.set('trust proxy', 1);
// Don't advertise Express in response headers
app.disable('x-powered-by');

// ── Security middleware ──
app.use(securityHeaders);
// Allowed frontend origins. For deployment, set CORS_ORIGINS as a
// comma-separated list (e.g. "https://ccsd.university.edu"). Falls back to
// local/dev origins when unset.
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : ["http://localhost:5173", "https://ub-ccsd.vercel.app"];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json({ limit: '100kb' })); // cap JSON body size (basic DoS guard)
app.use(sanitizeBody);                      // strip NoSQL operators from bodies/params

// Throttle authentication endpoints (brute-force / OTP guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

// ==========================================
// Cloudinary Upload (staff only)
// ==========================================
app.post('/api/upload', requireAuth, requireRole('admin'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ imageUrl: req.file.path });
});

// ==========================================
// APP ROUTES
// (Access control is enforced INSIDE each router: public/guest routes stay
//  open; staff/admin actions are guarded with requireAuth / requireRole.)
// ==========================================
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/closures', closureRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected: CCSD-Cluster is live!");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

// ── APPOINTMENT REMINDER CRON JOB ──
// Runs every 15 minutes; finds appointments 60-75 min away not yet reminded.
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 75 * 60 * 1000);

    // appointmentDate is a Manila (UTC+8) wall-clock date, so derive the
    // candidate day strings in that timezone regardless of the server's TZ.
    const manilaDate = (d) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d);
    const todayStr    = manilaDate(now);
    const tomorrowStr = manilaDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));

    const candidates = await ServiceRequest.find({
      requiresSchedule: true,
      reminderSent: false,
      status: { $in: ['Pending Review', 'In-Progress'] },
      appointmentDate: { $in: [todayStr, tomorrowStr] },
      studentEmail: { $exists: true, $ne: '' }
    });

    for (const req of candidates) {
      const [hour, min] = (req.timeSlot || '').split(':').map(Number);
      if (isNaN(hour) || isNaN(min)) continue;

      // Interpret the stored wall-clock date+time as Manila local (+08:00) so the
      // comparison holds even when the server runs in UTC (e.g. Render).
      const apptTime = new Date(req.appointmentDate + 'T' + String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':00+08:00');
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

// Global error handler — never leak internal error details in production.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage = (!isProd || status < 500)
    ? (err.message || 'Error')
    : 'Internal server error';
  res.status(status).json({ message: safeMessage });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
