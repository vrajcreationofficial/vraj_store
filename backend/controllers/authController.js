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

/*
|--------------------------------------------------------------------------
| LOGIN SECURITY
|--------------------------------------------------------------------------
*/

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_SECONDS = 30;
const LOGIN_LOCK_MS =
  LOGIN_LOCK_SECONDS * 1000;

/*
 * In-memory login attempt storage.
 *
 * Example:
 *
 * loginAttempts = {
 *   "email@example.com": {
 *      attempts: 3,
 *      lockedUntil: 0
 *   }
 * }
 *
 * Server restart hone par ye reset ho jayega.
 */

const loginAttempts = new Map();

const getLoginAttemptData = (email) => {
  const existing =
    loginAttempts.get(email);

  if (!existing) {
    return {
      attempts: 0,
      lockedUntil: 0,
    };
  }

  /*
   * Lock expired
   */
  if (
    existing.lockedUntil &&
    Date.now() >= existing.lockedUntil
  ) {
    loginAttempts.delete(email);

    return {
      attempts: 0,
      lockedUntil: 0,
    };
  }

  return existing;
};

const isLoginLocked = (email) => {
  const data =
    getLoginAttemptData(email);

  if (
    data.lockedUntil &&
    Date.now() < data.lockedUntil
  ) {
    return true;
  }

  return false;
};

const getRemainingLockSeconds = (
  email
) => {
  const data =
    getLoginAttemptData(email);

  if (!data.lockedUntil) {
    return 0;
  }

  const remaining =
    data.lockedUntil - Date.now();

  if (remaining <= 0) {
    loginAttempts.delete(email);

    return 0;
  }

  return Math.ceil(
    remaining / 1000
  );
};

const recordFailedLogin = (email) => {
  const data =
    getLoginAttemptData(email);

  data.attempts =
    Number(data.attempts || 0) + 1;

  /*
   * 5 failed attempts
   */
  if (
    data.attempts >=
    MAX_LOGIN_ATTEMPTS
  ) {
    data.lockedUntil =
      Date.now() +
      LOGIN_LOCK_MS;

    loginAttempts.set(
      email,
      data
    );

    return {
      locked: true,
      attempts: data.attempts,
      remainingSeconds:
        LOGIN_LOCK_SECONDS,
    };
  }

  loginAttempts.set(
    email,
    data
  );

  return {
    locked: false,
    attempts: data.attempts,
    remainingSeconds: 0,
  };
};

