const express = require("express");

const {
  getPendingUsers,
  approveUser,
  rejectUser,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

router.get(
  "/pending",
  protect,
  adminOnly,
  getPendingUsers
);

router.put(
  "/approve/:id",
  protect,
  adminOnly,
  approveUser
);

router.put(
  "/reject/:id",
  protect,
  adminOnly,
  rejectUser
);

module.exports = router;