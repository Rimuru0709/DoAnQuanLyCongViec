const express = require("express");
const router = express.Router();

const {
    getDocumentsByProject,
    uploadDocument,
    deleteDocument,
    downloadDocument
} = require("../controllers/documentController");

const {
    verifyToken,
    allowRoles
} = require("../middlewares/authMiddleware");

// Lấy tài liệu của một dự án
router.get(
    "/:projectId",
    verifyToken,
    getDocumentsByProject
);

// Upload tài liệu
router.post(
    "/",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    uploadDocument
);

// Tải tài liệu
router.get(
    "/download/:id",
    verifyToken,
    downloadDocument
);

// Xóa tài liệu
router.delete(
    "/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    deleteDocument
);

module.exports = router;