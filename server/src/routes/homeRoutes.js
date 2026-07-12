const express = require("express");

const router = express.Router();

const {
    getHomeData
} = require(
    "../controllers/homeController"
);

const {
    verifyToken
} = require(
    "../middlewares/authMiddleware"
);

/*
|--------------------------------------------------------------------------
| Lấy dữ liệu trang Tổng quan
|--------------------------------------------------------------------------
|
| ADMIN:
| - Xem toàn bộ hệ thống.
|
| MANAGER:
| - Xem dự án được tạo hoặc tham gia.
|
| MEMBER:
| - Xem dự án tham gia và task được giao.
|
*/

router.get(
    "/",
    verifyToken,
    getHomeData
);

module.exports = router;