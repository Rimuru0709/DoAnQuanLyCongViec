const express = require("express");
const router = express.Router();

const {
    getDocumentsByProject,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getStorageStats 
} = require("../controllers/documentController");

const {
    verifyToken,
    allowRoles
} = require("../middlewares/authMiddleware");

// 1. Lấy thông số dung lượng bộ nhớ hệ thống (Đưa lên đầu để tránh bị trùng khớp với route động /:projectId)
router.get(
    "/storage/stats",
    verifyToken,
    getStorageStats
);

// 2. Lấy tài liệu của một dự án
router.get(
    "/:projectId",
    verifyToken,
    getDocumentsByProject
);

// 3. Upload tài liệu
router.post(
    "/",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    uploadDocument
);

// 4. Tải tài liệu
router.get(
    "/download/:id",
    verifyToken,
    downloadDocument
);

// 5. Xóa tài liệu
router.delete(
    "/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    deleteDocument
);

module.exports = router;