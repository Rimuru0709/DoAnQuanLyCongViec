const db = require("../config/db");

/**
 * ActivityModel — Nhật ký hoạt động hệ thống
 * Ghi lại mọi thao tác quan trọng: tạo/sửa/xóa task, thêm comment, log giờ...
 */
const ActivityModel = {
    /**
     * Ghi một hoạt động mới vào log
     * @param {Object} params - { projectId, taskId, userId, action, content, entityType, oldValue, newValue }
     * @param {Function} callback
     */
    log: (params, callback) => {
        const {
            projectId = null,
            taskId    = null,
            userId    = null,
            action    = "update",
            content,
            entityType = "task",
            oldValue   = null,
            newValue   = null
        } = params;

        if (!content) {
            if (typeof callback === "function") {
                callback(new Error("Activity content is required"));
            }
            return;
        }

        const sql = `
            INSERT INTO activities
                (project_id, task_id, user_id, action, content, entity_type, old_value, new_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [projectId, taskId, userId, action, content, entityType, oldValue, newValue],
            (err, result) => {
                if (err) {
                    console.error("Lỗi ghi activity log:", err);
                }
                if (typeof callback === "function") {
                    callback(err, result);
                }
            }
        );
    },

    /**
     * Lấy activity log của một dự án (mới nhất trước)
     */
    getByProject: (projectId, limit = 50, callback) => {
        const sql = `
            SELECT
                a.id,
                a.action,
                a.content,
                a.entity_type,
                a.old_value,
                a.new_value,
                a.created_at,
                a.task_id,
                u.full_name AS user_name,
                u.role      AS user_role,
                t.title     AS task_title
            FROM activities a
            LEFT JOIN users u ON u.id = a.user_id
            LEFT JOIN tasks t ON t.id = a.task_id
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC
            LIMIT ?
        `;

        db.query(sql, [projectId, limit], callback);
    },

    /**
     * Lấy activity log của một task cụ thể
     */
    getByTask: (taskId, callback) => {
        const sql = `
            SELECT
                a.id,
                a.action,
                a.content,
                a.entity_type,
                a.old_value,
                a.new_value,
                a.created_at,
                u.full_name AS user_name,
                u.role      AS user_role
            FROM activities a
            LEFT JOIN users u ON u.id = a.user_id
            WHERE a.task_id = ?
            ORDER BY a.created_at DESC
            LIMIT 100
        `;

        db.query(sql, [taskId], callback);
    },

    /**
     * Lấy activity log gần đây nhất toàn hệ thống (dành cho ADMIN/Home dashboard)
     */
    getRecent: (limit = 20, callback) => {
        const sql = `
            SELECT
                a.id,
                a.action,
                a.content,
                a.entity_type,
                a.created_at,
                a.project_id,
                a.task_id,
                u.full_name  AS user_name,
                p.name       AS project_name,
                t.title      AS task_title
            FROM activities a
            LEFT JOIN users    u ON u.id = a.user_id
            LEFT JOIN projects p ON p.id = a.project_id
            LEFT JOIN tasks    t ON t.id = a.task_id
            ORDER BY a.created_at DESC
            LIMIT ?
        `;

        db.query(sql, [limit], callback);
    }
};

module.exports = ActivityModel;
