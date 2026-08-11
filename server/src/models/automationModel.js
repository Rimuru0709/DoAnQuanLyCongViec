const db = require("../config/db");

const AutomationModel = {
    /* ─── Lấy toàn bộ rules của một project ─── */
    getByProject: (projectId, callback) => {
        const sql = `
            SELECT a.*, u.full_name AS created_by_name
            FROM automation_rules a
            LEFT JOIN users u ON u.id = a.created_by
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC
        `;
        db.query(sql, [Number(projectId)], callback);
    },

    /* ─── Tạo rule mới ─── */
    create: (data, callback) => {
        const sql = `
            INSERT INTO automation_rules
                (project_id, name, trigger_event, condition_field, condition_value,
                 action_type, action_value, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        `;
        db.query(sql, [
            Number(data.project_id),
            data.name || "Quy tắc mới",
            data.trigger_event || "STATUS_CHANGE",
            data.condition_field || "status",
            data.condition_value || "",
            data.action_type || "SET_COMPLETED_AT",
            data.action_value || "NOW",
            Number(data.created_by)
        ], callback);
    },

    /* ─── Bật/tắt rule ─── */
    toggle: (id, isActive, callback) => {
        db.query(
            "UPDATE automation_rules SET is_active = ? WHERE id = ?",
            [isActive ? 1 : 0, Number(id)],
            callback
        );
    },

    /* ─── Cập nhật toàn bộ rule ─── */
    update: (id, data, callback) => {
        const sql = `
            UPDATE automation_rules SET
                name            = ?,
                trigger_event   = ?,
                condition_field = ?,
                condition_value = ?,
                action_type     = ?,
                action_value    = ?,
                is_active       = ?
            WHERE id = ?
        `;
        db.query(sql, [
            data.name,
            data.trigger_event,
            data.condition_field,
            data.condition_value,
            data.action_type,
            data.action_value,
            data.is_active ? 1 : 0,
            Number(id)
        ], callback);
    },

    /* ─── Xóa rule ─── */
    delete: (id, callback) => {
        db.query("DELETE FROM automation_rules WHERE id = ?", [Number(id)], callback);
    },

    /* ─── Lấy rules active của project để chạy automation ─── */
    getActiveByProject: (projectId, callback) => {
        db.query(
            "SELECT * FROM automation_rules WHERE project_id = ? AND is_active = 1",
            [Number(projectId)],
            callback
        );
    }
};

module.exports = AutomationModel;
