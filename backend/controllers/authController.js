const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetOtp } = require('../utils/mailer');

const MAX_OTP_ATTEMPTS = 5;

// Normalise an email coming from the request body to a safe lowercase string.
const normEmail = (email) => String(email || '').trim().toLowerCase();

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: normEmail(email) });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(String(password || ''), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            assignedDepartments: user.assignedDepartments || [],
            notificationPreferences: user.notificationPreferences || { newSubmissionEmails: false }
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- 1. GENERATE AND SEND OTP ---
const forgotPassword = async (req, res) => {
  // Always respond the same way so attackers can't enumerate accounts.
  const uniform = () =>
    res.status(200).json({ message: "If this email exists, an OTP has been sent." });

  try {
    const email = normEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) return uniform();

    // Cryptographically secure 6-digit OTP.
    const otp = String(crypto.randomInt(100000, 1000000));

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    user.resetPasswordAttempts = 0;
    await user.save();

    await sendPasswordResetOtp(user.email, otp);
    return uniform();
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    // Still return the uniform message to avoid leaking anything.
    return res.status(200).json({ message: "If this email exists, an OTP has been sent." });
  }
};

// Shared OTP validation with per-account attempt lockout.
// Returns the user document on success, or null after sending an error response.
const validateOtp = async (req, res) => {
  const email = normEmail(req.body.email);
  const otp = String(req.body.otp || '');

  const user = await User.findOne({
    email,
    resetPasswordExpires: { $gt: Date.now() }
  });

  // No active reset cycle at all.
  if (!user || !user.resetPasswordOtp) {
    res.status(400).json({ message: "Invalid or expired OTP." });
    return null;
  }

  // Too many wrong tries — invalidate the OTP entirely.
  if (user.resetPasswordAttempts >= MAX_OTP_ATTEMPTS) {
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.status(429).json({ message: "Too many incorrect attempts. Please request a new OTP." });
    return null;
  }

  if (user.resetPasswordOtp !== otp) {
    user.resetPasswordAttempts += 1;
    await user.save();
    res.status(400).json({ message: "Invalid or expired OTP." });
    return null;
  }

  return user;
};

// --- 2. VERIFY THE OTP ---
const verifyOtp = async (req, res) => {
  try {
    const user = await validateOtp(req, res);
    if (!user) return; // response already sent
    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);
    res.status(500).json({ message: "Server error while verifying OTP." });
  }
};

// --- 3. SAVE THE NEW PASSWORD ---
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const user = await validateOtp(req, res);
    if (!user) return; // response already sent

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(String(newPassword), salt);
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ message: "Server error while resetting password." });
  }
};

module.exports = {
  login,
  forgotPassword,
  verifyOtp,
  resetPassword
};
