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

router.get("/", getAllTasks);
router.get("/project/:projectId", getTasksByProject);
router.post("/", addTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/status", updateTaskStatus);

module.exports = router;