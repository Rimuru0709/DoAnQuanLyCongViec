const db = require("../config/db");

const ProjectModel = {
    /*
    |--------------------------------------------------------------------------
    | ADMIN: Lấy tất cả dự án chưa lưu trữ
    |--------------------------------------------------------------------------
    */

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
            LEFT JOIN tasks t
                ON p.id = t.project_id
            WHERE p.is_archived = 0
            GROUP BY
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
                p.created_at
            ORDER BY p.id DESC
        `;

        db.query(sql, callback);
    },

    /*
    |--------------------------------------------------------------------------
    | MEMBER/MANAGER: Lấy dự án theo tài khoản
    |--------------------------------------------------------------------------
    |
    | Người dùng được thấy dự án khi:
    | - Là người tạo dự án
    | - Hoặc có trong bảng project_members
    |
    */

    getByUserId: (userId, callback) => {
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
            LEFT JOIN tasks t
                ON p.id = t.project_id
            WHERE p.is_archived = 0
              AND (
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
              )
            GROUP BY
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
                p.created_at
            ORDER BY p.id DESC
        `;

        db.query(sql, [userId, userId], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | ADMIN: Lấy tất cả dự án đã lưu trữ
    |--------------------------------------------------------------------------
    */

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
            LEFT JOIN tasks t
                ON p.id = t.project_id
            WHERE p.is_archived = 1
            GROUP BY
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
                p.created_at
            ORDER BY p.id DESC
        `;

        db.query(sql, callback);
    },

    /*
    |--------------------------------------------------------------------------
    | MEMBER/MANAGER: Lấy dự án đã lưu trữ theo tài khoản
    |--------------------------------------------------------------------------
    */

    getArchivedByUserId: (userId, callback) => {
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
            LEFT JOIN tasks t
                ON p.id = t.project_id
            WHERE p.is_archived = 1
              AND (
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
              )
            GROUP BY
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
                p.created_at
            ORDER BY p.id DESC
        `;

        db.query(sql, [userId, userId], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Lấy dự án theo ID
    |--------------------------------------------------------------------------
    |
    | Hàm này chủ yếu dùng cho ADMIN hoặc kiểm tra người tạo dự án.
    |
    */

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
                p.color,
                p.created_by,
                p.is_archived,
                p.created_at
        `;

        db.query(sql, [id], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Lấy chi tiết dự án theo ID và tài khoản
    |--------------------------------------------------------------------------
    |
    | MEMBER/MANAGER chỉ được lấy dự án mình tạo hoặc đang tham gia.
    |
    */

    getByIdForUser: (projectId, userId, callback) => {
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
            LEFT JOIN tasks t
                ON p.id = t.project_id
            WHERE p.id = ?
              AND (
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
              )
            GROUP BY
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
                p.created_at
        `;

        db.query(
            sql,
            [projectId, userId, userId],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Thêm dự án
    |--------------------------------------------------------------------------
    */

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
                data.description || null,
                data.customer || null,
                data.manager_name || null,
                data.start_date || null,
                data.end_date || null,
                data.status || "SAP_TOI",
                Number(data.progress) || 0,
                0,
                data.color || "#2563EB",
                data.created_by
            ],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Cập nhật dự án
    |--------------------------------------------------------------------------
    */

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
                data.description || null,
                data.customer || null,
                data.manager_name || null,
                data.start_date || null,
                data.end_date || null,
                data.status,
                data.color || "#2563EB",
                id
            ],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Xóa dự án
    |--------------------------------------------------------------------------
    */

    delete: (id, callback) => {
        const sql = `
            DELETE FROM projects
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Lưu trữ dự án
    |--------------------------------------------------------------------------
    */

    archive: (id, callback) => {
        const sql = `
            UPDATE projects
            SET is_archived = 1
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Khôi phục dự án
    |--------------------------------------------------------------------------
    */

    restore: (id, callback) => {
        const sql = `
            UPDATE projects
            SET is_archived = 0
            WHERE id = ?
        `;

        db.query(sql, [id], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Nhân bản dự án
    |--------------------------------------------------------------------------
    |
    | Dự án mới sẽ thuộc tài khoản đang thực hiện nhân bản.
    |
    */

    duplicate: (id, userId, callback) => {
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
                ?
            FROM projects
            WHERE id = ?
        `;

        db.query(sql, [userId, id], callback);
    }
};

module.exports = ProjectModel;