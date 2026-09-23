const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing in environment variables."
  );
}

const ADMIN_EMAILS = [
  "pawanpatelcollege@gmail.com",
  "ojhavikas30@gmail.com",
  "kavyaojha05@gmail.com",
].map((email) => email.toLowerCase());

const generateToken = (
  userId,
  role,
  tokenVersion = 0
) => {
  const normalizedTokenVersion =
    Number(tokenVersion) || 0;

  return jwt.sign(
    {
      id: userId.toString(),
      role,
      tokenVersion: normalizedTokenVersion,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const getSafeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user._id || user.id,
    name: user.name || "",
    email: user.email || "",
    role: user.role || "user",
    status: user.status || "pending",
  };
};

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const validatePassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  if (password.length < 6) {
    return false;
  }

  return true;
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = normalizeEmail(email);

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

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const isAdmin =
      ADMIN_EMAILS.includes(cleanEmail);

    const role = isAdmin ? "admin" : "user";
    const status = isAdmin ? "active" : "pending";

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      role,
      status,
      tokenVersion: 0,
    });

    return res.status(201).json({
      success: true,
      message: isAdmin
        ? "Registration successful. You can login now."
        : "Registration successful. Admin approval ke baad aap login kar sakenge.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
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

    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is waiting for admin approval.",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been rejected.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not active.",
      });
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const tokenVersion =
      Number(user.tokenVersion ?? 0);

    const token = generateToken(
      user._id,
      user.role,
      tokenVersion
    );

    console.log(
      "LOGIN SUCCESS:",
      user.email
    );

    console.log(
      "JWT USER ID:",
      user._id.toString()
    );

    console.log(
      "JWT ROLE:",
      user.role
    );

    console.log(
      "JWT TOKEN VERSION:",
      tokenVersion
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(
      req.user._id
    )
      .select(
        "_id name email role status tokenVersion"
      )
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active.",
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
      },
    });
  } catch (error) {
    console.error(
      "GET PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
    });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
      status: "pending",
    })
      .select(
        "_id name email role status createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
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
        "Failed to fetch pending users.",
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message:
          "Admin account does not require approval.",
      });
    }

    if (user.status === "active") {
      return res.status(200).json({
        success: true,
        message: "User is already approved.",
        user: getSafeUser(user),
      });
    }

    user.status = "active";

    user.tokenVersion =
      Number(user.tokenVersion ?? 0) + 1;

    await user.save();

    console.log(
      "USER APPROVED:",
      user.email
    );

    return res.status(200).json({
      success: true,
      message: "User approved successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "APPROVE USER ERROR:",
      error
    );

    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to approve user.",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getPendingUsers,
  approveUser,
  generateToken,
};