const express = require("express");
const router = express.Router();
const docController = require("../controllers/documentController");


router.post("/upload", docController.uploadDocument);

// Lấy danh sách tài liệu dựa theo ID của dự án
router.get("/project/:projectId", (req, res) => {
    req.query.projectId = req.params.projectId;
    docController.getAllDocuments(req, res);
});

// Xóa tài liệu khỏi hệ thống
router.delete("/:id", docController.deleteDocument);

// Cho phép Client click tải tài liệu về máy tính trực tiếp
router.get("/download/:id", docController.downloadDocument);

module.exports = router;