const db = require("../config/db");

const ProjectModel = {
    getAll: (callback) => {
        const sql = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.customer,
                p.manager_name,
                p.start_date,
                p.end_date,
                p.status,
                p.color,
                p.created_by,
                p.is_archived,
                p.created_at,
                COALESCE(ROUND(AVG(t.progress)), 0) AS progress
            FROM projects p
            LEFT JOIN tasks t ON p.id = t.project_id
            WHERE p.is_archived = 0
            GROUP BY
                p.id, p.name, p.description, p.customer, p.manager_name,
                p.start_date, p.end_date, p.status, p.color,
                p.created_by, p.is_archived, p.created_at
            ORDER BY p.id DESC
        `;

        db.query(sql, callback);
    },

    getArchived: (callback) => {
        const sql = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.customer,
                p.manager_name,
                p.start_date,
                p.end_date,
                p.status,
                p.color,
                p.created_by,
                p.is_archived,
                p.created_at,
                COALESCE(ROUND(AVG(t.progress)), 0) AS progress
            FROM projects p
            LEFT JOIN tasks t ON p.id = t.project_id
            WHERE p.is_archived = 1
            GROUP BY
                p.id, p.name, p.description, p.customer, p.manager_name,
                p.start_date, p.end_date, p.status, p.color,
                p.created_by, p.is_archived, p.created_at
            ORDER BY p.id DESC
        `;

        db.query(sql, callback);
    },

    getById: (id, callback) => {
        const sql = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.customer,
                p.manager_name,
                p.start_date,
                p.end_date,
                p.status,
                p.color,
                p.created_by,
                p.is_archived,
                p.created_at,
                COALESCE(ROUND(AVG(t.progress)), 0) AS progress
            FROM projects p
            LEFT JOIN tasks t ON p.id = t.project_id
            WHERE p.id = ?
            GROUP BY
                p.id, p.name, p.description, p.customer, p.manager_name,
                p.start_date, p.end_date, p.status, p.color,
                p.created_by, p.is_archived, p.created_at
        `;

        db.query(sql, [id], callback);
    },

    create: (data, callback) => {
        const sql = `
            INSERT INTO projects
            (
                name,
                description,
                customer,
                manager_name,
                start_date,
                end_date,
                status,
                progress,
                is_archived,
                color,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                data.name,
                data.description,
                data.customer,
                data.manager_name,
                data.start_date,
                data.end_date,
                data.status || "SAP_TOI",
                data.progress || 0,
                0,
                data.color || "#2563EB",
                data.created_by || null
            ],
            callback
        );
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE projects
            SET
                name = ?,
                description = ?,
                customer = ?,
                manager_name = ?,
                start_date = ?,
                end_date = ?,
                status = ?,
                color = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                data.name,
                data.description,
                data.customer,
                data.manager_name,
                data.start_date,
                data.end_date,
                data.status,
                data.color || "#2563EB",
                id
            ],
            callback
        );
    },

    delete: (id, callback) => {
        const sql = `
            DELETE FROM projects
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    },

    archive: (id, callback) => {
        const sql = `
            UPDATE projects
            SET is_archived = 1
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    },

    restore: (id, callback) => {
        const sql = `
            UPDATE projects
            SET is_archived = 0
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    },

    duplicate: (id, callback) => {
        const sql = `
            INSERT INTO projects
            (
                name,
                description,
                customer,
                manager_name,
                start_date,
                end_date,
                status,
                progress,
                is_archived,
                color,
                created_by
            )
            SELECT
                CONCAT(name, ' (Copy)'),
                description,
                customer,
                manager_name,
                start_date,
                end_date,
                'SAP_TOI',
                0,
                0,
                color,
                created_by
            FROM projects
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    }
};

module.exports = ProjectModel;