const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // NAME
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // =====================================================
    // EMAIL
    // =====================================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    // =====================================================
    // PASSWORD
    // =====================================================

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // =====================================================
    // ROLE
    // =====================================================

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "rejected",
      ],
      default: "pending",
    },

    // =====================================================
    // LOGIN SECURITY
    // =====================================================

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // =====================================================
    // PASSWORD RESET OTP
    // =====================================================

    // OTP ka SHA-256 hash.
    // Plain OTP database me save nahi hoga.

    resetOtpHash: {
      type: String,
      default: null,
      select: false,
    },

    // OTP expiry time.
    // OTP 15 minutes ke baad invalid ho jayega.

    resetOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Wrong OTP attempts.

    resetOtpAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // =====================================================
    // OTP VERIFIED RESET SESSION
    // =====================================================

    // OTP verify hone ke baad backend ek temporary
    // reset authorization hash rakhega.

    resetVerifiedTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    // Verified reset session expiry.
    // OTP verify hone ke baad password reset karne ke
    // liye limited time milega.

    resetVerifiedTokenExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // =====================================================
    // TOKEN VERSION
    // =====================================================

    // Password reset ke baad purane JWT invalidate
    // karne ke liye.

    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.model("User", userSchema);