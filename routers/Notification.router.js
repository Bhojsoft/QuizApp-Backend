const express = require("express");
const router = express.Router();
const {
  getUnseenNotifications,
  markNotificationAsSeen,
} = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/authMiddleware");

router.get("/unseen", authenticate, getUnseenNotifications);
router.post("/view/:notificationId", authenticate, markNotificationAsSeen);

module.exports = router;
