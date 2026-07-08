const db = require("../config/db");

const TaskModel = {
    getAll: (callback) => {
        const sql = `
        SELECT 
            tasks.*,
            projects.name AS project_name,
            projects.color AS project_color,
            users.full_name AS assignee_name
        FROM tasks
        LEFT JOIN projects ON tasks.project_id = projects.id
        LEFT JOIN users ON tasks.assigned_to = users.id
        ORDER BY tasks.id DESC
    `;

        db.query(sql, callback);
    },

    getByProject: (projectId, callback) => {
        const sql = `
            SELECT 
                tasks.*,
                users.full_name AS assignee_name
            FROM tasks
            LEFT JOIN users ON tasks.assigned_to = users.id
            WHERE tasks.project_id = ?
            ORDER BY tasks.id DESC
        `;

        db.query(sql, [projectId], callback);
    },

    create: (data, callback) => {
        const sql = `
            INSERT INTO tasks
            (project_id, title, description, assigned_to, start_date, end_date, status, priority, progress)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                data.project_id,
                data.title,
                data.description,
                data.assigned_to || null,
                data.start_date,
                data.end_date,
                data.status,
                data.priority,
                data.progress || 0
            ],
            callback
        );
    },

    update: (id, data, callback) => {
        const sql = `
        UPDATE tasks
        SET 
            title = ?,
            description = ?,
            assigned_to = ?,
            start_date = ?,
            end_date = ?,
            status = ?,
            priority = ?,
            progress = ?
        WHERE id = ?
    `;

        db.query(
            sql,
            [
                data.title,
                data.description,
                data.assigned_to || null,
                data.start_date,
                data.end_date,
                data.status,
                data.priority,
                Number(data.progress),
                id
            ],
            callback
        );
    },

    delete: (id, callback) => {
        const sql = "DELETE FROM tasks WHERE id = ?";
        db.query(sql, [id], callback);
    },

    getById: (id, callback) => {
        const sql = "SELECT * FROM tasks WHERE id = ?";
        db.query(sql, [id], callback);
    },

    updateProjectProgress: (projectId, callback) => {
        const sql = `
            SELECT ROUND(AVG(progress)) AS progress
            FROM tasks
            WHERE project_id = ?
        `;

        db.query(sql, [projectId], (err, result) => {
            if (err) return callback(err);

            const progress = result[0].progress || 0;

            const updateSql = `
                UPDATE projects
                SET progress = ?
                WHERE id = ?
            `;

            db.query(updateSql, [progress, projectId], callback);
        });
    },

    updateStatus: (id, status, callback) => {
        let progress = null;

        if (status === "CHUA_LAM") progress = 0;
        if (status === "DANG_LAM") progress = 1;
        if (status === "DANG_REVIEW") progress = 90;
        if (status === "HOAN_THANH") progress = 100;

        const sql = `
        UPDATE tasks
        SET status = ?, progress = ?
        WHERE id = ?
    `;

        db.query(sql, [status, progress, id], callback);
    },
};

module.exports = TaskModel;