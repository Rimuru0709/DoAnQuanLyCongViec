const express = require("express");
const router  = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");

const {
    getTaskDetail,
    getComments,
    addComment,
    deleteComment,
    getChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    logTime,
    getTimeLogs,
    updateEstimatedHours,
    getProjectMembers
} = require("../controllers/taskDetailController");

/* ── Task Detail (full load) ── */
router.get("/:taskId",          verifyToken, getTaskDetail);

/* ── Comments ── */
router.get("/:taskId/comments",           verifyToken, getComments);
router.post("/:taskId/comments",          verifyToken, addComment);
router.delete("/comments/:commentId",     verifyToken, deleteComment);

/* ── Checklist ── */
router.get("/:taskId/checklist",          verifyToken, getChecklist);
router.post("/:taskId/checklist",         verifyToken, addChecklistItem);
router.patch("/checklist/:itemId",        verifyToken, updateChecklistItem);
router.delete("/checklist/:itemId",       verifyToken, deleteChecklistItem);

/* ── Time Tracking ── */
router.get("/:taskId/time-logs",          verifyToken, getTimeLogs);
router.post("/:taskId/log-time",          verifyToken, logTime);
router.patch("/:taskId/estimated-hours",  verifyToken, updateEstimatedHours);

/* ── Project members (for @mention) ── */
router.get("/project/:projectId/members", verifyToken, getProjectMembers);

module.exports = router;
