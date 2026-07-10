const express = require("express");
const router = express.Router();
const notifController = require("../controllers/notificationController");
// Khớp hoàn toàn với Front-end React
router.get("/", notifController.getUserNotifications);
router.put("/read-all", notifController.readAllNotifications);
router.delete("/clear-all", notifController.cleanAllNotifications);
router.put("/:id/read", notifController.readNotification);
router.delete("/:id", notifController.removeNotification);

module.exports = router;