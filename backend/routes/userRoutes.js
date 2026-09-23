const express = require("express");

const {
  getPendingUsers,
  approveUser,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// ADMIN AUTHORIZATION MIDDLEWARE
// =====================================================

const adminOnly = (req, res, next) => {
  // ---------------------------------------------------
  // User must already be authenticated
  // ---------------------------------------------------

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  // ---------------------------------------------------
  // Only admin can access these routes
  // ---------------------------------------------------

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Admin access required.",
    });
  }

  next();
};

// =====================================================
// ADMIN USER APPROVAL ROUTES
// =====================================================

// -----------------------------------------------------
// Get all pending users
// -----------------------------------------------------

router.get(
  "/pending",
  protect,
  adminOnly,
  getPendingUsers
);

// -----------------------------------------------------
// Approve pending user
// -----------------------------------------------------

router.put(
  "/approve/:id",
  protect,
  adminOnly,
  approveUser
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;