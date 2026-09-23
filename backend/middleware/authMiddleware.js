const jwt = require("jsonwebtoken");
const User = require("../models/User");

require("dotenv").config();

const JWT_SECRET = String(
  process.env.JWT_SECRET || ""
).trim();

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing in environment variables."
  );
}

const protect = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const token = authHeader
      .slice(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        JWT_SECRET
      );
    } catch (jwtError) {
      console.error(
        "JWT VERIFY ERROR:",
        jwtError.name
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token.",
      });
    }

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

    const user =
      await User.findById(
        decoded.id
      )
        .select(
          "_id name email role status tokenVersion"
        )
        .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token.",
      });
    }

    const tokenVersion = Number(
      decoded.tokenVersion ?? 0
    );

    const currentTokenVersion =
      Number(
        user.tokenVersion ?? 0
      );

    if (
      tokenVersion !==
      currentTokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token.",
      });
    }

    if (
      user.status !==
      "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Account is not active.",
      });
    }

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