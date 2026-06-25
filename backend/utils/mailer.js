// backend/utils/mailer.js
const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');
console.log('OAUTH CHECK:', {
  user: process.env.GMAIL_USER,
  clientId: process.env.OAUTH_CLIENT_ID ? 'SET' : 'MISSING',
  secret: process.env.OAUTH_CLIENT_SECRET ? 'SET' : 'MISSING',
  refresh: process.env.OAUTH_REFRESH_TOKEN ? 'SET' : 'MISSING',
});
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GMAIL_USER = process.env.GMAIL_USER; // e.g. ecila070102@gmail.com

// --- OAuth2 Client Setup ---
const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Must match your authorized redirect URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// --- Core send function ---
const sendMail = async ({ to, subject, html, fromLabel = 'UB CCSD Team' }) => {
  const mail = new MailComposer({
    from: `"${fromLabel}" <${GMAIL_USER}>`,
    to,
    subject,
    html,
    textEncoding: 'base64',
  });

  const message = await mail.compile().build();
  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
};

// --- Public mail functions ---

const sendGuestLink = async (toEmail, serviceName, token, serviceInfo) => {
  const viewLink = `${FRONTEND_URL}/view-request/${token}`;

  const infoHtmlBlock = serviceInfo
    ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #c00000; padding: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e293b;">Important Information regarding this service:</h4>
        <p style="margin: 0; color: #475569; font-size: 14px; white-space: pre-wrap;">${serviceInfo}</p>
      </div>
    `
    : '';

  return sendMail({
    to: toEmail,
    subject: `Request Received: ${serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #c00000;">University of Baguio - CCSD</h2>
        <p>Hello,</p>
        <p>We have received your request for <strong>${serviceName}</strong>.</p>
        ${infoHtmlBlock}
        <p>You can track the status of your request via your secure guest link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background-color: #c00000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View My Request
          </a>
        </div>
        <p style="font-size: 11px; color: #999;">This is an automated message. Please do not reply.</p>
      </div>
    `,
  });
};

const sendCounselorNotification = async (counselorEmail, studentName, department, serviceName) => {
  return sendMail({
    to: counselorEmail,
    subject: `New Request: ${department} - ${studentName}`,
    fromLabel: 'UB CCSD System',
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
    `,
  });
};

const sendStatusUpdateToStudent = async (toEmail, serviceName, newStatus, token) => {
  const viewLink = `${FRONTEND_URL}/view-request/${token}`;

  return sendMail({
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
    `,
  });
};

const sendStatusUpdateToReferrer = async (toEmail, studentName, newStatus, token) => {
  const viewLink = `${FRONTEND_URL}/view-request/${token}`;

  return sendMail({
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
    `,
  });
};

const sendPasswordResetOtp = async (toEmail, otp) => {
  return sendMail({
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
    `,
  });
};

module.exports = {
  sendGuestLink,
  sendCounselorNotification,
  sendStatusUpdateToStudent,
  sendStatusUpdateToReferrer,
  sendPasswordResetOtp,
};