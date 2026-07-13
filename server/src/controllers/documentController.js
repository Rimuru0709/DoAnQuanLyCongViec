const multer = require("multer");
const fs = require("fs").promises; 
const fsSync = require("fs");      
const path = require("path");

const DocumentModel = require("../models/documentModel");

// Khởi tạo thư mục upload
const uploadDir = path.join(__dirname, "../../uploads/documents");
if (!fsSync.existsSync(uploadDir)) {
    fsSync.mkdirSync(uploadDir, { recursive: true });
}

// Giải mã đặt tên file
const decodeFileName = (fileName) => {
    try { return Buffer.from(fileName, "latin1").toString("utf8"); } 
    catch { return fileName; }
};

// Cấu hình Multer
const storage = multer.diskStorage({
    destination: (req, file, callback) => callback(null, uploadDir),
    filename: (req, file, callback) => {
        const originalName = decodeFileName(file.originalname);
        const safeName = originalName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");
        callback(null, `${Date.now()}-${safeName}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const allowedExtensions = new Set([".jpeg", ".jpg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".rar"]);
        const originalName = decodeFileName(file.originalname);
        const extension = path.extname(originalName).toLowerCase();
        if (allowedExtensions.has(extension)) return callback(null, true);
        callback(new Error("Định dạng file không được hỗ trợ"));
    }
}).single("document");

const runUploadMiddleware = (req, res) => {
    return new Promise((resolve, reject) => {
        upload(req, res, (err) => { if (err) reject(err); else resolve(); });
    });
};

const getNextVersionString = (lastVersion) => {
    if (!lastVersion) return "v1.0";
    const number = Number.parseFloat(String(lastVersion).replace("v", ""));
    return `v${(Number.isFinite(number) ? number + 1 : 2).toFixed(1)}`;
};


// 1. Lấy danh sách tài liệu theo mã dự án
const getDocumentsByProject = async (req, res) => {
    try {
        const projectId = Number(req.params.projectId);
        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({ success: false, message: "Mã dự án không hợp lệ" });
        }

        // GỌI THẲNG AWAIT (Bỏ bọc new Promise thủ công cũ)
        const results = await DocumentModel.getByProject(projectId);
        return res.status(200).json(results);
    } catch (error) {
        console.error("Lỗi lấy tài liệu:", error);
        return res.status(500).json({ success: false, message: "Không thể lấy danh sách tài liệu", error: error.message });
    }
};

// 2. Upload tài liệu mới
const uploadDocument = async (req, res) => {
    try {
        await runUploadMiddleware(req, res);
        if (!req.file) return res.status(400).json({ success: false, message: "Vui lòng chọn tài liệu" });

        const projectId = Number(req.body.project_id);
        if (!Number.isInteger(projectId) || projectId <= 0) {
            if (fsSync.existsSync(req.file.path)) await fs.unlink(req.file.path);
            return res.status(400).json({ success: false, message: "Mã dự án không hợp lệ" });
        }

        const originalName = decodeFileName(req.file.originalname);
        const fileType = path.extname(originalName).replace(".", "").toUpperCase();
        const uploader = req.user?.full_name || req.body.uploaded_by || "Không rõ";

        // GỌI THẲNG AWAIT
        const versionResult = await DocumentModel.getLatestVersion(projectId, originalName);
        const newVersion = versionResult && versionResult.length > 0 ? getNextVersionString(versionResult[0].version) : "v1.0";

        const documentData = {
            project_id: projectId,
            file_name: originalName,
            file_path: `uploads/documents/${req.file.filename}`,
            file_type: fileType || "FILE",
            file_size: req.file.size,
            uploaded_by: uploader,
            version: newVersion
        };

        // GỌI THẲNG AWAIT
        const result = await DocumentModel.createDocument(documentData);

        return res.status(201).json({
            success: true,
            message: "Tải tài liệu lên thành công",
            document: { id: result.insertId, ...documentData }
        });
    } catch (error) {
        if (req.file && fsSync.existsSync(req.file.path)) await fs.unlink(req.file.path).catch(() => {});
        console.error("Lỗi Upload Document:", error);
        return res.status(500).json({ success: false, message: error.message || "Không thể upload tài liệu" });
    }
};

// 3. Xóa tài liệu
const deleteDocument = async (req, res) => {
    try {
        const documentId = Number(req.params.id);
        if (!Number.isInteger(documentId) || documentId <= 0) {
            return res.status(400).json({ success: false, message: "Mã tài liệu không hợp lệ" });
        }

        // GỌI THẲNG AWAIT
        const results = await DocumentModel.getById(documentId);
        if (!results || results.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài liệu" });

        const document = results[0];
        const filePath = path.join(__dirname, "../../", String(document.file_path).replace(/^\/+/, ""));

        // GỌI THẲNG AWAIT
        const deleteResult = await DocumentModel.deleteById(documentId);
        if (deleteResult.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài liệu" });

        if (fsSync.existsSync(filePath)) {
            await fs.unlink(filePath).catch(err => console.error("Không thể xóa file vật lý:", err));
        }

        return res.status(200).json({ success: true, message: "Xóa tài liệu thành công" });
    } catch (error) {
        console.error("Lỗi xóa tài liệu:", error);
        return res.status(500).json({ success: false, message: "Không thể xóa tài liệu", error: error.message });
    }
};

// 4. Download tài liệu
const downloadDocument = async (req, res) => {
    try {
        const documentId = Number(req.params.id);
        // GỌI THẲNG AWAIT
        const results = await DocumentModel.getById(documentId);
        if (!results || results.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài liệu" });

        const document = results[0];
        const filePath = path.join(__dirname, "../../", String(document.file_path).replace(/^\/+/, ""));

        if (!fsSync.existsSync(filePath)) return res.status(404).json({ success: false, message: "File không tồn tại trên server" });
        return res.download(filePath, document.file_name);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Không thể tải tài liệu", error: error.message });
    }
};

// 5. Lấy thông số dung lượng hệ thống
const getStorageStats = async (req, res) => {
    try {
        const storageData = await DocumentModel.getStorageSize();
        const totalUsedBytes = storageData[0]?.totalSize || 0;
        const maxStorageBytes = 100 * 1024 * 1024; // 100 MB

        return res.status(200).json({
            success: true,
            usedSize: totalUsedBytes, 
            maxSize: maxStorageBytes,
            percentage: Math.min(((totalUsedBytes / maxStorageBytes) * 100), 100).toFixed(1)
        });
    } catch (error) {
        console.error("Lỗi lấy thông số dung lượng:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getDocumentsByProject,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getStorageStats 
};