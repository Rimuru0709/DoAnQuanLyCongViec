const express = require("express");
const router = express.Router();

const {
    getAllTasks,
    getTasksByProject,
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
    allowRoles("ADMIN", "MANAGER"),
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