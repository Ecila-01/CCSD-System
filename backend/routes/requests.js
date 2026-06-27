const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { sendGuestLink, sendCounselorNotification, sendStatusUpdateToStudent, sendStatusUpdateToReferrer, sendCancellationNotification, sendRescheduleNotificationToCounselor, sendRescheduleRequestToStudent } = require('../utils/mailer');
const Service = require('../models/Service');

router.post("/", async (req, res) => {
  try {
    const newRequest = new ServiceRequest(req.body);
    const savedRequest = await newRequest.save();

    const relatedService = await Service.findById(savedRequest.serviceId);
    let serviceInfoText = null;

    if (relatedService && relatedService.fields) {
      const infoField = relatedService.fields.find(field => field.type === 'info');
      if (infoField && infoField.content) {
        serviceInfoText = infoField.content; 
      }
    }

    // --- CONCURRENT EMAIL PROCESSING ---

    const isReferral = savedRequest.serviceName.toUpperCase() === "REFERRAL";
    const recipientEmail = isReferral ? savedRequest.referrerEmail : savedRequest.studentEmail;
    const studentDept = req.body.requestData?.department; 

    // 1. Prepare the Student Email Promise (Do NOT await yet)
    const studentEmailPromise = recipientEmail 
      ? sendGuestLink(recipientEmail, savedRequest.serviceName, savedRequest.guestToken, serviceInfoText)
      : Promise.resolve(); // Do nothing if no email

    // 2. Prepare the Counselor Email Promise (Do NOT await yet)
    const counselorEmailPromise = (async () => {
      if (!studentDept) return;
      const counselors = await User.find({ assignedDepartments: studentDept, role: 'counsellor' });
      const notifications = counselors.map(c => 
        sendCounselorNotification(c.email, savedRequest.studentName, studentDept, savedRequest.serviceName)
      );
      return Promise.all(notifications);
    })(); // <-- Added the closing parenthesis here!

    // 3. Await EVERYTHING at the exact same time!
    // This forces Vercel to stay awake, but does it as fast as possible.
    // The .catch() ensures that if an email fails, it still sends the 201 Success to the user.
    await Promise.all([studentEmailPromise, counselorEmailPromise])
      .catch(err => console.error("An email failed to send, but data was saved:", err));

    // 4. Respond to Reac
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

    const update = { status, assignedCounselor };

    const historyEntry = {
      status,
      note: statusNote || `Status updated to ${status}`,
      updatedAt: new Date()
    };

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { $set: update, $push: { statusUpdates: historyEntry } },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

    // Notify student or referrer of every status change
    const isReferral = updatedRequest.serviceName?.toUpperCase() === 'REFERRAL';
    const recipientEmail = isReferral ? updatedRequest.referrerEmail : updatedRequest.studentEmail;
    if (recipientEmail) {
      if (status === 'Reschedule Requested' && !isReferral) {
        // Send a specific actionable email prompting the student to pick a new time
        sendRescheduleRequestToStudent(recipientEmail, updatedRequest.serviceName, updatedRequest.guestToken)
          .catch(err => console.error('Reschedule request email failed:', err));
      } else {
        const emailFn = isReferral ? sendStatusUpdateToReferrer : sendStatusUpdateToStudent;
        const nameArg  = isReferral ? updatedRequest.studentName : updatedRequest.serviceName;
        emailFn(recipientEmail, nameArg, status, updatedRequest.guestToken)
          .catch(err => console.error('Status update email failed:', err));
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error updating status" });
  }
});

// Student cancelling their own appointment via Guest Token
router.patch('/guest/cancel/:token', async (req, res) => {
  try {
    const { reason } = req.body;

    const historyEntry = {
      status: 'Cancelled',
      note: reason ? `Client cancelled: ${reason}` : 'Client cancelled the appointment.',
      updatedAt: new Date()
    };

    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { guestToken: req.params.token },
      {
        $set: { status: 'Cancelled' },
        $push: { statusUpdates: historyEntry }
      },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

    // Notify the assigned counselor if there is one
    if (updatedRequest.assignedCounselor && updatedRequest.assignedCounselor !== 'Unassigned') {
      const counselor = await User.findOne({ name: updatedRequest.assignedCounselor });
      if (counselor?.email) {
        sendCancellationNotification(
          counselor.email,
          updatedRequest.studentName,
          updatedRequest.serviceName,
          reason
        ).catch(err => console.error("Cancellation email failed:", err));
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error cancelling appointment" });
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

    // Notify the assigned counsellor that the student has proposed a new schedule
    if (updatedRequest.assignedCounselor && updatedRequest.assignedCounselor !== 'Unassigned') {
      const counselor = await User.findOne({ name: updatedRequest.assignedCounselor });
      if (counselor?.email) {
        sendRescheduleNotificationToCounselor(
          counselor.email,
          updatedRequest.studentName,
          updatedRequest.serviceName,
          appointmentDate,
          timeSlot
        ).catch(err => console.error('Reschedule notification email failed:', err));
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error rescheduling" });
  }
});
module.exports = router;