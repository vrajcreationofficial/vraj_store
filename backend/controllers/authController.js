const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

require("dotenv").config();

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const normalizeName = (name) =>
  String(name || "")
    .trim();

const normalizePhone = (phone) =>
  String(phone || "")
    .trim();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not configured.");
}

const EMAIL_USER = String(process.env.EMAIL_USER || "").trim();
const EMAIL_PASS = String(process.env.EMAIL_PASS || "").trim();

let mailTransporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  console.log("EMAIL TRANSPORTER: CONFIGURED");
} else {
  console.warn(
    "EMAIL TRANSPORTER: NOT CONFIGURED - EMAIL_USER or EMAIL_PASS missing"
  );
}

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sendPasswordResetEmail = async ({
  email,
  name,
  otp,
}) => {
  if (!mailTransporter) {
    throw new Error(
      "Email service is not configured. Please configure EMAIL_USER and EMAIL_PASS."
    );
  }

  const safeName = name || "Customer";

  const mailOptions = {
    from: `"Vraj Creation India" <${EMAIL_USER}>`,
    to: email,
    subject: "Vraj Creation India - Password Reset OTP",
    text: `Hello ${safeName},

Your password reset OTP for Vraj Creation India is:

${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, please ignore this email.

Vraj Creation India
Bringing Art to Life`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Password Reset OTP</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f5f5f5;
            font-family:Arial,Helvetica,sans-serif;
          "
        >
          <div
            style="
              width:100%;
              padding:30px 10px;
              box-sizing:border-box;
            "
          >
            <div
              style="
                max-width:600px;
                margin:0 auto;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                box-shadow:0 4px 20px rgba(0,0,0,0.08);
              "
            >
              <div
                style="
                  background:linear-gradient(135deg,#4f46e5,#7c3aed);
                  padding:30px 20px;
                  text-align:center;
                  color:#ffffff;
                "
              >
                <h1
                  style="
                    margin:0;
                    font-size:28px;
                  "
                >
                  Vraj Creation India
                </h1>

                <p
                  style="
                    margin:8px 0 0;
                    font-size:14px;
                    opacity:0.95;
                  "
                >
                  Bringing Art to Life
                </p>
              </div>

              <div
                style="
                  padding:35px 30px;
                  color:#333333;
                "
              >
                <h2
                  style="
                    margin-top:0;
                    font-size:22px;
                  "
                >
                  Password Reset Request
                </h2>

                <p
                  style="
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Hello ${safeName},
                </p>

                <p
                  style="
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  We received a request to reset the password for your
                  Vraj Creation India account.
                </p>

                <p
                  style="
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Your One-Time Password (OTP) is:
                </p>

                <div
                  style="
                    margin:25px 0;
                    padding:18px;
                    background:#f3f4f6;
                    border-radius:10px;
                    text-align:center;
                    letter-spacing:8px;
                    font-size:32px;
                    font-weight:bold;
                    color:#4f46e5;
                  "
                >
                  ${otp}
                </div>

                <p
                  style="
                    font-size:14px;
                    line-height:1.6;
                    color:#555555;
                  "
                >
                  This OTP is valid for
                  <strong>10 minutes</strong>.
                </p>

                <p
                  style="
                    font-size:14px;
                    line-height:1.6;
                    color:#555555;
                  "
                >
                  If you did not request a password reset, you can safely
                  ignore this email.
                </p>

                <hr
                  style="
                    border:none;
                    border-top:1px solid #eeeeee;
                    margin:30px 0;
                  "
                />

                <p
                  style="
                    margin:0;
                    font-size:13px;
                    color:#777777;
                    text-align:center;
                  "
                >
                  Vraj Creation India
                </p>

                <p
                  style="
                    margin:5px 0 0;
                    font-size:13px;
                    color:#777777;
                    text-align:center;
                  "
                >
                  Bringing Art to Life
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return mailTransporter.sendMail(mailOptions);
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    const cleanName = normalizeName(name);
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(phone);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const userData = {
      name: cleanName,
      email: cleanEmail,
      password,
    };

    if (cleanPhone) {
      userData.phone = cleanPhone;
    }

    const user = await User.create(userData);

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register user.",
    });
  }
};

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: cleanEmail,
    });

    console.log(
      "AUTH USER FOUND:",
      user ? user.email : "NO USER"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const tokenVersion = user.tokenVersion || 0;

    console.log(
      "TOKEN VERSION:",
      tokenVersion
    );

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const user = await User.findById(userId).select(
      "-password -resetPasswordOTP -resetPasswordOTPExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get profile.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const {
      email,
    } = req.body;

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    user.resetPasswordOTP = otp;

    user.resetPasswordOTPExpires =
      Date.now() + 10 * 60 * 1000;

    await user.save();

    console.log(
      "PASSWORD RESET OTP GENERATED FOR:",
      cleanEmail
    );

    if (!mailTransporter) {
      console.error(
        "PASSWORD RESET EMAIL ERROR: EMAIL TRANSPORTER NOT CONFIGURED"
      );

      return res.status(500).json({
        success: false,
        message:
          "Email service is not configured. Please contact administrator.",
      });
    }

    try {
      const mailResult =
        await sendPasswordResetEmail({
          email: cleanEmail,
          name: user.name,
          otp,
        });

      console.log(
        "PASSWORD RESET EMAIL SENT:",
        cleanEmail
      );

      console.log(
        "EMAIL MESSAGE ID:",
        mailResult.messageId
      );
    } catch (emailError) {
      console.error(
        "PASSWORD RESET EMAIL SEND ERROR:",
        emailError
      );

      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpires = undefined;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset OTP has been sent.",
      ...(process.env.NODE_ENV !== "production"
        ? {
            developmentOTP: otp,
          }
        : {}),
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

const verifyResetOtp = async (req, res) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    const cleanEmail = normalizeEmail(email);
    const cleanOtp = String(otp || "").trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    if (!user.resetPasswordOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    if (
      !user.resetPasswordOTPExpires ||
      user.resetPasswordOTPExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (
      String(user.resetPasswordOTP) !==
      cleanOtp
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
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

const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      password,
      newPassword,
    } = req.body;

    const cleanEmail = normalizeEmail(email);
    const cleanOtp = String(otp || "").trim();

    const finalPassword =
      String(newPassword || password || "").trim();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    if (!finalPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    if (finalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters.",
      });
    }

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    if (!user.resetPasswordOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    if (
      !user.resetPasswordOTPExpires ||
      user.resetPasswordOTPExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (
      String(user.resetPasswordOTP) !==
      cleanOtp
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    user.password = finalPassword;

    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    user.tokenVersion =
      (user.tokenVersion || 0) + 1;

    await user.save();

    console.log(
      "PASSWORD RESET SUCCESS:",
      cleanEmail
    );

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
        "Unable to reset password.",
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
};