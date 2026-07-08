const express = require("express");
const router = express.Router();

const {
    getProjects,
    getArchivedProjects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    duplicateProject
} = require("../controllers/projectController");

router.get("/", getProjects);

router.get("/archived", getArchivedProjects);

router.get("/:id", getProjectById);

router.post("/", addProject);

router.put("/:id", updateProject);

router.put("/:id/archive", archiveProject);

router.put("/:id/restore", restoreProject);

router.post("/:id/duplicate", duplicateProject);

router.delete("/:id", deleteProject);

module.exports = router;