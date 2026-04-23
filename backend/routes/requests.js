const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User'); // Import your User model
const {sendGuestLink, sendCounselorNotification, sendStatusUpdateToStudent, sendStatusUpdateToReferrer } = require('../utils/mailer');
const Service = require('../models/Service');

router.post("/", async (req, res) => {
  try {
    const newRequest = new ServiceRequest(req.body);
    const savedRequest = await newRequest.save();

    // ✅ 1. Fetch the related Service template (Keep this awaited, we need this fast)
    const relatedService = await Service.findById(savedRequest.serviceId);
    let serviceInfoText = null;

    // ✅ 2. Search the 'fields' array for the info block
    if (relatedService && relatedService.fields) {
      const infoField = relatedService.fields.find(field => field.type === 'info');
      if (infoField && infoField.content) {
        serviceInfoText = infoField.content; 
      }
    }

    // --- BACKGROUND TASKS START HERE ---

    // 3. Notify Student/Referrer (Fire & Forget)
    const isReferral = savedRequest.serviceName.toUpperCase() === "REFERRAL";
    const recipientEmail = isReferral ? savedRequest.referrerEmail : savedRequest.studentEmail;

    if (recipientEmail) {
      // 🚨 REMOVED AWAIT: Let this run in the background
      sendGuestLink(recipientEmail, savedRequest.serviceName, savedRequest.guestToken, serviceInfoText)
        .catch(err => console.error("Failed to send guest link email:", err));
    }

    // 4. Notify Assigned Counselors (Fire & Forget)
    const studentDept = req.body.requestData?.department; 
    if (studentDept) {
      // Keep this awaited because we need to query the DB fast
      const counselors = await User.find({ 
        assignedDepartments: studentDept, 
        role: 'counsellor' 
      });

      // 🚨 REMOVED AWAIT: Process all counselor emails in the background
      Promise.all(counselors.map(c => 
        sendCounselorNotification(c.email, savedRequest.studentName, studentDept, savedRequest.serviceName)
      )).catch(err => console.error("Failed to send counselor notifications:", err));
    }

    // ✅ 5. Respond immediately! The frontend will now see success in milliseconds.
    res.status(201).json(savedRequest);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/guest/:token', async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({ guestToken: req.params.token });
    if (!request) return res.status(404).json({ message: "Invalid tracking link" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching guest request" });
  }
});

// GET: Fetch requests for the Admin Dashboard
router.get('/', async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// PATCH: Update Status (Accept/Decline/Reschedule)
router.patch('/:id', async (req, res) => {
  try {
    const { status, assignedCounselor, statusNote } = req.body;

    // Build the update object
    const update = {
      status,
      assignedCounselor
    };

    // Prepare the history entry
    const historyEntry = {
      status,
      note: statusNote || `Status updated to ${status}`,
      updatedAt: new Date()
    };

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { 
        $set: update, 
        $push: { statusUpdates: historyEntry } // ✅ Push the new note to history
      },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });
    
    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error updating status" });
  }
});

// Student updating their own request via Guest Token
router.patch('/guest/reschedule/:token', async (req, res) => {
  try {
    const { appointmentDate, timeSlot, statusNote } = req.body;

    const historyEntry = {
      status: "Pending Review",
      note: statusNote || "Student updated the preferred schedule.",
      updatedAt: new Date()
    };

    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { guestToken: req.params.token },
      { 
        $set: { 
          appointmentDate, 
          timeSlot, 
          status: "Pending Review" // ✅ Reverts to Pending for counselor to see
        },
        $push: { statusUpdates: historyEntry }
      },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error rescheduling" });
  }
});
module.exports = router;