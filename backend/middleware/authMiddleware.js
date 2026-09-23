const jwt = require("jsonwebtoken");
const User = require("../models/User");

require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing in environment variables."
  );
}

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const protect = async (
  req,
  res,
  next
) => {
  try {
    // -------------------------------------------------
    // AUTHORIZATION HEADER
    // -------------------------------------------------

    const authHeader =
      req.headers.authorization;

    console.log(
      "AUTH HEADER:",
      authHeader
        ? "RECEIVED"
        : "MISSING"
    );

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // TOKEN
    // -------------------------------------------------

    const token =
      authHeader
        .slice(7)
        .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    console.log(
      "JWT TOKEN RECEIVED:",
      "YES"
    );

    // -------------------------------------------------
    // VERIFY TOKEN
    // -------------------------------------------------

    let decoded;

    try {
      decoded =
        jwt.verify(
          token,
          JWT_SECRET
        );

      console.log(
        "JWT VERIFY:",
        "SUCCESS"
      );

      console.log(
        "JWT USER ID:",
        decoded?.id
      );

      console.log(
        "JWT TOKEN VERSION:",
        decoded?.tokenVersion
      );
    } catch (jwtError) {
      console.error(
        "JWT VERIFY ERROR:",
        jwtError.name
      );

      console.error(
        "JWT VERIFY MESSAGE:",
        jwtError.message
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token.",
      });
    }

    // -------------------------------------------------
    // DECODED DATA CHECK
    // -------------------------------------------------

    if (
      !decoded ||
      !decoded.id
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token.",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user =
      await User.findById(
        decoded.id
      )
        .select(
          "_id name email role status tokenVersion"
        )
        .lean();

    if (!user) {
      console.error(
        "AUTH USER NOT FOUND:",
        decoded.id
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token.",
      });
    }

    console.log(
      "AUTH USER FOUND:",
      user.email
    );

    // -------------------------------------------------
    // TOKEN VERSION
    // -------------------------------------------------

    const tokenVersion =
      Number(
        decoded.tokenVersion ?? 0
      );

    const currentTokenVersion =
      Number(
        user.tokenVersion ?? 0
      );

    console.log(
      "TOKEN VERSION:",
      tokenVersion
    );

    console.log(
      "DB TOKEN VERSION:",
      currentTokenVersion
    );

    if (
      tokenVersion !==
      currentTokenVersion
    ) {
      console.error(
        "TOKEN VERSION MISMATCH"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token.",
      });
    }

    // -------------------------------------------------
    // USER STATUS
    // -------------------------------------------------

    if (
      user.status !==
      "active"
    ) {
      console.error(
        "USER STATUS:",
        user.status
      );

      return res.status(403).json({
        success: false,
        message:
          "Account is not active.",
      });
    }

    // -------------------------------------------------
    // ATTACH USER
    // -------------------------------------------------

    req.user = {
      _id: user._id,

      id: user._id,

      name: user.name,

      email: user.email,

      role: user.role,

      status: user.status,

      tokenVersion:
        currentTokenVersion,
    };

    console.log(
      "AUTH SUCCESS:",
      user.email
    );

    next();
  } catch (error) {
    console.error(
      "AUTH MIDDLEWARE ERROR:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token.",
    });
  }
};

module.exports = protect;