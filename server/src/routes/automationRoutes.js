const express  = require("express");
const router   = express.Router();
const { verifyToken, allowRoles } = require("../middlewares/authMiddleware");
const AutomationModel = require("../models/automationModel");
const TaskModel       = require("../models/taskModel");

/* ─────────────────────────────────────────────────────────
   AUTOMATION RULES
───────────────────────────────────────────────────────── */

/* GET /api/automation/:projectId — lấy rules của project */
router.get("/:projectId", verifyToken, (req, res) => {
    AutomationModel.getByProject(req.params.projectId, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.json({ success: true, rules: rows || [] });
    });
});

/* POST /api/automation — tạo rule mới */
router.post("/", verifyToken, allowRoles("ADMIN", "MANAGER"), (req, res) => {
    const data = { ...req.body, created_by: req.user.id };
    AutomationModel.create(data, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.status(201).json({ success: true, id: result.insertId, message: "Đã tạo quy tắc tự động hóa" });
    });
});

/* PUT /api/automation/:id — cập nhật rule */
router.put("/:id", verifyToken, allowRoles("ADMIN", "MANAGER"), (req, res) => {
    AutomationModel.update(req.params.id, req.body, (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.json({ success: true, message: "Đã cập nhật quy tắc" });
    });
});

/* PATCH /api/automation/:id/toggle — bật/tắt */
router.patch("/:id/toggle", verifyToken, allowRoles("ADMIN", "MANAGER"), (req, res) => {
    const { is_active } = req.body;
    AutomationModel.toggle(req.params.id, is_active, (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.json({ success: true, message: is_active ? "Đã bật quy tắc" : "Đã tắt quy tắc" });
    });
});

/* DELETE /api/automation/:id — xóa */
router.delete("/:id", verifyToken, allowRoles("ADMIN", "MANAGER"), (req, res) => {
    AutomationModel.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.json({ success: true, message: "Đã xóa quy tắc" });
    });
});

/* ─────────────────────────────────────────────────────────
   TASK DEPENDENCIES
───────────────────────────────────────────────────────── */

/* GET /api/automation/task/:taskId/dependencies */
router.get("/task/:taskId/dependencies", verifyToken, (req, res) => {
    const { taskId } = req.params;
    TaskModel.getDependenciesOfTask(taskId, (err, deps) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        TaskModel.getBlockedByTask(taskId, (err2, blocked) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });
            return res.json({ success: true, dependencies: deps || [], blockedBy: blocked || [] });
        });
    });
});

/* GET /api/automation/task/:taskId/project-tasks — tasks cùng project (dropdown) */
router.get("/task/:taskId/project-tasks", verifyToken, (req, res) => {
    const { taskId } = req.params;
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, message: "Thiếu projectId" });
    TaskModel.getTasksForProject(projectId, taskId, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.json({ success: true, tasks: rows || [] });
    });
});

/* POST /api/automation/task/dependency — thêm dependency */
router.post("/task/dependency", verifyToken, allowRoles("ADMIN", "MANAGER"), (req, res) => {
    const { task_id, depends_on_task_id } = req.body;
    if (!task_id || !depends_on_task_id) {
        return res.status(400).json({ success: false, message: "Thiếu task_id hoặc depends_on_task_id" });
    }
    TaskModel.addDependency(task_id, depends_on_task_id, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        return res.status(201).json({ success: true, message: "Đã thêm phụ thuộc công việc" });
    });
});

/* DELETE /api/automation/task/dependency — xóa dependency */
router.delete("/task/dependency", verifyToken, allowRoles("ADMIN", "MANAGER"), (req, res) => {
    const { task_id, depends_on_task_id } = req.body;
    TaskModel.removeDependency(task_id, depends_on_task_id, (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        return res.json({ success: true, message: "Đã xóa phụ thuộc công việc" });
    });
});

module.exports = router;