const resetLoginAttempts = (
  email
) => {
  loginAttempts.delete(email);
};

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
      tokenVersion:
        normalizedTokenVersion,
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
    status:
      user.status || "pending",
  };
};

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const validatePassword = (
  password
) => {
  if (
    typeof password !== "string"
  ) {
    return false;
  }

  if (password.length < 6) {
    return false;
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

const register = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    const cleanName =
      String(name || "").trim();

    const cleanEmail =
      normalizeEmail(email);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message:
          "Name is required.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email is required.",
      });
    }

    if (
      !validatePassword(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    /*
     * Admin emails automatically become active.
     * Normal users remain pending.
     */

    const isAdmin =
      ADMIN_EMAILS.includes(
        cleanEmail
      );

    const role = isAdmin
      ? "admin"
      : "user";

    const status = isAdmin
      ? "active"
      : "pending";

    /*
     * Password hashing
     */

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    console.log(
      "REGISTER DATA:",
      {
        name: cleanName,
        email: cleanEmail,
        role,
        status,
      }
    );

    const user =
      await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role,
        status,
        tokenVersion: 0,
      });

    console.log(
      "USER CREATED:",
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
      }
    );

    /*
     * Normal user
     */

    if (!isAdmin) {
      return res.status(201).json({
        success: true,
        message:
          "Registration successful. Admin approval ke baad aap login kar sakenge.",
        user:
          getSafeUser(user),
      });
    }

    /*
     * Admin account
     */

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. You can login now.",
      user:
        getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    if (
      error?.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Registration failed.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

const login = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const cleanEmail =
      normalizeEmail(email);

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "Password is required.",
      });
    }

    /*
     * ------------------------------------------------------
     * CHECK 30 SECOND LOCK
     * ------------------------------------------------------
     */

    if (
      isLoginLocked(cleanEmail)
    ) {
      const remainingSeconds =
        getRemainingLockSeconds(
          cleanEmail
        );

      return res
        .status(429)
        .json({
          success: false,
          message:
            `Too many login attempts. Please try again after ${remainingSeconds} seconds.`,
          retryAfter:
            remainingSeconds,
          maxAttempts:
            MAX_LOGIN_ATTEMPTS,
        });
    }

    /*
     * ------------------------------------------------------
     * FIND USER
     * ------------------------------------------------------
     */

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select("+password");

    /*
     * ------------------------------------------------------
     * USER NOT FOUND
     * ------------------------------------------------------
     */

    if (!user) {
      const failed =
        recordFailedLogin(
          cleanEmail
        );

      if (failed.locked) {
        return res
          .status(429)
          .json({
            success: false,
            message:
              "Too many login attempts. Please try again after 30 seconds.",
            retryAfter:
              failed.remainingSeconds,
            maxAttempts:
              MAX_LOGIN_ATTEMPTS,
          });
      }

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
        attemptsRemaining:
          MAX_LOGIN_ATTEMPTS -
          failed.attempts,
      });
    }

    /*
     * ------------------------------------------------------
     * PENDING USER
     * ------------------------------------------------------
     */

    if (
      user.status ===
      "pending"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Registration successful, but your account is waiting for admin approval.",
      });
    }

    /*
     * ------------------------------------------------------
     * REJECTED USER
     * ------------------------------------------------------
     */

    if (
      user.status ===
      "rejected"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account registration has been rejected.",
      });
    }

    /*
     * ------------------------------------------------------
     * ONLY ACTIVE USERS
     * ------------------------------------------------------
     */

    if (
      user.status !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not active.",
      });
    }

    /*
     * ------------------------------------------------------
     * PASSWORD CHECK
     * ------------------------------------------------------
     */

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    /*
     * ------------------------------------------------------
     * WRONG PASSWORD
     * ------------------------------------------------------
     */

    if (!isPasswordValid) {
      const failed =
        recordFailedLogin(
          cleanEmail
        );

      if (failed.locked) {
        console.warn(
          "LOGIN LOCKED FOR 30 SECONDS:",
          cleanEmail
        );

        return res
          .status(429)
          .json({
            success: false,
            message:
              "Too many login attempts. Please try again after 30 seconds.",
            retryAfter:
              failed.remainingSeconds,
            maxAttempts:
              MAX_LOGIN_ATTEMPTS,
          });
      }

      console.warn(
        "INVALID PASSWORD:",
        cleanEmail,
        "ATTEMPTS:",
        failed.attempts
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
        attemptsRemaining:
          MAX_LOGIN_ATTEMPTS -
          failed.attempts,
      });
    }

    /*
     * ------------------------------------------------------
     * SUCCESSFUL LOGIN
     * ------------------------------------------------------
     *
     * Reset failed attempts.
     */

    resetLoginAttempts(
      cleanEmail
    );

    const tokenVersion =
      Number(
        user.tokenVersion ?? 0
      );

    const token =
      generateToken(
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
      message:
        "Login successful.",
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
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PROFILE
|--------------------------------------------------------------------------
*/

const getProfile = async (
  req,
  res
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const user =
      await User.findById(
        req.user._id
      )
        .select(
          "_id name email role status tokenVersion"
        )
        .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (
      user.status !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Account is not active.",
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
      message:
        "Failed to fetch profile.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PENDING USERS
|--------------------------------------------------------------------------
*/

const getPendingUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find({
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

    console.log(
      "PENDING USERS COUNT:",
      users.length
    );

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

/*
|--------------------------------------------------------------------------
| APPROVE USER
|--------------------------------------------------------------------------
*/

const approveUser = async (
  req,
  res
) => {
  try {
    const userId =
      req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (
      user.role === "admin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Admin account does not require approval.",
      });
    }

    if (
      user.status === "active"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "User is already approved.",
        user:
          getSafeUser(user),
      });
    }

    /*
     * Approve normal user.
     */

    user.status = "active";

    user.tokenVersion =
      Number(
        user.tokenVersion ?? 0
      ) + 1;

    await user.save();

    console.log(
      "USER APPROVED:",
      user.email
    );

    return res.status(200).json({
      success: true,
      message:
        "User approved successfully. User can now login.",
      user:
        getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "APPROVE USER ERROR:",
      error
    );

    if (
      error?.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve user.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| REJECT USER
|--------------------------------------------------------------------------
*/

const rejectUser = async (
  req,
  res
) => {
  try {
    const userId =
      req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    /*
     * Admin account cannot be rejected.
     */

    if (
      user.role === "admin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Admin account cannot be rejected.",
      });
    }

    const userEmail =
      user.email;

    /*
     * Permanently delete user.
     */

    await User.deleteOne({
      _id: user._id,
    });

    /*
     * Also reset login attempts
     * for this email.
     */

    resetLoginAttempts(
      userEmail
    );

    console.log(
      "USER REJECTED AND DELETED:",
      userEmail
    );

    return res.status(200).json({
      success: true,
      message:
        "User rejected and removed successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "REJECT USER ERROR:",
      error
    );

    if (
      error?.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject and remove user.",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getPendingUsers,
  approveUser,
  rejectUser,
  generateToken,
};