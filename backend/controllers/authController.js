const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetOtp } = require('../utils/mailer');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // 2. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // 3. Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role // We include the role for frontend access control
      }
    };

    // 4. Sign the Token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }, // Staff stays logged in for a full shift
      (err, token) => {
        if (err) throw err;

        // ✅ THE FIX: Added assignedDepartments and email to the response
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            assignedDepartments: user.assignedDepartments || [], // 👈 Grabs the array!
            // So the Profile toggle reflects the saved state after login
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
  try {
    const { email } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "If this email exists, an OTP will be sent." });
    }

    // 2. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save OTP and Expiry (10 minutes from now) to database
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // 4. Send the email using the specific OTP mailer function you imported
    // ✅ THIS IS THE PART THAT CHANGED
    await sendPasswordResetOtp(user.email, otp);

    res.status(200).json({ message: "OTP sent to email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error while sending OTP." });
  }
};

// --- 2. VERIFY THE OTP ---
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Look for the user with the exact email, exact OTP, and an expiry date in the future
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() } // $gt means "Greater Than" right now
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // If found, it's valid!
    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error while verifying OTP." });
  }
};

// --- 3. SAVE THE NEW PASSWORD ---
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Double-check the OTP is still valid just in case they lingered on the reset screen
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Session expired. Please request a new OTP." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Save new password and clear the OTP fields so they can't be reused
    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error while resetting password." });
  }
};

module.exports = {
  login, // Ensure your existing login is exported
  forgotPassword,
  verifyOtp,
  resetPassword
};
