const multer = require("multer");
const fs = require("fs");
const path = require("path");
const DocumentModel = require("../models/documentModel");

// Khởi tạo và kiểm tra thư mục lưu trữ file
const uploadDir = path.join(__dirname, "../../uploads/documents");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// 1. CẤU HÌNH MULTER STORAGE & FILTER
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sửa lỗi hiển thị sai font Tiếng Việt có dấu khi upload từ Client
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
        const uniqueName = Date.now() + "-" + originalName;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB chống tràn ổ đĩa
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar/;
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
        const ext = path.extname(originalName).toLowerCase();
        
        if (allowedExtensions.test(ext)) {
            return cb(null, true);
        }
        cb(new Error("Định dạng file không được hỗ trợ! Chỉ nhận PDF, Word, Excel, Ảnh, Zip, Powerpoint."));
    }
}).single("file"); // "file" khớp hoàn toàn với thuộc tính append ở Front-end React

// Hàm tự động tăng tiến phiên bản (v1.0 -> v2.0 -> v3.0...)
const getNextVersionString = (lastVersion) => {
    if (!lastVersion) return "v1.0";
    const currentVersionNum = parseFloat(lastVersion.replace("v", "")) || 1.0;
    return `v${(currentVersionNum + 1.0).toFixed(1)}`;
};

// Hàm bổ trợ chuyển đổi định dạng dữ liệu MySQL sang chuẩn React Client yêu cầu
const mapToFrontend = (results) => {
    return results.map(doc => {
        const sizeInMB = doc.file_size ? (Number(doc.file_size) / (1024 * 1024)).toFixed(2) : "0.00";
        return {
            id: doc.id,
            name: doc.file_name,
            size: sizeInMB, 
            type: doc.file_type || "unknown",
            uploader: doc.uploaded_by || "Ẩn danh",
            url: doc.file_path,
            version: doc.version,
            date: doc.created_at ? new Date(doc.created_at).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")
        };
    });
};

// ==========================================
// 2. CÁC HÀM XỬ LÝ LOGIC NGHIỆP VỤ (CONTROLLERS)
// ==========================================

// [GET] Lấy danh sách tài liệu (Hỗ trợ lọc theo project_id qua query params)
const getAllDocuments = (req, res) => {
    const { projectId } = req.query;

    if (projectId) {
        DocumentModel.getByProject(projectId, (err, results) => {
            if (err) return res.status(500).json({ message: "Lỗi hệ thống khi lấy tài liệu theo dự án", error: err });
            return res.status(200).json(mapToFrontend(results));
        });
    } else {
        const sql = "SELECT * FROM documents ORDER BY id DESC";
        const db = require("../config/db");
        db.query(sql, [], (err, results) => {
            if (err) return res.status(500).json({ message: "Lỗi hệ thống khi lấy toàn bộ tài liệu", error: err });
            return res.status(200).json(mapToFrontend(results));
        });
    }
};

// [POST] Xử lý Upload file an toàn kết hợp tăng tiến Version
const uploadDocument = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || "Lỗi trong quá trình upload file" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Chưa chọn file hoặc file sai định dạng" });
        }

        const projectId = req.body.project_id || 1; 
        const uploader = req.body.uploader || "Thành viên nhóm";
        const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
        const fileType = path.extname(originalName).replace(".", "").toUpperCase();

        // Kiểm tra phiên bản cũ nhất của tài liệu này trong cùng một dự án để xử lý ghi đè/tăng version
        DocumentModel.getLatestVersion(projectId, originalName, (dbErr, versionResult) => {
            if (dbErr) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Xóa file rác cô lập hệ thống
                return res.status(500).json({ message: "Lỗi kết nối database kiểm tra version", error: dbErr });
            }

            let newVersion = "v1.0";
            if (versionResult && versionResult.length > 0) {
                newVersion = getNextVersionString(versionResult[0].version);
            }

            const documentData = {
                project_id: projectId,
                file_name: originalName,
                file_path: `/uploads/documents/${req.file.filename}`,
                file_type: fileType,
                file_size: req.file.size, // Lưu trữ dạng BIGINT (Bytes) xuống Database
                uploaded_by: uploader,
                version: newVersion
            };

            DocumentModel.createDocument(documentData, (createErr, result) => {
                if (createErr) {
                    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Xóa file rác
                    return res.status(500).json({ message: "Lỗi lưu thông tin tài liệu", error: createErr });
                }

                res.status(201).json({
                    message: "Tải tài liệu lên thành công!",
                    id: result.insertId,
                    ...documentData,
                    size: (documentData.file_size / (1024 * 1024)).toFixed(2) // Trả về dạng MB lập tức cho Client cập nhật UI
                });
            });
        });
    });
};

// [DELETE] Xóa tài liệu khỏi database và dọn sạch file vật lý trong ổ đĩa
const deleteDocument = (req, res) => {
    const { id } = req.params;

    DocumentModel.getById(id, (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi truy vấn tìm file", error: err });

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu trên hệ thống" });
        }

        // Định vị chính xác file nằm trong thư mục gốc dự án để thực hiện xóa sạch
        const filePath = path.join(__dirname, "../../", result[0].file_path);

        DocumentModel.deleteById(id, (deleteErr) => {
            if (deleteErr) return res.status(500).json({ message: "Không thể xóa bản ghi dữ liệu", error: deleteErr });

            // Tiến hành xóa file vật lý nếu tồn tại trên máy chủ
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.status(200).json({ message: "Xóa tài liệu và tệp tin thành công hoàn toàn!" });
        });
    });
};

// [GET] Tải file về (Download File trực tiếp)
const downloadDocument = (req, res) => {
    const { id } = req.params;

    DocumentModel.getById(id, (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi kết nối tải dữ liệu", error: err });
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Tài liệu yêu cầu không tồn tại" });
        }

        const filePath = path.join(__dirname, "../../", result[0].file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Tệp tin đính kèm không tồn tại trên hệ thống lưu trữ máy chủ" });
        }

        res.download(filePath, result[0].file_name);
    });
};

module.exports = {
    getAllDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument
};