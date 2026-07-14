const express = require("express");
const router = express.Router();
const notifController = require("../controllers/notificationController");
const auth = require("../middlewares/authMiddleware");

// Lấy danh sách thông báo (Phân trang + Bộ lọc)
router.get("/", notifController.getUserNotifications);

// Đánh dấu đọc tất cả thông báo
router.put("/read-all", notifController.readAllNotifications);

// Xóa sạch toàn bộ hòm thư thông báo
router.delete("/clear-all", notifController.cleanAllNotifications);

// Đánh dấu đã đọc một thông báo cụ thể
router.put("/:id/read", notifController.readNotification);

// Xóa một thông báo cụ thể
router.delete("/:id", notifController.removeNotification);

module.exports = router;