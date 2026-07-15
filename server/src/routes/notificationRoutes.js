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