const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

require("dotenv").config();

const User = require("../models/User");

const JWT_SECRET = String(
  process.env.JWT_SECRET || ""
).trim();

if (!JWT_SECRET) {
  console.error(
    "JWT_SECRET: NOT CONFIGURED"
  );
}

const EMAIL_USER = String(
  process.env.EMAIL_USER || ""
).trim();

const EMAIL_PASS = String(
  process.env.EMAIL_PASS || ""
).replace(/\s/g, "");

let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  console.log(
    "EMAIL TRANSPORTER: GMAIL SMTP 587 CONFIGURED"
  );
} else {
  console.warn(
    "EMAIL TRANSPORTER: NOT CONFIGURED"
  );
}

const normalizeEmail = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const normalizeName = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
};

const hashValue = (value) => {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
};

const safeHashCompare = (
  valueA,
  valueB
) => {
  const a = Buffer.from(
    String(valueA || ""),
    "utf8"
  );

  const b = Buffer.from(
    String(valueB || ""),
    "utf8"
  );

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    a,
    b
  );
};

const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const generateOtp = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

const generateResetVerifiedToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

const createToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion:
        user.tokenVersion || 0,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sendPasswordResetEmail = async (
  email,
  name,
  otp
) => {
  if (!transporter) {
    throw new Error(
      "Gmail SMTP transporter is not configured."
    );
  }

  const safeName = escapeHtml(
    name || "User"
  );

  const safeOtp = escapeHtml(
    otp
  );

  const mailOptions = {
    from: `"Vraj Creation India" <${EMAIL_USER}>`,

    to: email,

    subject:
      "Password Reset OTP - Vraj Creation India",

    text: `Hello ${name || "User"},

Your Vraj Creation India password reset OTP is:

${otp}

This OTP is valid for 15 minutes.

If you did not request a password reset, please ignore this email.

Vraj Creation India
Bringing Art to Life`,

    html: `
      <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <div style="padding:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;">
            <h1 style="margin:0;font-size:24px;">
              Vraj Creation India
            </h1>

            <p style="margin:8px 0 0;font-size:14px;">
              Bringing Art to Life
            </p>
          </div>

          <div style="padding:30px;">

            <h2 style="margin-top:0;color:#111827;">
              Password Reset
            </h2>

            <p style="color:#374151;">
              Hello ${safeName},
            </p>

            <p style="color:#374151;line-height:1.6;">
              We received a request to reset your Vraj Creation India account password.
              Use the OTP below to continue.
            </p>

            <div style="margin:25px 0;text-align:center;">
              <div style="display:inline-block;padding:16px 28px;background:#f3f4f6;border-radius:10px;border:1px solid #d1d5db;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">
                  ${safeOtp}
                </span>
              </div>
            </div>

            <p style="color:#6b7280;font-size:14px;text-align:center;">
              This OTP is valid for 15 minutes.
            </p>

            <p style="color:#374151;line-height:1.6;">
              If you did not request this password reset, you can safely ignore this email.
            </p>

            <hr style="border:0;border-top:1px solid #e5e7eb;margin:25px 0;">

            <p style="margin:0;color:#6b7280;font-size:13px;">
              Vraj Creation India<br>
              Bringing Art to Life
            </p>

          </div>
        </div>
      </div>
    `,
  };

  const info =
    await transporter.sendMail(
      mailOptions
    );

  console.log(
    "PASSWORD RESET EMAIL SENT:",
    email
  );

  if (info?.messageId) {
    console.log(
      "EMAIL MESSAGE ID:",
      info.messageId
    );
  }

  return info;
};

const register = async (
  req,
  res
) => {
  try {
    const name = normalizeName(
      req.body?.name
    );

    const email = normalizeEmail(
      req.body?.email
    );

    const password = String(
      req.body?.password || ""
    );

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be between 2 and 100 characters.",
      });
    }

    if (email.length > 254) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is too long.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters.",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message:
          "Password must not exceed 128 characters.",
      });
    }

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const user =
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
        status: "pending",
        tokenVersion: 0,
        failedLoginAttempts: 0,
        lockUntil: null,
      });

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Your account is pending admin approval.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Registration failed. Please try again.",
    });
  }
};

