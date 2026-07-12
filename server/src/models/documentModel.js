const db = require("../config/db");

const DocumentModel = {
    getLatestVersion: (
        projectId,
        fileName,
        callback
    ) => {
        const sql = `
            SELECT version
            FROM documents
            WHERE project_id = ?
              AND file_name = ?
            ORDER BY id DESC
            LIMIT 1
        `;

        db.query(
            sql,
            [
                Number(projectId),
                fileName
            ],
            callback
        );
    },

    createDocument: (
        data,
        callback
    ) => {
        const sql = `
            INSERT INTO documents
            (
                project_id,
                file_name,
                file_path,
                file_type,
                file_size,
                uploaded_by,
                version
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                Number(data.project_id),
                data.file_name,
                data.file_path,
                data.file_type,
                Number(data.file_size) || 0,
                data.uploaded_by,
                data.version || "v1.0"
            ],
            callback
        );
    },

    getByProject: (
        projectId,
        callback
    ) => {
        const sql = `
            SELECT
                id,
                project_id,
                file_name,
                file_path,
                file_type,
                file_size,
                uploaded_by,
                version,
                created_at
            FROM documents
            WHERE project_id = ?
            ORDER BY id DESC
        `;

        db.query(
            sql,
            [Number(projectId)],
            callback
        );
    },

    getById: (
        id,
        callback
    ) => {
        const sql = `
            SELECT *
            FROM documents
            WHERE id = ?
            LIMIT 1
        `;

        db.query(
            sql,
            [Number(id)],
            callback
        );
    },

    deleteById: (
        id,
        callback
    ) => {
        const sql = `
            DELETE FROM documents
            WHERE id = ?
        `;

        db.query(
            sql,
            [Number(id)],
            callback
        );
    }
};

module.exports = DocumentModel;