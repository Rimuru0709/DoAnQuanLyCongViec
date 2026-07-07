const db = require("../config/db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "../../Uploads");

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

const uploadDocument = (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).json(err);

        if (!req.file) {
            return res.status(400).json({ message: "Chưa chọn file" });
        }

        const { project_id, uploaded_by } = req.body;

        const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
        const fileType = path.extname(originalName).replace(".", "").toUpperCase();

        const versionSql = `
            SELECT version
            FROM documents
            WHERE project_id = ? AND file_name = ?
            ORDER BY id DESC
            LIMIT 1
        `;

        db.query(versionSql, [project_id, originalName], (err, versionResult) => {
            if (err) return res.status(500).json(err);

            let newVersion = "v1.0";

            if (versionResult.length > 0) {
                const lastVersion = versionResult[0].version || "v1.0";
                const numberPart = lastVersion.replace("v1.", "");
                const versionNumber = Number(numberPart);

                if (!isNaN(versionNumber)) {
                    newVersion = `v1.${versionNumber + 1}`;
                }
            }

            const sql = `
                INSERT INTO documents
                (project_id, file_name, file_path, file_type, file_size, uploaded_by, version)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    project_id,
                    originalName,
                    `uploads/${req.file.filename}`,
                    fileType,
                    req.file.size,
                    uploaded_by || "Không rõ",
                    newVersion
                ],
                (err, result) => {
                    if (err) return res.status(500).json(err);

                    res.json({
                        message: "Tải tài liệu thành công",
                        id: result.insertId,
                        version: newVersion
                    });
                }
            );
        });
    });
};

const getDocumentsByProject = (req, res) => {
    const { projectId } = req.params;

    db.query(
        "SELECT * FROM documents WHERE project_id = ? ORDER BY id DESC",
        [projectId],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
};

const deleteDocument = (req, res) => {
    const { id } = req.params;

    db.query("SELECT file_path FROM documents WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu" });
        }

        let relativePath = result[0].file_path;
        if (relativePath.startsWith("uploads/")) {
            relativePath = relativePath.replace("uploads/", "Uploads/");
        }

        const filePath = path.join(__dirname, "../../", relativePath);

        db.query("DELETE FROM documents WHERE id = ?", [id], (err) => {
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
