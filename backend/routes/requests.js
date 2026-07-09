const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');
const { escapeRegex, findCounselorsForDepartment } = require('../utils/counselors');
const { sendGuestLink, sendCounselorNotification, sendStatusUpdateToStudent, sendStatusUpdateToReferrer, sendCancellationNotification, sendRescheduleNotificationToCounselor, sendRescheduleRequestToStudent } = require('../utils/mailer');
const Service = require('../models/Service');

// Statuses that count as "finished" — a request in one of these no longer
// occupies a slot and no longer counts against the per-service submission limit.
const TERMINAL_STATUSES = ['Declined', 'Cancelled', 'No-Show', 'Resolved', 'Completed'];
// The inverse: statuses that are still "live".
const ACTIVE_STATUSES = [
  'Pending Review', 'In-Progress', 'Processing', 'Action Required',
  'Reschedule Requested', 'Ready for Pickup', 'Follow-up Needed'
];

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const isReferral = (body.serviceName || '').toUpperCase() === "REFERRAL";
    const submitterEmail = isReferral ? body.referrerEmail : body.studentEmail;
    const studentDept = body.requestData?.department;

    // --- DUPLICATE SUBMISSION GUARD -------------------------------------
    // Students have no accounts, so we key the limit on their email + service.
    // For scheduled services the limit applies per appointment DAY, so a
    // student can't spam 8:00, 8:30, 9:00 … for the same service on one day.
    if (!isReferral && submitterEmail && body.serviceId) {
      const settings = await SystemSettings.findOne();
      const limitEnabled = settings ? settings.submissionLimitEnabled !== false : true;
      const maxActive = settings && settings.maxActivePerService ? settings.maxActivePerService : 1;

      if (limitEnabled) {
        const dupQuery = {
          serviceId: body.serviceId,
          studentEmail: { $regex: `^\\s*${escapeRegex(String(submitterEmail).trim())}\\s*$`, $options: 'i' },
          status: { $nin: TERMINAL_STATUSES },
        };
        if (body.requiresSchedule && body.appointmentDate) {
          dupQuery.appointmentDate = body.appointmentDate;
        }

        const activeCount = await ServiceRequest.countDocuments(dupQuery);
        if (activeCount >= maxActive) {
          const existing = await ServiceRequest.findOne(dupQuery).sort({ createdAt: -1 });
          const whenTxt = existing && existing.appointmentDate
            ? ` on ${existing.appointmentDate}${existing.timeSlot ? ' at ' + existing.timeSlot : ''}`
            : '';
          return res.status(409).json({
            code: 'DUPLICATE_ACTIVE_REQUEST',
            message: `You already have an active request for this service${whenTxt}` +
              `${existing ? ` (current status: ${existing.status})` : ''}. ` +
              `Please wait until it is completed or cancelled before submitting another.`,
          });
        }
      }
    }

    const newRequest = new ServiceRequest(body);
    const savedRequest = await newRequest.save();

    const relatedService = await Service.findById(savedRequest.serviceId);
    let serviceInfoText = null;

    if (relatedService && relatedService.fields) {
      const infoField = relatedService.fields.find(field => field.type === 'info');
      if (infoField && infoField.content) {
        serviceInfoText = infoField.content;
      }
    }

    // --- CONCURRENT EMAIL / NOTIFICATION PROCESSING ---

    const recipientEmail = submitterEmail;

    // 1. Prepare the Student Email Promise (Do NOT await yet)
    const studentEmailPromise = recipientEmail
      ? sendGuestLink(recipientEmail, savedRequest.serviceName, savedRequest.guestToken, serviceInfoText)
      : Promise.resolve(); // Do nothing if no email

    // 2. Prepare the Counsellor Notification Promise (Do NOT await yet)
    const counselorNotifyPromise = (async () => {
      if (!studentDept) return;

      // Case/whitespace-insensitive match so EVERY counsellor covering the
      // department is reached — not just an exact-string match.
      const counselors = await findCounselorsForDepartment(studentDept);
      if (counselors.length === 0) return;

      // In-app notifications for everyone (always on, ignores email opt-out).
      await Notification.insertMany(counselors.map(c => ({
        recipientId: c._id,
        type: 'new_submission',
        title: `New ${savedRequest.serviceName} request`,
        message: `${savedRequest.studentName} submitted a request for ${studentDept}.`,
        relatedRequestId: savedRequest._id,
        department: studentDept,
      })));

      // Emails only to counsellors who have explicitly opted IN.
      // A missing/undefined preference means opted out (email off by default).
      const emailTargets = counselors.filter(c =>
        c.notificationPreferences && c.notificationPreferences.newSubmissionEmails === true
      );
      await Promise.all(emailTargets.map(c =>
        sendCounselorNotification(c.email, savedRequest.studentName, studentDept, savedRequest.serviceName)
      ));
    })();

    // 3. Await EVERYTHING at the exact same time.
    // The .catch() ensures that if a side-effect fails, we still send 201.
    await Promise.all([studentEmailPromise, counselorNotifyPromise])
      .catch(err => console.error("A post-submit side-effect failed, but data was saved:", err));

    // 4. Respond to React
    res.status(201).json(savedRequest);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET: Slot conflicts — other active requests already at a given date + time.
// Declared before '/guest/:token' and '/' param routes to avoid shadowing.
router.get('/slot-conflicts', async (req, res) => {
  try {
    const { date, time, excludeId } = req.query;
    if (!date || !time) return res.json([]);

    const query = {
      appointmentDate: date,
      timeSlot: time,
      status: { $in: ACTIVE_STATUSES },
    };
    if (excludeId) query._id = { $ne: excludeId };

    const conflicts = await ServiceRequest.find(query)
      .select('studentName serviceName status assignedCounselor appointmentDate timeSlot')
      .sort({ createdAt: 1 });
    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ message: "Server Error checking slot conflicts" });
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

    // Notify the assigned counsellor (in-app + email) if there is one
    if (updatedRequest.assignedCounselor && updatedRequest.assignedCounselor !== 'Unassigned') {
      const counselor = await User.findOne({ name: updatedRequest.assignedCounselor });
      if (counselor) {
        Notification.create({
          recipientId: counselor._id,
          type: 'cancellation',
          title: 'Appointment cancelled',
          message: `${updatedRequest.studentName} cancelled their ${updatedRequest.serviceName}.`,
          relatedRequestId: updatedRequest._id,
        }).catch(err => console.error('Cancellation notification failed:', err));

        if (counselor.email) {
          sendCancellationNotification(
            counselor.email,
            updatedRequest.studentName,
            updatedRequest.serviceName,
            reason
          ).catch(err => console.error("Cancellation email failed:", err));
        }
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
      if (counselor) {
        Notification.create({
          recipientId: counselor._id,
          type: 'reschedule',
          title: 'Schedule change proposed',
          message: `${updatedRequest.studentName} proposed a new time for ${updatedRequest.serviceName}: ${appointmentDate} ${timeSlot}.`,
          relatedRequestId: updatedRequest._id,
        }).catch(err => console.error('Reschedule notification failed:', err));

        if (counselor.email) {
          sendRescheduleNotificationToCounselor(
            counselor.email,
            updatedRequest.studentName,
            updatedRequest.serviceName,
            appointmentDate,
            timeSlot
          ).catch(err => console.error('Reschedule notification email failed:', err));
        }
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error rescheduling" });
  }
});
module.exports = router;
