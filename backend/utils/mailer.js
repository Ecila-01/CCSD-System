// backend/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // ✅ Nodemailer handles the host/port for you
  auth: {
    user: 'wiporamirez.01@gmail.com',
    pass: 'zgzi gvxa brff eymu' // ✅ Your 16-character Google App Password
  }
});

const sendGuestLink = async (toEmail, serviceName, token) => {
  const viewLink = `http://localhost:5173/view-request/${token}`;

  const mailOptions = {
    from: '"UB CCSD Team" <your-email@gmail.com>', // ✅ Use the same Gmail address here
    to: toEmail,
    subject: `Request Received: ${serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #c00000;">University of Baguio - CCSD</h2>
        <p>Hello,</p>
        <p>We have received your request for <strong>${serviceName}</strong>.</p>
        <p>You can track the status of your request via your secure guest link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background-color: #c00000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View My Request
          </a>
        </div>
        <p style="font-size: 11px; color: #999;">This is an automated message. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// utils/mailer.js

// ✅ NEW: Function to notify assigned counselors
const sendCounselorNotification = async (counselorEmail, studentName, department, serviceName) => {
  const mailOptions = {
    from: '"UB CCSD System" <your-gmail@gmail.com>',
    to: counselorEmail,
    subject: `New Request: ${department} - ${studentName}`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #c00000;">New Service Request</h2>
        <p>A student from your assigned department (<strong>${department}</strong>) has submitted a request.</p>
        <hr/>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Service:</strong> ${serviceName}</p>
        <br/>
        <p>Please log in to the Admin Dashboard to review the details.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

// utils/mailer.js

// ✅ Notify the Student (Standard Services)
// ✅ Updated: Notify the Student (Standard Services) with Guest Link
const sendStatusUpdateToStudent = async (toEmail, serviceName, newStatus, token) => {
  const viewLink = `http://localhost:5173/view-request/${token}`; // Re-generate the link

  const mailOptions = {
    from: '"UB CCSD Team" <wiporamirez.01@gmail.com>',
    to: toEmail,
    subject: `Update on your ${serviceName} Request`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; max-width: 600px;">
        <h2 style="color: #c00000;">Status Update</h2>
        <p>Hello,</p>
        <p>Your request for <strong>${serviceName}</strong> has been updated to: <span style="font-weight: bold; color: #2563eb;">${newStatus.toUpperCase()}</span>.</p>
        <p>You can view the full details and track further updates using your secure link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background-color: #c00000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Request Status
          </a>
        </div>
        <p style="font-size: 11px; color: #999;">If the button above doesn't work, copy and paste this link: <br/> ${viewLink}</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

// ✅ Updated: Notify the Referrer (Referral Service) with Guest Link
const sendStatusUpdateToReferrer = async (toEmail, studentName, newStatus, token) => {
  const viewLink = `http://localhost:5173/view-request/${token}`;

  const mailOptions = {
    from: '"UB CCSD Team" <wiporamirez.01@gmail.com>',
    to: toEmail,
    subject: `Update: Referral for ${studentName}`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; max-width: 600px;">
        <h2 style="color: #c00000;">Referral Status Update</h2>
        <p>Hello,</p>
        <p>Regarding your referral for <strong>${studentName}</strong>: the case status has been updated to <span style="font-weight: bold; color: #2563eb;">${newStatus.toUpperCase()}</span>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background-color: #c00000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Track Case Progress
          </a>
        </div>
        <p style="color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px;">
          Note: For confidentiality reasons, the student has NOT been notified of this specific status change via email.
        </p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { 
  sendGuestLink, 
  sendCounselorNotification, 
  sendStatusUpdateToStudent, 
  sendStatusUpdateToReferrer 
};