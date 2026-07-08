const db = require("../config/db");

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

const getByProject = (projectId, callback) => {
    const sql = "SELECT * FROM documents WHERE project_id = ? ORDER BY id DESC";
    db.query(sql, [projectId], callback);
};

const getById = (id, callback) => {
    const sql = "SELECT file_path FROM documents WHERE id = ?";
    db.query(sql, [id], callback);
};

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