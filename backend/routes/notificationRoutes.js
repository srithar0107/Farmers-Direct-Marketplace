const express = require("express");
const Notification = require("../models/Notification");
const { sendSmsAlert } = require("../services/smsService");
const { protect, allow } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// GET notifications for logged in farmer
router.get("/", allow("farmer", "admin"), async (req, res) => {
  try {
    const notifications = await Notification.find({ farmer: req.user.id })
      .populate("product", "name category price quantity unit availability")
      .sort("-createdAt")
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      farmer: req.user.id,
      read: false
    });

    res.json({
      unreadCount,
      notifications
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load notifications", error: err.message });
  }
});

// MARK single notification as read
router.put("/:id/read", allow("farmer", "admin"), async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification", error: err.message });
  }
});

// MARK ALL notifications as read
router.put("/read-all", allow("farmer", "admin"), async (req, res) => {
  try {
    await Notification.updateMany({ farmer: req.user.id, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all as read", error: err.message });
  }
});

// TEST ALERT: Verify SMS service and in-app alert delivery
router.post("/test-alert", allow("farmer", "admin"), async (req, res) => {
  try {
    const User = require("../models/User");
    const farmer = await User.findById(req.user.id);

    const record = await sendSmsAlert({
      farmer,
      alertType: "low_stock",
      title: "Test Stock Alert",
      message: `Stock Alert: This is a test notification for Farmers Direct Marketplace. Your SMS & in-app alerts are active!`,
      phone: farmer.phone
    });

    res.json({
      message: "Test alert triggered successfully!",
      smsStatus: record?.smsStatus || "PENDING_PROVIDER",
      smsProvider: record?.smsProvider || "In-App Only",
      notification: record
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to trigger test alert", error: err.message });
  }
});

module.exports = router;
