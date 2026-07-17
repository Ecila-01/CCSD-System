const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');
const { escapeRegex, findCounselorsForDepartment } = require('../utils/counselors');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');
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

// Throttle anonymous public submissions (spam / abuse guard).
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many submissions from this connection. Please wait a minute and try again.',
});

// PUBLIC: student/faculty submit the intake form.
router.post("/", submitLimiter, async (req, res) => {
  try {
    const body = req.body;
    const isReferral = (body.serviceName || '').toUpperCase() === "REFERRAL";
    const submitterEmail = isReferral ? body.referrerEmail : body.studentEmail;
    const studentDept = body.requestData?.department;

    // --- DUPLICATE SUBMISSION GUARD -------------------------------------
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

    // --- MASS-ASSIGNMENT GUARD ------------------------------------------
    // Only accept fields a submitter is allowed to set. Protected fields
    // (status, assignedCounselor, guestToken, reminderSent, statusUpdates)
    // are set by the schema defaults / staff actions, NEVER by the client.
    const newRequest = new ServiceRequest({
      serviceId: body.serviceId,
      serviceName: body.serviceName,
      studentName: body.studentName,
      studentEmail: body.studentEmail,
      studentIdNumber: body.studentIdNumber,
      referrerName: body.referrerName,
      referrerEmail: body.referrerEmail,
      requiresSchedule: body.requiresSchedule,
      appointmentDate: body.appointmentDate,
      timeSlot: body.timeSlot,
      requestData: body.requestData,
    });
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

    const studentEmailPromise = recipientEmail
      ? sendGuestLink(recipientEmail, savedRequest.serviceName, savedRequest.guestToken, serviceInfoText)
      : Promise.resolve();

    const counselorNotifyPromise = (async () => {
      if (!studentDept) return;

      const counselors = await findCounselorsForDepartment(studentDept);
      if (counselors.length === 0) return;

      await Notification.insertMany(counselors.map(c => ({
        recipientId: c._id,
        type: 'new_submission',
        title: `New ${savedRequest.serviceName} request`,
        message: `${savedRequest.studentName} submitted a request for ${studentDept}.`,
        relatedRequestId: savedRequest._id,
        department: studentDept,
      })));

      const emailTargets = counselors.filter(c =>
        c.notificationPreferences && c.notificationPreferences.newSubmissionEmails === true
      );
      await Promise.all(emailTargets.map(c =>
        sendCounselorNotification(c.email, savedRequest.studentName, studentDept, savedRequest.serviceName)
      ));
    })();

    await Promise.all([studentEmailPromise, counselorNotifyPromise])
      .catch(err => console.error("A post-submit side-effect failed, but data was saved:", err));

    res.status(201).json(savedRequest);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// STAFF: Slot conflicts — other active requests already at a given date + time.
router.get('/slot-conflicts', requireAuth, async (req, res) => {
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

// PUBLIC (guest token): a student tracks their own request.
router.get('/guest/:token', async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({ guestToken: String(req.params.token) });
    if (!request) return res.status(404).json({ message: "Invalid tracking link" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching guest request" });
  }
});

// STAFF: Fetch all requests for the Admin Dashboard.
router.get('/', requireAuth, async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// STAFF: Update Status (Accept/Decline/Reschedule).
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status, assignedCounselor, statusNote } = req.body;

    const update = { status, assignedCounselor };

    const actor = await User.findById(req.user.id).select('name role');
    const historyEntry = {
      status,
      note: statusNote || `Status updated to ${status}`,
      updatedAt: new Date(),
      updatedBy: actor ? `${actor.name} (${actor.role})` : 'Staff'
    };

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { $set: update, $push: { statusUpdates: historyEntry } },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

    const isReferral = updatedRequest.serviceName?.toUpperCase() === 'REFERRAL';
    const recipientEmail = isReferral ? updatedRequest.referrerEmail : updatedRequest.studentEmail;
    if (recipientEmail) {
      if (status === 'Reschedule Requested' && !isReferral) {
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

// STAFF: add a free-form case note (append-only case journal).
router.post('/:id/notes', requireAuth, async (req, res) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Note text is required.' });


    const actor = await User.findById(req.user.id).select('name role');
    const note = {
      text,
      author: actor ? `${actor.name} (${actor.role})` : 'Staff',
      authorId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { $push: { caseNotes: note } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });
    res.status(201).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error adding note' });
  }
});

// PUBLIC (guest token): student cancels their own appointment.
router.patch('/guest/cancel/:token', async (req, res) => {
  try {
    const { reason } = req.body;

    const historyEntry = {
      status: 'Cancelled',
      note: reason ? `Client cancelled: ${reason}` : 'Client cancelled the appointment.',
      updatedAt: new Date()
    };

    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { guestToken: String(req.params.token) },
      {
        $set: { status: 'Cancelled' },
        $push: { statusUpdates: historyEntry }
      },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

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
    } else {
      const dept = updatedRequest.requestData?.department;
      const deptCounselors = await findCounselorsForDepartment(dept);
      if (deptCounselors.length > 0) {
        await Notification.insertMany(deptCounselors.map(c => ({
          recipientId: c._id,
          type: 'cancellation',
          title: 'Request cancelled',
          message: `${updatedRequest.studentName} cancelled their ${updatedRequest.serviceName}${dept ? ' (' + dept + ')' : ''}.`,
          relatedRequestId: updatedRequest._id,
          department: dept,
        }))).catch(err => console.error('Dept cancellation notification failed:', err));
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error cancelling appointment" });
  }
});

// PUBLIC (guest token): student proposes a new schedule for their request.
router.patch('/guest/reschedule/:token', async (req, res) => {
  try {
    const { appointmentDate, timeSlot, statusNote } = req.body;

    const historyEntry = {
      status: "Pending Review",
      note: statusNote || "Student updated the preferred schedule.",
      updatedAt: new Date()
    };

    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { guestToken: String(req.params.token) },
      {
        $set: {
          appointmentDate,
          timeSlot,
          status: "Pending Review"
        },
        $push: { statusUpdates: historyEntry }
      },
      { new: true }
    );

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

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
    } else {
      const dept = updatedRequest.requestData?.department;
      const deptCounselors = await findCounselorsForDepartment(dept);
      if (deptCounselors.length > 0) {
        await Notification.insertMany(deptCounselors.map(c => ({
          recipientId: c._id,
          type: 'reschedule',
          title: 'Schedule change proposed',
          message: `${updatedRequest.studentName} proposed a new time for ${updatedRequest.serviceName}: ${appointmentDate} ${timeSlot}.`,
          relatedRequestId: updatedRequest._id,
          department: dept,
        }))).catch(err => console.error('Dept reschedule notification failed:', err));
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error rescheduling" });
  }
});
module.exports = router;
