const db = require("../config/db");

const MemberModel = {
    // Lấy toàn bộ nhân sự trong hệ thống
    // Lấy toàn bộ nhân sự trong hệ thống
    getAll: (callback) => {
    const sql = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.avatar,
            u.phone,
            u.role,
            u.created_at,

            COUNT(DISTINCT pm.project_id) AS project_count,

            GROUP_CONCAT(
                DISTINCT p.name
                ORDER BY p.name
                SEPARATOR ', '
            ) AS project_names,

            GROUP_CONCAT(
                DISTINCT pm.position
                ORDER BY pm.position
                SEPARATOR ', '
            ) AS positions,

            COUNT(DISTINCT t.id) AS total_tasks,

            COALESCE(
                task_progress.average_task_progress,
                0
            ) AS average_task_progress,

            COUNT(
                DISTINCT CASE
                    WHEN t.status = 'HOAN_THANH'
                    THEN t.id
                END
            ) AS completed_tasks,

            COUNT(
                DISTINCT CASE
                    WHEN t.status IN (
                        'DANG_LAM',
                        'DANG_REVIEW'
                    )
                    THEN t.id
                END
            ) AS active_tasks

        FROM users u

        LEFT JOIN project_members pm
            ON u.id = pm.user_id

        LEFT JOIN projects p
            ON pm.project_id = p.id

        LEFT JOIN tasks t
            ON u.id = t.assigned_to

        LEFT JOIN (
            SELECT
                assigned_to AS user_id,
                ROUND(
                    AVG(
                        COALESCE(progress, 0)
                    )
                ) AS average_task_progress
            FROM tasks
            WHERE assigned_to IS NOT NULL
            GROUP BY assigned_to
        ) AS task_progress
            ON task_progress.user_id = u.id

        GROUP BY
            u.id,
            u.full_name,
            u.email,
            u.avatar,
            u.phone,
            u.role,
            u.created_at,
            task_progress.average_task_progress

        ORDER BY u.id ASC
    `;

    db.query(sql, callback);
},

    // Lấy chi tiết nhân sự theo user ID
    getById: (userId, callback) => {
    const numericUserId = Number(userId);

    if (
        !Number.isInteger(numericUserId) ||
        numericUserId <= 0
    ) {
        return callback(
            new Error("Mã người dùng không hợp lệ")
        );
    }

    const sql = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.avatar,
            u.phone,
            u.role,
            u.created_at,

            COUNT(DISTINCT pm.project_id) AS project_count,

            GROUP_CONCAT(
                DISTINCT p.name
                ORDER BY p.name
                SEPARATOR ', '
            ) AS project_names,

            GROUP_CONCAT(
                DISTINCT pm.position
                ORDER BY pm.position
                SEPARATOR ', '
            ) AS positions,

            COUNT(DISTINCT t.id) AS total_tasks,

            COALESCE(
                task_progress.average_task_progress,
                0
            ) AS average_task_progress,

            COUNT(
                DISTINCT CASE
                    WHEN t.status = 'HOAN_THANH'
                    THEN t.id
                END
            ) AS completed_tasks,

            COUNT(
                DISTINCT CASE
                    WHEN t.status IN (
                        'DANG_LAM',
                        'DANG_REVIEW'
                    )
                    THEN t.id
                END
            ) AS active_tasks

        FROM users u

        LEFT JOIN project_members pm
            ON u.id = pm.user_id

        LEFT JOIN projects p
            ON pm.project_id = p.id

        LEFT JOIN tasks t
            ON u.id = t.assigned_to

        LEFT JOIN (
            SELECT
                assigned_to AS user_id,
                ROUND(
                    AVG(
                        COALESCE(progress, 0)
                    )
                ) AS average_task_progress
            FROM tasks
            WHERE assigned_to IS NOT NULL
            GROUP BY assigned_to
        ) AS task_progress
            ON task_progress.user_id = u.id

        WHERE u.id = ?

        GROUP BY
            u.id,
            u.full_name,
            u.email,
            u.avatar,
            u.phone,
            u.role,
            u.created_at,
            task_progress.average_task_progress
    `;

    db.query(
        sql,
        [numericUserId],
        callback
    );
},

    // Lấy một bản ghi thành viên dự án theo ID
    getProjectMemberById: (id, callback) => {
        const memberId = Number(id);

        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {
            return callback(
                new Error(
                    "Mã thành viên dự án không hợp lệ"
                )
            );
        }

        const sql = `
            SELECT
                pm.id,
                pm.project_id,
                pm.user_id,
                pm.position,
                pm.role_in_project,
                pm.joined_at,

                u.full_name,
                u.email,
                u.avatar,
                u.phone,
                u.role
            FROM project_members pm

            INNER JOIN users u
                ON pm.user_id = u.id

            WHERE pm.id = ?

            LIMIT 1
        `;

        db.query(
            sql,
            [memberId],
            callback
        );
    },

    // Kiểm tra user đã có trong dự án chưa
    checkMemberExists: (
        projectId,
        userId,
        callback
    ) => {
        const numericProjectId = Number(projectId);
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericProjectId) ||
            numericProjectId <= 0 ||
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error(
                    "Mã dự án hoặc người dùng không hợp lệ"
                )
            );
        }

        const sql = `
            SELECT id
            FROM project_members
            WHERE project_id = ?
              AND user_id = ?
            LIMIT 1
        `;

        db.query(
            sql,
            [
                numericProjectId,
                numericUserId
            ],
            callback
        );
    },

    // Kiểm tra quyền xem dự án
    canAccessProject: (
        projectId,
        userId,
        role,
        callback
    ) => {
        const numericProjectId = Number(projectId);
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericProjectId) ||
            numericProjectId <= 0 ||
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error(
                    "Mã dự án hoặc người dùng không hợp lệ"
                )
            );
        }

        if (role === "ADMIN") {
            return callback(null, true);
        }

        const sql = `
            SELECT p.id
            FROM projects p

            LEFT JOIN project_members pm
                ON pm.project_id = p.id
                AND pm.user_id = ?

            WHERE p.id = ?
              AND (
                    p.created_by = ?
                    OR pm.user_id = ?
              )

            LIMIT 1
        `;

        db.query(
            sql,
            [
                numericUserId,
                numericProjectId,
                numericUserId,
                numericUserId
            ],
            (err, result) => {
                if (err) {
                    return callback(err);
                }

                callback(
                    null,
                    result.length > 0
                );
            }
        );
    },

    // Kiểm tra quyền quản lý thành viên của dự án
    canManageProject: (
        projectId,
        userId,
        role,
        callback
    ) => {
        const numericProjectId = Number(projectId);
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericProjectId) ||
            numericProjectId <= 0 ||
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error(
                    "Mã dự án hoặc người dùng không hợp lệ"
                )
            );
        }

        if (role === "ADMIN") {
            return callback(null, true);
        }

        const sql = `
            SELECT p.id
            FROM projects p

            LEFT JOIN project_members pm
                ON pm.project_id = p.id
                AND pm.user_id = ?

            WHERE p.id = ?
              AND (
                    p.created_by = ?
                    OR pm.role_in_project IN (
                        'OWNER',
                        'MANAGER'
                    )
              )

            LIMIT 1
        `;

        db.query(
            sql,
            [
                numericUserId,
                numericProjectId,
                numericUserId
            ],
            (err, result) => {
                if (err) {
                    return callback(err);
                }

                callback(
                    null,
                    result.length > 0
                );
            }
        );
    },

    // Tạo nhân sự mới trong bảng users
    createSystemMember: (data, callback) => {
        const sql = `
            INSERT INTO users
            (
                full_name,
                email,
                password,
                avatar,
                phone,
                role
            )
            VALUES (?, ?, NULL, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                data.full_name.trim(),
                data.email.trim().toLowerCase(),
                data.avatar || null,
                data.phone || null,
                data.role || "MEMBER"
            ],
            callback
        );
    },

    // Thêm user vào một dự án
    addToProject: (data, callback) => {
        const projectId = Number(data.project_id);
        const userId = Number(data.user_id);

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0 ||
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            return callback(
                new Error(
                    "Mã dự án hoặc người dùng không hợp lệ"
                )
            );
        }

        const sql = `
            INSERT INTO project_members
            (
                project_id,
                user_id,
                position,
                role_in_project
            )
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                projectId,
                userId,
                data.position || "",
                data.role_in_project || "MEMBER"
            ],
            callback
        );
    },

    // Thêm user vào nhiều dự án
    addToProjects: (
        userId,
        projectIds,
        position,
        roleInProject,
        callback
    ) => {
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error("Mã người dùng không hợp lệ")
            );
        }

        if (
            !Array.isArray(projectIds) ||
            projectIds.length === 0
        ) {
            return callback(null, {
                affectedRows: 0
            });
        }

        const validProjectIds = [
            ...new Set(
                projectIds
                    .map(Number)
                    .filter(
                        (projectId) =>
                            Number.isInteger(projectId) &&
                            projectId > 0
                    )
            )
        ];

        if (validProjectIds.length === 0) {
            return callback(null, {
                affectedRows: 0
            });
        }

        const values = validProjectIds.map(
            (projectId) => [
                projectId,
                numericUserId,
                position || "",
                roleInProject || "MEMBER"
            ]
        );

        const sql = `
            INSERT IGNORE INTO project_members
            (
                project_id,
                user_id,
                position,
                role_in_project
            )
            VALUES ?
        `;

        db.query(
            sql,
            [values],
            callback
        );
    },

    // Sửa thông tin nhân sự toàn hệ thống
    updateSystemMember: (
        userId,
        data,
        callback
    ) => {
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error("Mã người dùng không hợp lệ")
            );
        }

        const sql = `
            UPDATE users
            SET
                full_name = ?,
                email = ?,
                avatar = ?,
                phone = ?,
                role = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                data.full_name.trim(),
                data.email.trim().toLowerCase(),
                data.avatar || null,
                data.phone || null,
                data.role || "MEMBER",
                numericUserId
            ],
            callback
        );
    },

    // Xóa toàn bộ liên kết dự án của một user
    removeAllProjectsByUser: (
        userId,
        callback
    ) => {
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error("Mã người dùng không hợp lệ")
            );
        }

        const sql = `
            DELETE FROM project_members
            WHERE user_id = ?
        `;

        db.query(
            sql,
            [numericUserId],
            callback
        );
    },

    // Xóa nhân sự khỏi toàn hệ thống
    deleteSystemMember: (
        userId,
        callback
    ) => {
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error("Mã người dùng không hợp lệ")
            );
        }

        const sql = `
            DELETE FROM users
            WHERE id = ?
        `;

        db.query(
            sql,
            [numericUserId],
            callback
        );
    },

    // Cập nhật vị trí và vai trò trong dự án
    updateProjectMember: (
        id,
        data,
        callback
    ) => {
        const memberId = Number(id);

        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {
            return callback(
                new Error(
                    "Mã thành viên dự án không hợp lệ"
                )
            );
        }

        const sql = `
            UPDATE project_members
            SET
                position = ?,
                role_in_project = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                data.position || "",
                data.role_in_project || "MEMBER",
                memberId
            ],
            callback
        );
    },

    // Xóa một thành viên khỏi dự án
    removeFromProject: (id, callback) => {
        const memberId = Number(id);

        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {
            return callback(
                new Error(
                    "Mã thành viên dự án không hợp lệ"
                )
            );
        }

        const sql = `
            DELETE FROM project_members
            WHERE id = ?
        `;

        db.query(
            sql,
            [memberId],
            callback
        );
    },

    // Lấy tất cả user cho combobox
    getAllUsers: (callback) => {
        const sql = `
            SELECT
                id,
                full_name,
                email,
                avatar,
                phone,
                role,
                created_at
            FROM users
            ORDER BY full_name ASC
        `;

        db.query(sql, callback);
    },

    // Lấy user chưa tham gia một dự án
    getUsersNotInProject: (
        projectId,
        callback
    ) => {
        const numericProjectId = Number(projectId);

        if (
            !Number.isInteger(numericProjectId) ||
            numericProjectId <= 0
        ) {
            return callback(
                new Error("Mã dự án không hợp lệ")
            );
        }

        const sql = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.avatar,
                u.phone,
                u.role,
                u.created_at
            FROM users u

            WHERE NOT EXISTS (
                SELECT 1
                FROM project_members pm
                WHERE pm.project_id = ?
                AND pm.user_id = u.id
            )

            ORDER BY u.full_name ASC
        `;

        db.query(
            sql,
            [numericProjectId],
            callback
        );
    }
};

module.exports = MemberModel;