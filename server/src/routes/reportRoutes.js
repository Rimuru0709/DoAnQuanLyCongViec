const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verifyToken } = require("../middlewares/authMiddleware"); 

// API: Lấy toàn bộ dữ liệu báo cáo (Đã được bảo vệ bằng Token)
router.get("/dashboard", verifyToken, reportController.getDashboardReport);

module.exports = router;