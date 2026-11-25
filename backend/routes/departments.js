const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { requireAuth, requireRole } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('admin')];

// GET all departments (PUBLIC — the public intake form needs the list)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching departments" });
  }
});

// POST create a department (admin only)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, fullName, courses } = req.body;
    const existing = await Department.findOne({ name: String(name || '').toUpperCase() });
    if (existing) return res.status(400).json({ message: "Department already exists" });

    const newDept = new Department({ name, fullName, courses: courses || [] });
    await newDept.save();
    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ message: "Server Error creating department" });
  }
});

// PUT update a department (admin only)
router.put('/:id', adminOnly, async (req, res) => {
 const session = await Department.startSession();
 try {
  let updatedDept;
  await session.withTransaction(async () => {
   const dept = await Department.findById(req.params.id).session(session);
   if (!dept) { const e=new Error('Department not found'); e.status=404; throw e; }
   const oldName=dept.name;
   const {name,fullName,courses}=req.body;
   if(name!==undefined) dept.name=name;
   if(fullName!==undefined) dept.fullName=fullName;
   if(courses!==undefined) dept.courses=courses;
   await dept.save({session});
   if(oldName!==dept.name) {
    const match=new RegExp('^\\s*'+require('../utils/counselors').escapeRegex(oldName.trim())+'\\s*$','i');
    await require('../models/User').updateMany({assignedDepartments:match}, {$set:{'assignedDepartments.$[d]':dept.name}}, {arrayFilters:[{d:match}],session});
    await require('../models/ServiceRequest').updateMany({'requestData.department':match}, {$set:{'requestData.department':dept.name}}, {session});
    await require('../models/Notification').updateMany({department:match}, {$set:{department:dept.name}}, {session});
    const services=await require('../models/Service').find().session(session);
    for(const service of services) {
     let changed=false;
     for(const field of service.fields||[]) {
      if(field.name==='department' && field.options?.some(v=>match.test(v))) { field.options=field.options.map(v=>match.test(v)?dept.name:v); changed=true; }
      for(const key of Object.keys(field.optionsMap||{})){if(match.test(key)){field.optionsMap[dept.name]=field.optionsMap[key];if(key!==dept.name)delete field.optionsMap[key];changed=true;}}
     }
     if(changed) {service.markModified('fields');await service.save({session});}
    }
   }
   updatedDept=dept;
  });
  res.json(updatedDept);
 } catch(error) {res.status(error.code===11000?409:error.status||400).json({message:error.code===11000?'Department already exists':error.message});}
 finally {await session.endSession();}
});

// DELETE a department (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error deleting department" });
  }
});

module.exports = router;
