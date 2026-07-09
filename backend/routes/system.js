const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const SystemSettings = require('../models/SystemSettings');

// Store uploaded backup file in memory
const upload = multer({ storage: multer.memoryStorage() });

// 1. SELECTIVE SYSTEM BACKUP
// Changed to POST to accept an array of models from the frontend checklist
router.post('/backup', async (req, res) => {
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

    // Loop ONLY through the models the user checked on the frontend
    for (const modelName of modelsToBackup) {
      // Safety check: Ensure the requested model actually exists in the database
      if (mongoose.modelNames().includes(modelName)) {
        const Model = mongoose.model(modelName);
        backupData.data[modelName] = await Model.find({});
      }
    }

    res.status(200).json(backupData);
  } catch (error) {
    console.error("Backup generation failed:", error);
    res.status(500).json({ message: "Server error during backup." });
  }
});

// 2. SYSTEM RESTORE
// Reads the uploaded JSON file and restores whatever collections are inside it
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No backup file uploaded." });

    const backupContent = JSON.parse(req.file.buffer.toString());
    if (backupContent.system !== "UB CCSD" || !backupContent.data) {
      return res.status(400).json({ message: "Invalid backup file format." });
    }

    const models = Object.keys(backupContent.data);

    // 🔥 THE HARD LOCK: Filter out the 'User' model so it is NEVER restored
    const safeModelsToRestore = models.filter(modelName => modelName !== 'User');

    for (const modelName of safeModelsToRestore) {
      if (mongoose.modelNames().includes(modelName)) {
        const Model = mongoose.model(modelName);
        const dataToInsert = backupContent.data[modelName];

        await Model.deleteMany({}); // Wipe current collection
        if (dataToInsert.length > 0) {
          await Model.insertMany(dataToInsert); // Insert backup records
        }
      }
    }

    res.status(200).json({ message: "System restored successfully. User data was safely ignored." });
  } catch (error) {
    console.error("Restore failed:", error);
    res.status(500).json({ message: "Server error during restore." });
  }
});

// 3. SELECTIVE WIPE DATABASE
// Changed to POST to accept an array of models from the frontend checklist
router.post('/wipe', async (req, res) => {
  try {
    const { modelsToWipe } = req.body;

    if (!modelsToWipe || !Array.isArray(modelsToWipe) || modelsToWipe.length === 0) {
      return res.status(400).json({ message: "No models provided for wiping." });
    }

    // 🔥 THE HARD LOCK: Filter out the 'User' model so it is NEVER wiped
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

// GET system settings (returns singleton, creates default if none exists)
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await new SystemSettings().save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update system settings
router.put('/settings', async (req, res) => {
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
