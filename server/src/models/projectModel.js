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
                p.created_by,
                COALESCE(ROUND(AVG(t.progress)), 0) AS progress
            FROM projects p
            LEFT JOIN tasks t
                ON p.id = t.project_id
            GROUP BY
                p.id,
                p.name,
                p.description,
                p.customer,
                p.manager_name,
                p.start_date,
                p.end_date,
                p.status,
                p.created_by
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
                p.created_by,
                COALESCE(ROUND(AVG(t.progress)), 0) AS progress
            FROM projects p
            LEFT JOIN tasks t
                ON p.id = t.project_id
            WHERE p.id = ?
            GROUP BY
                p.id,
                p.name,
                p.description,
                p.customer,
                p.manager_name,
                p.start_date,
                p.end_date,
                p.status,
                p.created_by
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
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                data.progress || 0,
                data.created_by
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
                status = ?
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
                id
            ],
            callback
        );
    },

    delete: (id, callback) => {
        const sql = "DELETE FROM projects WHERE id = ?";
        db.query(sql, [id], callback);
    },

    archive: (id, callback) => {
        const sql = `
            UPDATE projects
            SET status = 'TAM_DUNG'
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
                created_by
            FROM projects
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    }
};

module.exports = ProjectModel;