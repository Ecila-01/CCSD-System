const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const SystemSettings = require('../models/SystemSettings');
const { requireAuth, requireRole } = require('../middleware/auth');

// Store uploaded backup file in memory (cap size to avoid memory-exhaustion DoS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // encrypted recovery files include media
});

const adminOnly = [requireAuth, requireRole('admin')];

// Secrets excluded from unencrypted selective exports.
const SENSITIVE_USER_FIELDS = ['password', 'resetPasswordOtp', 'resetPasswordExpires'];

// Full recovery includes hashed staff credentials and media, always encrypted.
router.post('/recovery-backup', adminOnly, async(req,res)=>{
 try {
  const {password}=req.body;
  if(typeof password!=='string'||password.length<12)return res.status(400).json({message:'Use a backup password of at least 12 characters.'});
  const recovery=require('../utils/recoveryBackup');
  const data={};
  const session=await mongoose.startSession();
  try {await session.withTransaction(async()=>{
   for(const name of mongoose.modelNames())data[name]=await mongoose.model(name).find({}).select(name==='ServiceRequest'?'+submitterEmailNormalized +submissionFingerprint':'-resetPasswordOtp -resetPasswordExpires -resetPasswordAttempts').session(session).lean();
  },{readConcern:{level:'snapshot'}});}finally{await session.endSession();}
  const assets=await recovery.captureAssets(data);
  res.json(await recovery.encrypt({system:'UB CCSD',version:1,timestamp:new Date().toISOString(),data,assets},password));
 }catch(error){console.error('Recovery backup failed:',error.message);res.status(400).json({message:error.message});}
});

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

    let backupContent = JSON.parse(req.file.buffer.toString());
    if(backupContent.format==='encrypted-recovery-v1') {
      const recovery=require('../utils/recoveryBackup');
      backupContent=await recovery.decrypt(backupContent,req.body.password);
      if(backupContent.system!=='UB CCSD'||backupContent.version!==1||!backupContent.data||!Array.isArray(backupContent.assets))throw Error('Invalid recovery backup.');
      const entries=Object.entries(backupContent.data);
      if(!entries.length||entries.some(([name,rows])=>!mongoose.modelNames().includes(name)||!Array.isArray(rows)))throw Error('Invalid recovery collections.');
      if(!backupContent.data.User?.some(u=>u.role==='admin'&&/^\$2[aby]\$/.test(u.password||'')))throw Error('The recovery backup must contain an administrator account.');
      for(const [name,rows] of entries)for(const row of rows){
       await new (mongoose.model(name))(row).validate();
       if(name==='SystemSettings'){const error=require('../utils/bookingSettings').settingsError(row);if(error)throw Error(error);}
      }
      const replacements=new Map(),uploaded=[];
      const cloudinary=require('cloudinary').v2;
      let restored=false;
      try {
       for(const asset of backupContent.assets) {
        if(typeof asset.url!=='string'||!/^https:\/\/res\.cloudinary\.com\//i.test(asset.url)||typeof asset.base64!=='string')throw Error('Invalid media asset.');
        const bytes=Buffer.from(asset.base64,'base64');if(bytes.length>10*1024*1024)throw Error('Recovery image too large.');
        const result=await new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:'ccsd_recovery',resource_type:'image'},(error,result)=>error?reject(error):resolve(result));stream.end(bytes);});
        uploaded.push(result.public_id);replacements.set(asset.url,result.secure_url);
       }
       const data=recovery.replaceUrls(backupContent.data,replacements);
       const session=await mongoose.startSession();
       try {await session.withTransaction(async()=>{for(const [name,rows] of Object.entries(data)){const Model=mongoose.model(name);await Model.deleteMany({},{session});if(rows.length)await Model.insertMany(rows,{session});}});}finally{await session.endSession();}
       restored=true;
       return res.json({message:'Full recovery restored. Sign in with an account from the backup.',fullRecovery:true});
      } finally {if(!restored)await Promise.allSettled(uploaded.map(id=>cloudinary.uploader.destroy(id)));}
    }
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
    res.status(400).json({ message: error.message || "Server error during restore." });
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
    const error = require('../utils/bookingSettings').settingsError(settings);
    if (error) return res.status(400).json({ message: error });
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
