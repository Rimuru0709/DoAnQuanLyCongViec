const express = require("express");
const router = express.Router();

const {
    getAllTasks,
    getTasksByProject,
    getTasksGantt,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus
} = require("../controllers/taskController");

const {
    verifyToken,
    allowRoles
} = require("../middlewares/authMiddleware");

// Tất cả tài khoản đã đăng nhập
router.get(
    "/",
    verifyToken,
    getAllTasks
);

router.get(
    "/project/:projectId",
    verifyToken,
    getTasksByProject
);

// Gantt data (tasks + dependencies + checklist counts)
router.get(
    "/project/:projectId/gantt",
    verifyToken,
    getTasksGantt
);

// Chỉ ADMIN và MANAGER
router.post(
    "/",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    addTask
);

router.put(
    "/:id",
    verifyToken,
    updateTask
);

router.delete(
    "/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    deleteTask
);

// MEMBER được cập nhật trạng thái công việc được giao
router.patch(
    "/:id/status",
    verifyToken,
    updateTaskStatus
);

module.exports = router;