const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// You'll need to import your User model
// const User = require('../models/User');

// In-memory store for 2FA codes. In a production environment, you should use
// a more persistent store like Redis.
const twoFACodeStore = new Map();

// A helper to generate a random 6-digit code
const generateRandomCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * @route   POST /api/2fa/send-code
 * @desc    Generate and send a 2FA code
 * @access  Private
 */
router.post("/send-code", async (req, res) => {
  const { userId, method } = req.body;

  if (!userId || !method) {
    return res
      .status(400)
      .json({ message: "User ID and method are required." });
  }

  try {
    // const user = await User.findById(userId);
    // if (!user) {
    //   return res.status(404).json({ message: "User not found." });
    // }

    const code = generateRandomCode();
    const expiration = Date.now() + 10 * 60 * 1000; // 10-minute expiration

    twoFACodeStore.set(userId, { code, expiration });

    console.log(`Generated 2FA code for user ${userId}: ${code}`);

    if (method === "email") {
      // --- Email Sending Logic ---
      // Use a service like Nodemailer, SendGrid, or AWS SES here.
      // Example:
      // await sendEmail({
      //   to: user.email,
      //   subject: "Your Verification Code",
      //   text: `Your two-factor authentication code is: ${code}`,
      // });
      console.log(`(Pretend) Sending email to user's email with code: ${code}`);
    } else if (method === "phone") {
      // --- SMS Sending Logic ---
      // Use a service like Twilio here.
      // Example:
      // await twilioClient.messages.create({
      //   body: `Your verification code is: ${code}`,
      //   from: 'YOUR_TWILIO_NUMBER',
      //   to: user.phoneNumber,
      // });
      console.log(`(Pretend) Sending SMS to user's phone with code: ${code}`);
    }

    res.status(200).json({ message: "Verification code sent successfully." });
  } catch (error) {
    console.error("Error sending 2FA code:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * @route   POST /api/2fa/verify-code
 * @desc    Verify a 2FA code
 * @access  Private
 */
router.post("/verify-code", async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ message: "User ID and code are required." });
  }

  const stored = twoFACodeStore.get(userId);

  if (!stored || stored.expiration < Date.now()) {
    return res.status(400).json({ message: "Code is invalid or has expired." });
  }

  if (stored.code !== code) {
    return res.status(400).json({ message: "Invalid verification code." });
  }

  // Code is correct, clear it from the store
  twoFACodeStore.delete(userId);

  res.status(200).json({ message: "Code verified successfully." });
});

/**
 * @route   POST /api/2fa/toggle
 * @desc    Enable or disable 2FA for a user
 * @access  Private
 */
router.post("/toggle", async (req, res) => {
  const { userId, enabled, method } = req.body;

  if (!userId || enabled === undefined) {
    return res
      .status(400)
      .json({ message: "User ID and enabled status are required." });
  }

  if (enabled && !method) {
    return res
      .status(400)
      .json({ message: "A method (email/phone) is required to enable 2FA." });
  }

  try {
    // const user = await User.findById(userId);
    // if (!user) {
    //     return res.status(404).json({ message: "User not found." });
    // }

    // user.isTwoFactorEnabled = enabled;
    // user.twoFactorMethod = enabled ? method : undefined;
    // await user.save();

    console.log(
      `2FA for user ${userId} has been ${enabled ? "ENABLED" : "DISABLED"}`,
    );

    res.status(200).json({
      message: `2FA has been successfully ${enabled ? "enabled" : "disabled"}.`,
      isTwoFactorEnabled: enabled,
      twoFactorMethod: enabled ? method : undefined,
    });
  } catch (error) {
    console.error("Error toggling 2FA:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
