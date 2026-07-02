const express = require("express");
const router = express.Router();

const {
    getTasksByProject,
    addTask,
    updateTask,
    deleteTask
} = require("./taskController");

router.get("/project/:projectId", getTasksByProject);
router.post("/", addTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;