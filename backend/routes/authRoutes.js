const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  getProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// FORGOT PASSWORD RATE LIMIT
// =====================================================

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many password reset requests. Please try again later.",
  },
});

// =====================================================
// OTP VERIFICATION RATE LIMIT
// =====================================================

const verifyResetOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many OTP verification attempts. Please try again later.",
  },
});

// =====================================================
// RESET PASSWORD RATE LIMIT
// =====================================================

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many password reset attempts. Please try again later.",
  },
});

// =====================================================
// AUTH ROUTES
// =====================================================

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Profile
router.get("/profile", protect, getProfile);

// =====================================================
// PASSWORD RESET - OTP FLOW
// =====================================================

// Step 1:
// Email submit → OTP send
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPassword
);

// Step 2:
// Email + OTP → verify OTP
router.post(
  "/verify-reset-otp",
  verifyResetOtpLimiter,
  verifyResetOtp
);

// Step 3:
// Reset token + new password → password reset
router.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPassword
);

module.exports = router;