const express = require("express");
const router = express.Router();

const {
    getTasksByProject,
    addTask
} = require("./taskController");

router.get("/project/:projectId", getTasksByProject);
router.post("/", addTask);

module.exports = router;