const multer = require("multer");
const fs = require("fs");
const path = require("path");

const DocumentModel = require("../models/documentModel");

const uploadDir = path.join(
    __dirname,
    "../../uploads/documents"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

const decodeFileName = (fileName) => {
    try {
        return Buffer.from(
            fileName,
            "latin1"
        ).toString("utf8");
    } catch {
        return fileName;
    }
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDir);
    },

    filename: (req, file, callback) => {
        const originalName =
            decodeFileName(file.originalname);

        const safeName = originalName.replace(
            /[<>:"/\\|?*\u0000-\u001F]/g,
            "_"
        );

        callback(
            null,
            `${Date.now()}-${safeName}`
        );
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, callback) => {
        const allowedExtensions = new Set([
            ".jpeg",
            ".jpg",
            ".png",
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".ppt",
            ".pptx",
            ".zip",
            ".rar"
        ]);

        const originalName =
            decodeFileName(file.originalname);

        const extension = path
            .extname(originalName)
            .toLowerCase();

        if (allowedExtensions.has(extension)) {
            return callback(null, true);
        }

        callback(
            new Error(
                "Định dạng file không được hỗ trợ"
            )
        );
    }
}).single("document");

const getNextVersionString = (lastVersion) => {
    if (!lastVersion) {
        return "v1.0";
    }

    const number = Number.parseFloat(
        String(lastVersion).replace("v", "")
    );

    const currentVersion =
        Number.isFinite(number)
            ? number
            : 1;

    return `v${(currentVersion + 1).toFixed(1)}`;
};

// Lấy tài liệu theo dự án
const getDocumentsByProject = (req, res) => {
    const projectId = Number(
        req.params.projectId
    );

    if (
        !Number.isInteger(projectId) ||
        projectId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Mã dự án không hợp lệ"
        });
    }

    DocumentModel.getByProject(
        projectId,
        (error, results) => {
            if (error) {
                console.error(
                    "Lỗi lấy tài liệu:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể lấy danh sách tài liệu",
                    error: error.message
                });
            }

            return res.status(200).json(results);
        }
    );
};

// Upload tài liệu
const uploadDocument = (req, res) => {
    upload(req, res, (uploadError) => {
        if (uploadError) {
            return res.status(400).json({
                success: false,
                message:
                    uploadError.message ||
                    "Không thể upload tài liệu"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn tài liệu"
            });
        }

        const projectId = Number(
            req.body.project_id
        );

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                success: false,
                message: "Mã dự án không hợp lệ"
            });
        }

        const originalName =
            decodeFileName(
                req.file.originalname
            );

        const fileType = path
            .extname(originalName)
            .replace(".", "")
            .toUpperCase();

        const uploader =
            req.user?.full_name ||
            req.body.uploaded_by ||
            "Không rõ";

        DocumentModel.getLatestVersion(
            projectId,
            originalName,
            (versionError, versionResult) => {
                if (versionError) {
                    if (
                        fs.existsSync(
                            req.file.path
                        )
                    ) {
                        fs.unlinkSync(
                            req.file.path
                        );
                    }

                    return res.status(500).json({
                        success: false,
                        message:
                            "Không thể kiểm tra phiên bản tài liệu",
                        error:
                            versionError.message
                    });
                }

                const newVersion =
                    versionResult.length > 0
                        ? getNextVersionString(
                            versionResult[0]
                                .version
                        )
                        : "v1.0";

                const documentData = {
                    project_id: projectId,
                    file_name: originalName,
                    file_path:
                        `uploads/documents/${req.file.filename}`,
                    file_type:
                        fileType || "FILE",
                    file_size:
                        req.file.size,
                    uploaded_by:
                        uploader,
                    version:
                        newVersion
                };

                DocumentModel.createDocument(
                    documentData,
                    (createError, result) => {
                        if (createError) {
                            if (
                                fs.existsSync(
                                    req.file.path
                                )
                            ) {
                                fs.unlinkSync(
                                    req.file.path
                                );
                            }

                            return res
                                .status(500)
                                .json({
                                    success: false,
                                    message:
                                        "Không thể lưu thông tin tài liệu",
                                    error:
                                        createError.message
                                });
                        }

                        return res
                            .status(201)
                            .json({
                                success: true,
                                message:
                                    "Tải tài liệu lên thành công",
                                document: {
                                    id:
                                        result.insertId,
                                    ...documentData
                                }
                            });
                    }
                );
            }
        );
    });
};

// Xóa tài liệu
const deleteDocument = (req, res) => {
    const documentId = Number(
        req.params.id
    );

    if (
        !Number.isInteger(documentId) ||
        documentId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Mã tài liệu không hợp lệ"
        });
    }

    DocumentModel.getById(
        documentId,
        (findError, results) => {
            if (findError) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể kiểm tra tài liệu",
                    error:
                        findError.message
                });
            }

            if (
                !results ||
                results.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy tài liệu"
                });
            }

            const document = results[0];

            const relativePath =
                String(document.file_path)
                    .replace(/^\/+/, "");

            const filePath = path.join(
                __dirname,
                "../../",
                relativePath
            );

            DocumentModel.deleteById(
                documentId,
                (deleteError, result) => {
                    if (deleteError) {
                        return res
                            .status(500)
                            .json({
                                success: false,
                                message:
                                    "Không thể xóa tài liệu",
                                error:
                                    deleteError.message
                            });
                    }

                    if (
                        result.affectedRows ===
                        0
                    ) {
                        return res
                            .status(404)
                            .json({
                                success: false,
                                message:
                                    "Không tìm thấy tài liệu"
                            });
                    }

                    if (
                        fs.existsSync(filePath)
                    ) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (fileError) {
                            console.error(
                                "Không thể xóa file vật lý:",
                                fileError
                            );
                        }
                    }

                    return res.status(200).json({
                        success: true,
                        message:
                            "Xóa tài liệu thành công"
                    });
                }
            );
        }
    );
};

// Tải tài liệu
const downloadDocument = (req, res) => {
    const documentId = Number(
        req.params.id
    );

    DocumentModel.getById(
        documentId,
        (error, results) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể lấy tài liệu",
                    error: error.message
                });
            }

            if (
                !results ||
                results.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy tài liệu"
                });
            }

            const document = results[0];

            const relativePath =
                String(document.file_path)
                    .replace(/^\/+/, "");

            const filePath = path.join(
                __dirname,
                "../../",
                relativePath
            );

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message:
                        "File không còn tồn tại trên server"
                });
            }

            return res.download(
                filePath,
                document.file_name
            );
        }
    );
};

module.exports = {
    getDocumentsByProject,
    uploadDocument,
    deleteDocument,
    downloadDocument
};