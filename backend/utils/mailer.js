// backend/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // ✅ Nodemailer handles the host/port for you
  auth: {
    user: 'ecila070102@gmail.com',
    pass: 'qomm klqn jzdy hfym' // ✅ Your 16-character Google App Password
  }
});


const sendGuestLink = async (toEmail, serviceName, token, serviceInfo) => {
  const viewLink = `http://localhost:5173/view-request/${token}`;

  // ✅ Conditionally create an info block if serviceInfo exists
  const infoHtmlBlock = serviceInfo 
    ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #c00000; padding: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e293b;">Important Information regarding this service:</h4>
        <p style="margin: 0; color: #475569; font-size: 14px; white-space: pre-wrap;">${serviceInfo}</p>
      </div>
    ` 
    : '';

  const mailOptions = {
    from: '"UB CCSD Team" <ecila070102@gmail.com>', 
    to: toEmail,
    subject: `Request Received: ${serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #c00000;">University of Baguio - CCSD</h2>
        <p>Hello,</p>
        <p>We have received your request for <strong>${serviceName}</strong>.</p>
        
        ${infoHtmlBlock} <p>You can track the status of your request via your secure guest link below:</p>
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
// ✅ NEW: Notify Staff for Password Reset (OTP)
const sendPasswordResetOtp = async (toEmail, otp) => {
  const mailOptions = {
    from: '"UB CCSD Team" <ecila070102@gmail.com>', // Matches your configured auth user
    to: toEmail,
    subject: `UB CCSD - Password Reset OTP`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 30px; max-width: 600px; text-align: center; margin: 0 auto;">
        <h2 style="color: #c00000; margin-bottom: 10px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px;">You requested to reset your password for the UB CCSD Admin Portal.</p>
        
        <p style="margin-top: 30px; color: #1e293b;">Your One-Time Password (OTP) is:</p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e293b; margin: 10px 0 20px 0; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: inline-block;">
          ${otp}
        </div>
        
        <p style="color: #dc2626; font-weight: bold; font-size: 13px;">This code will expire in 10 minutes.</p>
        
        <div style="font-size: 11px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          If you did not request a password reset, please ignore this email. Your account remains secure.
        </div>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};
module.exports = { 
  sendGuestLink, 
  sendCounselorNotification, 
  sendStatusUpdateToStudent, 
  sendStatusUpdateToReferrer,
  sendPasswordResetOtp,
};