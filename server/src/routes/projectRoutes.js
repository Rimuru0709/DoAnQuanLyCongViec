const express = require("express");
const router = express.Router();

const {
    getProjects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    duplicateProject
} = require("../controllers/projectController");

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", addProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.put("/:id/archive", archiveProject);
router.post("/:id/duplicate", duplicateProject);

module.exports = router;