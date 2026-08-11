const express = require("express");
const router = express.Router();

const notifController = require(
    "../controllers/notificationController"
);

const {
    verifyToken
} = require(
    "../middlewares/authMiddleware"
);

const Notification = require("../models/notificationModel");

/*
|--------------------------------------------------------------------------
| Lấy số thông báo chưa đọc (dùng cho bell badge)
|--------------------------------------------------------------------------
*/

router.get(
    "/unread-count",
    verifyToken,
    (req, res) => {
        Notification.getUnreadCount(req.user.id, (err, count) => {
            if (err) return res.status(500).json({ success: false, count: 0 });
            return res.status(200).json({ success: true, count });
        });
    }
);

/*
|--------------------------------------------------------------------------
| Lấy thông báo mới nhất (dùng cho dropdown bell)
|--------------------------------------------------------------------------
*/

router.get(
    "/latest",
    verifyToken,
    (req, res) => {
        const limit = Math.min(10, parseInt(req.query.limit, 10) || 5);
        Notification.getLatestUnread(req.user.id, limit, (err, rows) => {
            if (err) return res.status(500).json({ success: false, notifications: [] });
            return res.status(200).json({ success: true, notifications: rows || [] });
        });
    }
);

/*
|--------------------------------------------------------------------------
| Lấy danh sách thông báo
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    verifyToken,
    notifController.getUserNotifications
);

/*
|--------------------------------------------------------------------------
| Đánh dấu tất cả đã đọc
|--------------------------------------------------------------------------
*/

router.put(
    "/read-all",
    verifyToken,
    notifController.readAllNotifications
);

router.patch(
    "/read-all",
    verifyToken,
    notifController.readAllNotifications
);

/*
|--------------------------------------------------------------------------
| Xóa toàn bộ thông báo
|--------------------------------------------------------------------------
*/

router.delete(
    "/clear-all",
    verifyToken,
    notifController.cleanAllNotifications
);

/*
|--------------------------------------------------------------------------
| Đánh dấu một thông báo đã đọc
|--------------------------------------------------------------------------
*/

router.put(
    "/:id/read",
    verifyToken,
    notifController.readNotification
);

router.patch(
    "/:id/read",
    verifyToken,
    notifController.readNotification
);

/*
|--------------------------------------------------------------------------
| Xóa một thông báo
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    verifyToken,
    notifController.removeNotification
);

module.exports = router;