const login = async (
  req,
  res
) => {
  try {
    const email = normalizeEmail(
      req.body?.email
    );

    const password = String(
      req.body?.password || ""
    );

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const user =
      await User.findOne({
        email,
      }).select(
        "+password +resetOtpHash +resetOtpExpires +resetVerifiedTokenHash +resetVerifiedTokenExpires"
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (
      user.lockUntil &&
      user.lockUntil.getTime() >
        Date.now()
    ) {
      const remainingMinutes =
        Math.ceil(
          (user.lockUntil.getTime() -
            Date.now()) /
            60000
        );

      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Please try again after ${remainingMinutes} minute(s).`,
      });
    }

    if (
      user.lockUntil &&
      user.lockUntil.getTime() <=
        Date.now()
    ) {
      user.lockUntil = null;
      user.failedLoginAttempts = 0;

      await user.save();
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      user.failedLoginAttempts =
        (user.failedLoginAttempts || 0) +
        1;

      if (
        user.failedLoginAttempts >= 5
      ) {
        user.lockUntil =
          new Date(
            Date.now() +
              15 * 60 * 1000
          );

        user.failedLoginAttempts = 0;

        await user.save();

        return res.status(423).json({
          success: false,
          message:
            "Too many failed login attempts. Account temporarily locked for 15 minutes.",
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (
      user.status === "pending"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending admin approval.",
        status: user.status,
      });
    }

    if (
      user.status === "rejected"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account registration has been rejected.",
        status: user.status,
      });
    }

    if (
      user.status !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not active.",
        status: user.status,
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    const token = createToken(
      user
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        tokenVersion:
          user.tokenVersion || 0,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed. Please try again.",
    });
  }
};

const getProfile = async (
  req,
  res
) => {
  try {
    if (
      !req.user ||
      !req.user.id
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const user =
      await User.findById(
        req.user.id
      ).select(
        "-password -resetOtpHash -resetOtpExpires -resetOtpAttempts -resetVerifiedTokenHash -resetVerifiedTokenExpires"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        tokenVersion:
          user.tokenVersion || 0,
        createdAt:
          user.createdAt,
        updatedAt:
          user.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "GET PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch profile.",
    });
  }
};

const forgotPassword = async (
  req,
  res
) => {
  try {
    const email = normalizeEmail(
      req.body?.email
    );

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email is required.",
      });
    }

    const genericMessage =
      "If an account exists with this email, a password reset OTP has been sent.";

    const user =
      await User.findOne({
        email,
      }).select(
        "+resetOtpHash +resetOtpExpires +resetOtpAttempts +resetVerifiedTokenHash +resetVerifiedTokenExpires"
      );

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    if (
      user.status === "rejected"
    ) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    if (!transporter) {
      console.error(
        "PASSWORD RESET EMAIL ERROR: GMAIL SMTP TRANSPORTER NOT CONFIGURED"
      );

      return res.status(500).json({
        success: false,
        message:
          "Password reset email service is currently unavailable.",
      });
    }

    const otp = generateOtp();

    user.resetOtpHash =
      hashValue(otp);

    user.resetOtpExpires =
      new Date(
        Date.now() +
          15 * 60 * 1000
      );

    user.resetOtpAttempts = 0;

    user.resetVerifiedTokenHash =
      null;

    user.resetVerifiedTokenExpires =
      null;

    await user.save();

    try {
      await sendPasswordResetEmail(
        user.email,
        user.name,
        otp
      );
    } catch (emailError) {
      console.error(
        "PASSWORD RESET EMAIL SEND ERROR:",
        emailError?.message ||
          "Unknown email error"
      );

      user.resetOtpHash = null;
      user.resetOtpExpires = null;
      user.resetOtpAttempts = 0;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request.",
    });
  }
};

const verifyResetOtp = async (
  req,
  res
) => {
  try {
    const email = normalizeEmail(
      req.body?.email
    );

    const otp = String(
      req.body?.otp || ""
    ).trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must be a 6-digit number.",
      });
    }

    const user =
      await User.findOne({
        email,
      }).select(
        "+resetOtpHash +resetOtpExpires +resetOtpAttempts +resetVerifiedTokenHash +resetVerifiedTokenExpires"
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP.",
      });
    }

    if (
      !user.resetOtpHash ||
      !user.resetOtpExpires
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP.",
      });
    }

    if (
      user.resetOtpExpires.getTime() <=
      Date.now()
    ) {
      user.resetOtpHash = null;
      user.resetOtpExpires = null;
      user.resetOtpAttempts = 0;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (
      (user.resetOtpAttempts || 0) >=
      5
    ) {
      user.resetOtpHash = null;
      user.resetOtpExpires = null;
      user.resetOtpAttempts = 0;

      await user.save();

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    const submittedOtpHash =
      hashValue(otp);

    const otpMatches =
      safeHashCompare(
        submittedOtpHash,
        user.resetOtpHash
      );

    if (!otpMatches) {
      user.resetOtpAttempts =
        (user.resetOtpAttempts || 0) +
        1;

      await user.save();

      const attemptsLeft =
        Math.max(
          0,
          5 -
            user.resetOtpAttempts
        );

      return res.status(400).json({
        success: false,
        message:
          attemptsLeft > 0
            ? `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`
            : "Invalid OTP. Please request a new OTP.",
      });
    }

    const resetVerifiedToken =
      generateResetVerifiedToken();

    user.resetVerifiedTokenHash =
      hashValue(
        resetVerifiedToken
      );

    user.resetVerifiedTokenExpires =
      new Date(
        Date.now() +
          10 * 60 * 1000
      );

    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully. You can now reset your password.",
      resetToken:
        resetVerifiedToken,
    });
  } catch (error) {
    console.error(
      "VERIFY RESET OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP.",
    });
  }
};

const resetPassword = async (
  req,
  res
) => {
  try {
    const email = normalizeEmail(
      req.body?.email
    );

    const resetToken = String(
      req.body?.resetToken || ""
    ).trim();

    const newPassword = String(
      req.body?.newPassword ||
        req.body?.password ||
        ""
    );

    if (
      !email ||
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, reset token and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters.",
      });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message:
          "New password must not exceed 128 characters.",
      });
    }

    const user =
      await User.findOne({
        email,
      }).select(
        "+password +resetOtpHash +resetOtpExpires +resetOtpAttempts +resetVerifiedTokenHash +resetVerifiedTokenExpires"
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset request.",
      });
    }

    if (
      !user.resetVerifiedTokenHash ||
      !user.resetVerifiedTokenExpires
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset session is invalid or expired.",
      });
    }

    if (
      user.resetVerifiedTokenExpires.getTime() <=
      Date.now()
    ) {
      user.resetVerifiedTokenHash = null;
      user.resetVerifiedTokenExpires =
        null;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "Password reset session has expired. Please start again.",
      });
    }

    const submittedTokenHash =
      hashValue(resetToken);

    const tokenMatches =
      safeHashCompare(
        submittedTokenHash,
        user.resetVerifiedTokenHash
      );

    if (!tokenMatches) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset token.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password =
      hashedPassword;

    user.resetVerifiedTokenHash =
      null;

    user.resetVerifiedTokenExpires =
      null;

    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    user.tokenVersion =
      (user.tokenVersion || 0) + 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password. Please try again.",
    });
  }
};

const getPendingUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find({
        status: "pending",
      })
        .select(
          "-password -resetOtpHash -resetOtpExpires -resetOtpAttempts -resetVerifiedTokenHash -resetVerifiedTokenExpires"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "GET PENDING USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch pending users.",
    });
  }
};

const approveUser = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (
      user.status === "active"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "User is already active.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    user.status = "active";

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "User approved successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "APPROVE USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to approve user.",
    });
  }
};

const rejectUser = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    user.status = "rejected";

    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;

    user.resetVerifiedTokenHash =
      null;

    user.resetVerifiedTokenExpires =
      null;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "User rejected successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "REJECT USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reject user.",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getPendingUsers,
  approveUser,
  rejectUser,
};