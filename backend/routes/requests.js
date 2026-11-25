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
const OfficeClosure = require('../models/OfficeClosure');
const { scopeForStaff, guestView, scheduleError } = require('../utils/requestPolicy');
const { validateAnswers, fullName, validName } = require('../utils/formValidation');

const staffScope = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role assignedDepartments');
    if (!user || !['admin', 'counsellor'].includes(user.role)) return res.status(403).json({ message: 'Access denied.' });
    req.requestScope = scopeForStaff(user);
    next();
  } catch (error) { next(error); }
};

async function validateSchedule(date, time) {
  const [settings, closures] = await Promise.all([
    SystemSettings.findOne(), OfficeClosure.find({ date }),
  ]);
  return scheduleError(date, time, settings || {}, closures);
}

// Statuses that count as "finished" — a request in one of these no longer
// occupies a slot and no longer counts against the per-service submission limit.
const TERMINAL_STATUSES = ['Declined', 'Cancelled', 'No-Show', 'Resolved', 'Completed'];
// The inverse: statuses that are still "live".
const ACTIVE_STATUSES = [
  'Pending', 'In-Progress', 'Processing', 'Action Required',
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
    const service = await Service.findById(body.serviceId);
    if (!service || service.status !== 'Active') return res.status(400).json({ message: 'Select an active service.' });
    body.serviceName = service.name;
    const formError = validateAnswers(service.fields || [], body.requestData);
    if (formError) return res.status(400).json({ message: formError });
    const student = fullName(service.fields || [], body.requestData, 'student');
    const referrer = fullName(service.fields || [], body.requestData, 'referrer');
    if (student) body.studentName = student;
    if (referrer) body.referrerName = referrer;
    const emailField = (service.fields || []).find(f => f.type === 'email' && !/student/i.test(f.label || ''));
    if (emailField) {
      if (service.name.trim().toUpperCase() === 'REFERRAL') body.referrerEmail = String(body.requestData[emailField.name] || '').trim();
      else body.studentEmail = String(body.requestData[emailField.name] || '').trim();
    }
    const idField = (service.fields || []).find(f => /id number|student id/i.test(f.label || ''));
    if (idField) body.studentIdNumber = String(body.requestData[idField.name] || '').trim();
    if (!validName(body.studentName)) return res.status(400).json({ message: 'Enter a valid student name using letters, spaces, apostrophes, periods or hyphens.' });
    if (service.name.trim().toUpperCase() === 'REFERRAL' && !validName(body.referrerName)) return res.status(400).json({ message: 'Enter a valid referrer name.' });
    body.requiresSchedule = Boolean(service.requiresScheduling);
    if (body.requiresSchedule) {
      const dateField = service.fields.find(f=>f.type==='date' && !/birth|dob/i.test(f.label || ''));
      const timeField = service.fields.find(f=>f.type==='time');
      if (dateField) body.appointmentDate = body.requestData[dateField.name];
      if (timeField) body.timeSlot = body.requestData[timeField.name];
    }
    if (body.requiresSchedule) {
      const error = await validateSchedule(body.appointmentDate, body.timeSlot);
      if (error) return res.status(400).json({ message: error });
    }
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

    res.status(201).json({ ...guestView(savedRequest), guestToken: savedRequest.guestToken });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// STAFF: Slot conflicts — other active requests already at a given date + time.
router.get('/slot-conflicts', requireAuth, staffScope, async (req, res) => {
  try {
    const { date, time, excludeId } = req.query;
    if (!date || !time) return res.json([]);

    const query = {
      ...req.requestScope,
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
    res.json(guestView(request));
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching guest request" });
  }
});

// STAFF: Fetch all requests for the Admin Dashboard.
router.get('/', requireAuth, staffScope, async (req, res) => {
  try {
    const requests = await ServiceRequest.find(req.requestScope).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// Priority is staff-only and independent of status and guest notifications.
router.patch('/:id/priority', requireAuth, staffScope, async (req, res) => {
  try {
    const { priority } = req.body;
    if (!['Normal', 'Urgent'].includes(priority)) return res.status(400).json({ message: 'Invalid priority.' });
    const current = await ServiceRequest.findOne({ _id: req.params.id, ...req.requestScope });
    if (!current) return res.status(404).json({ message: 'Request not found.' });
    const closed = ['Completed', 'Resolved', 'Declined', 'Cancelled'];
    if (closed.includes(current.status)) return res.status(400).json({ message: 'Closed cases cannot change priority.' });
    if ((current.priority || 'Normal') === priority) return res.json(current);
    const actor = await User.findById(req.user.id).select('name role');
    const updated = await ServiceRequest.findOneAndUpdate(
      { _id: current._id, ...req.requestScope, status: { $nin: closed },
        $or: current.priority === 'Urgent' ? [{ priority: 'Urgent' }] : [{ priority: 'Normal' }, { priority: { $exists: false } }] },
      { $set: { priority }, $push: { priorityUpdates: { priority, authorId: req.user.id,
        updatedBy: `${actor.name} (${actor.role})`, updatedAt: new Date() } } },
      { returnDocument: 'after', runValidators: true });
    if (!updated) return res.status(409).json({ message: 'The case changed. Refresh and try again.' });
    res.json(updated);
  } catch (error) { res.status(500).json({ message: 'Could not update priority.' }); }
});

// STAFF: Update Status (Accept/Decline/Reschedule).
router.patch('/:id', requireAuth, staffScope, async (req, res) => {
  try {
    const { status, assignedCounselor, statusNote } = req.body;

    if (!ServiceRequest.schema.path('status').enumValues.includes(status)) {
      return res.status(400).json({ message: 'Invalid request status.' });
    }
    const existingRequest = await ServiceRequest.findOne({ _id: req.params.id, ...req.requestScope }).select('status');
    if (!existingRequest) return res.status(404).json({ message: "Request not found" });
    if (existingRequest.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cancelled cases cannot be changed or reassigned.' });
    }

    const update = { status, assignedCounselor };

    const actor = await User.findById(req.user.id).select('name role');
    const historyEntry = {
      status,
      note: statusNote || `Status updated to ${status}`,
      updatedAt: new Date(),
      updatedBy: actor ? `${actor.name} (${actor.role})` : 'Staff'
    };

    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, ...req.requestScope, status: { $ne: 'Cancelled' } },
      { $set: update, $push: { statusUpdates: historyEntry } },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updatedRequest) return res.status(409).json({ message: 'The case changed. Refresh and try again.' });

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
router.post('/:id/notes', requireAuth, staffScope, async (req, res) => {
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

    const updated = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, ...req.requestScope },
      { $push: { caseNotes: note } },
      { returnDocument: 'after', runValidators: true }
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
      { guestToken: String(req.params.token), status: { $in: ['Pending', 'In-Progress', 'Reschedule Requested'] } },
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

    res.json(guestView(updatedRequest));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error cancelling appointment" });
  }
});

// PUBLIC (guest token): student proposes a new schedule for their request.
router.patch('/guest/reschedule/:token', async (req, res) => {
  try {
    const { appointmentDate, timeSlot, statusNote } = req.body;
    const current = await ServiceRequest.findOne({ guestToken: String(req.params.token) });
    if (!current) return res.status(404).json({ message: 'Invalid tracking link.' });
    if (!current.requiresSchedule || current.status !== 'Reschedule Requested') {
      return res.status(400).json({ message: 'This request cannot be rescheduled.' });
    }
    const error = await validateSchedule(appointmentDate, timeSlot);
    if (error) return res.status(400).json({ message: error });

    const historyEntry = {
      status: "Pending",
      note: statusNote || "Student updated the preferred schedule.",
      updatedAt: new Date()
    };

    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { guestToken: String(req.params.token), requiresSchedule: true, status: 'Reschedule Requested' },
      {
        $set: {
          appointmentDate,
          timeSlot,
          reminderSent: false,
          status: "Pending"
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

    res.json(guestView(updatedRequest));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error rescheduling" });
  }
});
module.exports = router;
