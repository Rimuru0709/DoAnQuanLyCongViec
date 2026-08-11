const express = require("express");
const router  = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const ActivityModel = require("../models/activityModel");

/*
|--------------------------------------------------------------------------
| GET /api/activities/project/:projectId
| Lấy activity log của một dự án
|--------------------------------------------------------------------------
*/
router.get("/project/:projectId", verifyToken, (req, res) => {
    const { projectId } = req.params;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

    ActivityModel.getByProject(projectId, limit, (err, rows) => {
        if (err) {
            console.error("Lỗi lấy activity log dự án:", err);
            return res.status(500).json({
                success: false,
                message: "Không thể tải nhật ký hoạt động",
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            activities: rows || []
        });
    });
});

/*
|--------------------------------------------------------------------------
| GET /api/activities/task/:taskId
| Lấy activity log của một task
|--------------------------------------------------------------------------
*/
router.get("/task/:taskId", verifyToken, (req, res) => {
    const { taskId } = req.params;

    ActivityModel.getByTask(taskId, (err, rows) => {
        if (err) {
            console.error("Lỗi lấy activity log task:", err);
            return res.status(500).json({
                success: false,
                message: "Không thể tải nhật ký hoạt động",
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            activities: rows || []
        });
    });
});

/*
|--------------------------------------------------------------------------
| GET /api/activities/recent
| Lấy activity log gần đây nhất (ADMIN)
|--------------------------------------------------------------------------
*/
router.get("/recent", verifyToken, (req, res) => {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);

    ActivityModel.getRecent(limit, (err, rows) => {
        if (err) {
            console.error("Lỗi lấy recent activities:", err);
            return res.status(500).json({
                success: false,
                message: "Không thể tải nhật ký hoạt động",
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            activities: rows || []
        });
    });
});

module.exports = router;
