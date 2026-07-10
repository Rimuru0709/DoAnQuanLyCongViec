const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// API: Lấy toàn bộ dữ liệu báo cáo (Tổng quan + Dự án + Biểu đồ định dạng file)
router.get("/dashboard", reportController.getDashboardReport);

module.exports = router;