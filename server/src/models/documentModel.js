const db = require("../config/db");

// 1. Lấy phiên bản mới nhất của một tài liệu cụ thể trong dự án
const getLatestVersion = (projectId, fileName, callback) => {
    const sql = `
        SELECT version
        FROM documents
        WHERE project_id = ? AND file_name = ?
        ORDER BY id DESC
        LIMIT 1
    `;
    db.query(sql, [projectId, fileName], callback);
};

// 2. Thêm mới bản ghi tài liệu vào MySQL Workbench
const createDocument = (data, callback) => {
    const sql = `
        INSERT INTO documents
        (project_id, file_name, file_path, file_type, file_size, uploaded_by, version)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            data.project_id,
            data.file_name,
            data.file_path,
            data.file_type,
            data.file_size,
            data.uploaded_by,
            data.version
        ],
        callback
    );
};

// 3. Lấy toàn bộ danh sách tài liệu thuộc về một dự án
const getByProject = (projectId, callback) => {
    const sql = "SELECT * FROM documents WHERE project_id = ? ORDER BY id DESC";
    db.query(sql, [projectId], callback);
};

// 4. Lấy đầy đủ thông tin tài liệu theo ID (Phục vụ cả tính năng Xóa và Download)
const getById = (id, callback) => {
    const sql = "SELECT * FROM documents WHERE id = ?"; 
    db.query(sql, [id], callback);
};

// 5. Xóa bản ghi tài liệu trong MySQL theo ID
const deleteById = (id, callback) => {
    const sql = "DELETE FROM documents WHERE id = ?";
    db.query(sql, [id], callback);
};

module.exports = {
    getLatestVersion,
    createDocument,
    getByProject,
    getById,
    deleteById
};