const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Document = require("../models/documentModel");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
        const uniqueName = Date.now() + "-" + originalName;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage }).single("document");

const getNextVersion = (lastVersion) => {
    if (!lastVersion) return "v1.0";

    const numberPart = lastVersion.replace("v1.", "");
    const versionNumber = Number(numberPart);

    if (isNaN(versionNumber)) return "v1.0";

    return `v1.${versionNumber + 1}`;
};

const uploadDocument = (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).json(err);

        if (!req.file) {
            return res.status(400).json({ message: "Chưa chọn file" });
        }

        const { project_id, uploaded_by } = req.body;

        const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
        const fileType = path.extname(originalName).replace(".", "").toUpperCase();

        Document.getLatestVersion(project_id, originalName, (err, versionResult) => {
            if (err) return res.status(500).json(err);

            let newVersion = "v1.0";

            if (versionResult.length > 0) {
                newVersion = getNextVersion(versionResult[0].version);
            }

            const documentData = {
                project_id,
                file_name: originalName,
                file_path: `uploads/${req.file.filename}`,
                file_type: fileType,
                file_size: req.file.size,
                uploaded_by: uploaded_by || "Không rõ",
                version: newVersion
            };

            Document.createDocument(documentData, (err, result) => {
                if (err) return res.status(500).json(err);

                res.json({
                    message: "Tải tài liệu thành công",
                    id: result.insertId,
                    version: newVersion
                });
            });
        });
    });
};

const getDocumentsByProject = (req, res) => {
    const { projectId } = req.params;

    Document.getByProject(projectId, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

const deleteDocument = (req, res) => {
    const { id } = req.params;

    Document.getById(id, (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu" });
        }

        const filePath = path.join(__dirname, "../../", result[0].file_path);

        Document.deleteById(id, (err) => {
            if (err) return res.status(500).json(err);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.json({ message: "Xóa tài liệu thành công" });
        });
    });
};

module.exports = {
    uploadDocument,
    getDocumentsByProject,
    deleteDocument
};