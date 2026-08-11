const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Dashboard tổng quan
router.get("/dashboard",      verifyToken, reportController.getDashboardReport);

// Khối lượng công việc theo thành viên
router.get("/workload",       verifyToken, reportController.getWorkloadReport);

// Thống kê Estimated vs Actual Hours
router.get("/time-tracking",  verifyToken, reportController.getTimeTrackingReport);

// Bottleneck — task quá hạn lâu nhất
router.get("/bottleneck",     verifyToken, reportController.getBottleneckReport);

module.exports = router;