const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const SystemSettings = require('../models/SystemSettings');
const { requireAuth, requireRole } = require('../middleware/auth');

// Store uploaded backup file in memory (cap size to avoid memory-exhaustion DoS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

const adminOnly = [requireAuth, requireRole('admin')];

// Fields that must never be included in a backup export.
const SENSITIVE_USER_FIELDS = ['password', 'resetPasswordOtp', 'resetPasswordExpires'];

// 1. SELECTIVE SYSTEM BACKUP  (admin only)
router.post('/backup', adminOnly, async (req, res) => {
  try {
    const { modelsToBackup } = req.body;

    if (!modelsToBackup || !Array.isArray(modelsToBackup) || modelsToBackup.length === 0) {
      return res.status(400).json({ message: "No models provided for backup." });
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      system: "UB CCSD",
      data: {}
    };

    for (const modelName of modelsToBackup) {
      if (mongoose.modelNames().includes(modelName)) {
        const Model = mongoose.model(modelName);
        // Never export credential/secret fields (they live on the User model).
        const projection = SENSITIVE_USER_FIELDS.map(f => '-' + f).join(' ');
        backupData.data[modelName] = await Model.find({}).select(projection);
      }
    }

    res.status(200).json(backupData);
  } catch (error) {
    console.error("Backup generation failed:", error);
    res.status(500).json({ message: "Server error during backup." });
  }
});

// 2. SYSTEM RESTORE  (admin only)
router.post('/restore', adminOnly, upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No backup file uploaded." });

    const backupContent = JSON.parse(req.file.buffer.toString());
    if (backupContent.system !== "UB CCSD" || !backupContent.data) {
      return res.status(400).json({ message: "Invalid backup file format." });
    }

    const models = Object.keys(backupContent.data);

    // HARD LOCK: never restore the User collection.
    const safeModelsToRestore = models.filter(modelName => modelName !== 'User');

    for (const modelName of safeModelsToRestore) {
      if (mongoose.modelNames().includes(modelName)) {
        const Model = mongoose.model(modelName);
        const dataToInsert = backupContent.data[modelName];

        await Model.deleteMany({});
        if (dataToInsert.length > 0) {
          await Model.insertMany(dataToInsert);
        }
      }
    }

    res.status(200).json({ message: "System restored successfully. User data was safely ignored." });
  } catch (error) {
    console.error("Restore failed:", error);
    res.status(500).json({ message: "Server error during restore." });
  }
});

// 3. SELECTIVE WIPE DATABASE  (admin only)
router.post('/wipe', adminOnly, async (req, res) => {
  try {
    const { modelsToWipe } = req.body;

    if (!modelsToWipe || !Array.isArray(modelsToWipe) || modelsToWipe.length === 0) {
      return res.status(400).json({ message: "No models provided for wiping." });
    }

    // HARD LOCK: never wipe the User collection.
    const safeModelsToWipe = modelsToWipe.filter(modelName => modelName !== 'User');

    for (const modelName of safeModelsToWipe) {
      if (mongoose.modelNames().includes(modelName)) {
        await mongoose.model(modelName).deleteMany({});
      }
    }

    res.status(200).json({ message: "Selected records wiped successfully. Users were kept safe." });
  } catch (error) {
    console.error("Wipe failed:", error);
    res.status(500).json({ message: "Failed to wipe database." });
  }
});

// GET system settings  (PUBLIC — the booking calendar needs business hours/closures config)
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await new SystemSettings().save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update system settings  (admin only)
router.put('/settings', adminOnly, async (req, res) => {
  try {
    const {
      businessHoursStart, businessHoursEnd, slotIntervalMinutes, workingDays,
      submissionLimitEnabled, maxActivePerService
    } = req.body;
    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings();
    if (businessHoursStart !== undefined) settings.businessHoursStart = Number(businessHoursStart);
    if (businessHoursEnd   !== undefined) settings.businessHoursEnd   = Number(businessHoursEnd);
    if (slotIntervalMinutes !== undefined) settings.slotIntervalMinutes = Number(slotIntervalMinutes);
    if (workingDays !== undefined) settings.workingDays = workingDays;
    if (submissionLimitEnabled !== undefined) settings.submissionLimitEnabled = Boolean(submissionLimitEnabled);
    if (maxActivePerService !== undefined) settings.maxActivePerService = Math.max(1, Number(maxActivePerService) || 1);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
