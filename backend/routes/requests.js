const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User'); // Import your User model
const {sendGuestLink, sendCounselorNotification, sendStatusUpdateToStudent, sendStatusUpdateToReferrer } = require('../utils/mailer');

router.post("/", async (req, res) => {
  try {
    const newRequest = new ServiceRequest(req.body);
    const savedRequest = await newRequest.save();

    // 1. Notify Student/Referrer
    const isReferral = savedRequest.serviceName.toUpperCase() === "REFERRAL";
    const recipientEmail = isReferral ? savedRequest.referrerEmail : savedRequest.studentEmail;

    if (recipientEmail) {
      await sendGuestLink(recipientEmail, savedRequest.serviceName, savedRequest.guestToken);
    }

    // 2. Notify Assigned Counselors
    const studentDept = req.body.requestData.department; 
    if (studentDept) {
      const counselors = await User.find({ 
        assignedDepartments: studentDept, 
        role: 'counsellor' 
      });

      const notifications = counselors.map(c => 
        sendCounselorNotification(c.email, savedRequest.studentName, studentDept, savedRequest.serviceName, "New Request")
      );
      await Promise.all(notifications);
    }

    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/guest/:token", async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({ guestToken: req.params.token });
    
    if (!request) {
      return res.status(404).json({ message: "Invalid or expired link." });
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
    const { status, assignedCounselor } = req.body;
    
    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id, 
      { status, assignedCounselor },
      { returnDocument: 'after' }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

    // ✅ Pass the guestToken into the mailer functions
    if (updatedRequest.serviceName.toUpperCase() === "REFERRAL") {
      if (updatedRequest.referrerEmail) {
        await sendStatusUpdateToReferrer(
          updatedRequest.referrerEmail, 
          updatedRequest.studentName, 
          status,
          updatedRequest.guestToken // 👈 Pass the token here
        );
      }
    } else {
      if (updatedRequest.studentEmail) {
        await sendStatusUpdateToStudent(
          updatedRequest.studentEmail, 
          updatedRequest.serviceName, 
          status,
          updatedRequest.guestToken // 👈 Pass the token here
        );
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Student updating their own request via Guest Token
router.patch("/guest-update/:token", async (req, res) => {
  try {
    const { action, appointmentDate, timeSlot } = req.body; // action: "Reschedule" or "Cancel"
    
    const request = await ServiceRequest.findOne({ guestToken: req.params.token });
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Update the request
    if (action === "Cancel") {
      request.status = "Cancelled";
    } else if (action === "Reschedule") {
      request.appointmentDate = appointmentDate;
      request.timeSlot = timeSlot;
      request.status = "Pending"; // Reset to pending for review
    }
    
    await request.save();

    // Notify Counselors of the CHANGE
    const studentDept = request.requestData.department;
    if (studentDept) {
      const counselors = await User.find({ assignedDepartments: studentDept });
      const updates = counselors.map(c => 
        sendCounselorNotification(c.email, request.studentName, studentDept, request.serviceName, `Student ${action}`)
      );
      await Promise.all(updates);
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});
module.exports = router;