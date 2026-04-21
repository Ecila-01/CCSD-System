const mongoose = require('mongoose');
require('dotenv').config();

// Load your models
const Service = require('./models/Service');
const Announcement = require('./models/Announcement');
const AboutContent = require('./models/AboutContent');

async function migrate() {
  try {
    // 1. Connect to your Atlas Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Connected to MongoDB Atlas. Starting migration...");

    // --- Part A: Update Announcements ---
    const annDocs = await Announcement.find({ image: { $regex: 'http://localhost:5000' } });
    console.log(`Found ${annDocs.length} Announcements to fix.`);
    for (let doc of annDocs) {
      doc.image = doc.image.replace('http://localhost:5000', '');
      await doc.save();
    }

    // --- Part B: Update Services ---
    const serviceDocs = await Service.find({ image: { $regex: 'http://localhost:5000' } });
    console.log(`Found ${serviceDocs.length} Services to fix.`);
    for (let doc of serviceDocs) {
      doc.image = doc.image.replace('http://localhost:5000', '');
      await doc.save();
    }

    // --- Part C: Update AboutContent (Nested Array) ---
    const aboutDocs = await AboutContent.find({});
    console.log(`Checking AboutContent team members...`);
    for (let doc of aboutDocs) {
      let changed = false;
      if (doc.teamMembers && doc.teamMembers.length > 0) {
        doc.teamMembers.forEach(member => {
          if (member.imageUrl && member.imageUrl.includes('http://localhost:5000')) {
            member.imageUrl = member.imageUrl.replace('http://localhost:5000', '');
            changed = true;
          }
        });
      }
      if (changed) {
        doc.markModified('teamMembers'); // Crucial for nested arrays
        await doc.save();
        console.log("✅ Updated AboutContent team member paths.");
      }
    }

    console.log("🏁 Migration complete! All hardcoded localhost URLs removed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();