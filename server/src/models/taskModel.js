const db = require("../config/db");

const TaskModel = {
    /*
    |--------------------------------------------------------------------------
    | ADMIN: Lấy toàn bộ công việc
    |--------------------------------------------------------------------------
    */

    getAll: (callback) => {
        const sql = `
            SELECT
                t.*,
                p.name AS project_name,
                p.color AS project_color,
                u.full_name AS assignee_name
            FROM tasks t
            LEFT JOIN projects p
                ON t.project_id = p.id
            LEFT JOIN users u
                ON t.assigned_to = u.id
            ORDER BY t.id DESC
        `;

        db.query(sql, callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Lấy danh sách công việc theo tài khoản
    |--------------------------------------------------------------------------
    |
    | ADMIN:
    | - Xem toàn bộ công việc.
    |
    | MANAGER:
    | - Xem công việc thuộc dự án mình tạo.
    | - Hoặc dự án mình đang tham gia.
    |
    | MEMBER:
    | - Chỉ xem công việc được giao cho mình.
    |
    */

    getAllByUser: (userId, role, callback) => {
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error("Mã người dùng không hợp lệ")
            );
        }

        if (role === "ADMIN") {
            return TaskModel.getAll(callback);
        }

        if (role === "MANAGER") {
            const sql = `
                SELECT
                    t.*,
                    p.name AS project_name,
                    p.color AS project_color,
                    u.full_name AS assignee_name
                FROM tasks t
                INNER JOIN projects p
                    ON t.project_id = p.id
                LEFT JOIN users u
                    ON t.assigned_to = u.id
                WHERE
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
                ORDER BY t.id DESC
            `;

            return db.query(
                sql,
                [numericUserId, numericUserId],
                callback
            );
        }

        const sql = `
            SELECT
                t.*,
                p.name AS project_name,
                p.color AS project_color,
                u.full_name AS assignee_name
            FROM tasks t
            INNER JOIN projects p
                ON t.project_id = p.id
            LEFT JOIN users u
                ON t.assigned_to = u.id
            WHERE t.assigned_to = ?
            ORDER BY t.id DESC
        `;

        db.query(
            sql,
            [numericUserId],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Lấy toàn bộ công việc theo dự án
    |--------------------------------------------------------------------------
    |
    | Hàm này chủ yếu dùng cho ADMIN.
    |
    */

    getByProject: (projectId, callback) => {
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
                t.*,
                p.name AS project_name,
                p.color AS project_color,
                u.full_name AS assignee_name
            FROM tasks t
            INNER JOIN projects p
                ON t.project_id = p.id
            LEFT JOIN users u
                ON t.assigned_to = u.id
            WHERE t.project_id = ?
            ORDER BY t.id DESC
        `;

        db.query(
            sql,
            [numericProjectId],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Lấy công việc theo dự án và tài khoản
    |--------------------------------------------------------------------------
    |
    | ADMIN:
    | - Xem toàn bộ công việc của dự án.
    |
    | MANAGER:
    | - Xem nếu là người tạo dự án.
    | - Hoặc đang tham gia dự án.
    |
    | MEMBER:
    | - Chỉ xem công việc trong dự án được giao cho mình.
    |
    */

    getByProjectForUser: (
        projectId,
        userId,
        role,
        callback
    ) => {
        const numericProjectId = Number(projectId);
        const numericUserId = Number(userId);

        if (
            !Number.isInteger(numericProjectId) ||
            numericProjectId <= 0
        ) {
            return callback(
                new Error("Mã dự án không hợp lệ")
            );
        }

        if (
            !Number.isInteger(numericUserId) ||
            numericUserId <= 0
        ) {
            return callback(
                new Error("Mã người dùng không hợp lệ")
            );
        }

        if (role === "ADMIN") {
            return TaskModel.getByProject(
                numericProjectId,
                callback
            );
        }

        if (role === "MANAGER") {
            const sql = `
                SELECT
                    t.*,
                    p.name AS project_name,
                    p.color AS project_color,
                    u.full_name AS assignee_name
                FROM tasks t
                INNER JOIN projects p
                    ON t.project_id = p.id
                LEFT JOIN users u
                    ON t.assigned_to = u.id
                WHERE t.project_id = ?
                  AND (
                        p.created_by = ?
                        OR EXISTS (
                            SELECT 1
                            FROM project_members pm
                            WHERE pm.project_id = p.id
                              AND pm.user_id = ?
                        )
                  )
                ORDER BY t.id DESC
            `;

            return db.query(
                sql,
                [
                    numericProjectId,
                    numericUserId,
                    numericUserId
                ],
                callback
            );
        }

        const sql = `
            SELECT
                t.*,
                p.name AS project_name,
                p.color AS project_color,
                u.full_name AS assignee_name
            FROM tasks t
            INNER JOIN projects p
                ON t.project_id = p.id
            LEFT JOIN users u
                ON t.assigned_to = u.id
            WHERE t.project_id = ?
              AND t.assigned_to = ?
            ORDER BY t.id DESC
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

    /*
    |--------------------------------------------------------------------------
    | Lấy công việc theo ID
    |--------------------------------------------------------------------------
    */

    getById: (id, callback) => {
        const numericId = Number(id);

        if (
            !Number.isInteger(numericId) ||
            numericId <= 0
        ) {
            return callback(
                new Error("Mã công việc không hợp lệ")
            );
        }

        const sql = `
            SELECT
                t.*,
                p.name AS project_name,
                p.color AS project_color,
                p.created_by AS project_created_by,
                u.full_name AS assignee_name
            FROM tasks t
            INNER JOIN projects p
                ON t.project_id = p.id
            LEFT JOIN users u
                ON t.assigned_to = u.id
            WHERE t.id = ?
            LIMIT 1
        `;

        db.query(
            sql,
            [numericId],
            callback
        );
    },    /*
    |--------------------------------------------------------------------------
    | Thêm công việc
    |--------------------------------------------------------------------------
    */

    create: (data, callback) => {
        const projectId = Number(data.project_id);
        const assignedTo = data.assigned_to
            ? Number(data.assigned_to)
            : null;

        const progress = Number(data.progress);

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            return callback(
                new Error("Mã dự án không hợp lệ")
            );
        }

        if (
            assignedTo !== null &&
            (
                !Number.isInteger(assignedTo) ||
                assignedTo <= 0
            )
        ) {
            return callback(
                new Error("Mã người phụ trách không hợp lệ")
            );
        }

        const sql = `
            INSERT INTO tasks
            (
                project_id,
                column_id,
                title,
                description,
                assigned_to,
                start_date,
                end_date,
                status,
                priority,
                progress,
                task_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                projectId,
                data.column_id
                    ? Number(data.column_id)
                    : null,
                data.title.trim(),
                data.description || "",
                assignedTo,
                data.start_date || null,
                data.end_date || null,
                data.status || "CHUA_LAM",
                data.priority || "TRUNG_BINH",
                Number.isFinite(progress)
                    ? Math.min(100, Math.max(0, progress))
                    : 0,
                Number(data.task_order) || 0
            ],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Cập nhật công việc
    |--------------------------------------------------------------------------
    */

    update: (id, data, callback) => {
        const taskId = Number(id);
        const projectId = Number(data.project_id);
        const assignedTo = data.assigned_to
            ? Number(data.assigned_to)
            : null;

        const progress = Number(data.progress);

        if (
            !Number.isInteger(taskId) ||
            taskId <= 0
        ) {
            return callback(
                new Error("Mã công việc không hợp lệ")
            );
        }

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            return callback(
                new Error("Mã dự án không hợp lệ")
            );
        }

        if (
            assignedTo !== null &&
            (
                !Number.isInteger(assignedTo) ||
                assignedTo <= 0
            )
        ) {
            return callback(
                new Error("Mã người phụ trách không hợp lệ")
            );
        }

        const sql = `
            UPDATE tasks
            SET
                project_id = ?,
                column_id = ?,
                title = ?,
                description = ?,
                assigned_to = ?,
                start_date = ?,
                end_date = ?,
                status = ?,
                priority = ?,
                progress = ?,
                task_order = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                projectId,
                data.column_id
                    ? Number(data.column_id)
                    : null,
                data.title.trim(),
                data.description || "",
                assignedTo,
                data.start_date || null,
                data.end_date || null,
                data.status || "CHUA_LAM",
                data.priority || "TRUNG_BINH",
                Number.isFinite(progress)
                    ? Math.min(100, Math.max(0, progress))
                    : 0,
                Number(data.task_order) || 0,
                taskId
            ],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Xóa công việc
    |--------------------------------------------------------------------------
    */

    delete: (id, callback) => {
        const taskId = Number(id);

        if (
            !Number.isInteger(taskId) ||
            taskId <= 0
        ) {
            return callback(
                new Error("Mã công việc không hợp lệ")
            );
        }

        const sql = `
            DELETE FROM tasks
            WHERE id = ?
        `;

        db.query(
            sql,
            [taskId],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Tự động thêm người phụ trách vào dự án
    |--------------------------------------------------------------------------
    |
    | Nếu người được giao việc chưa có trong project_members
    | thì tự thêm với role MEMBER.
    |
    */

    addAssigneeToProjectIfMissing: (
        projectId,
        userId,
        callback
    ) => {
        const numericProjectId = Number(projectId);
        const numericUserId = Number(userId);

        if (!userId) {
            return callback(null, {
                affectedRows: 0
            });
        }

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
            INSERT IGNORE INTO project_members
            (
                project_id,
                user_id,
                position,
                role_in_project
            )
            VALUES (?, ?, '', 'MEMBER')
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

    /*
    |--------------------------------------------------------------------------
    | Cập nhật tiến độ dự án theo công việc
    |--------------------------------------------------------------------------
    */

    updateProjectProgress: (
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
                COALESCE(
                    ROUND(AVG(progress)),
                    0
                ) AS progress
            FROM tasks
            WHERE project_id = ?
        `;

        db.query(
            sql,
            [numericProjectId],
            (error, result) => {
                if (error) {
                    return callback(error);
                }

                const projectProgress =
                    result.length > 0
                        ? Number(result[0].progress) || 0
                        : 0;

                const updateSql = `
                    UPDATE projects
                    SET progress = ?
                    WHERE id = ?
                `;

                db.query(
                    updateSql,
                    [
                        projectProgress,
                        numericProjectId
                    ],
                    callback
                );
            }
        );
    },


    /*
   |--------------------------------------------------------------------------
   | Cập nhật trạng thái và tiến độ
   |--------------------------------------------------------------------------
   */

    updateStatusAndProgress: (
        id,
        status,
        progress,
        callback
    ) => {
        const taskId = Number(id);

        if (
            !Number.isInteger(taskId) ||
            taskId <= 0
        ) {
            return callback(
                new Error("Mã công việc không hợp lệ")
            );
        }

        const validStatuses = [
            "CHUA_LAM",
            "DANG_LAM",
            "DANG_REVIEW",
            "HOAN_THANH",
            "QUA_HAN"
        ];

        if (!validStatuses.includes(status)) {
            return callback(
                new Error("Trạng thái không hợp lệ")
            );
        }

        let finalProgress = Math.min(
            100,
            Math.max(
                0,
                Number(progress) || 0
            )
        );

        if (status === "CHUA_LAM") {
            finalProgress = 0;
        }

        if (status === "DANG_LAM") {
            finalProgress = Math.min(
                89,
                Math.max(1, finalProgress)
            );
        }

        if (status === "DANG_REVIEW") {
            finalProgress = 90;
        }

        if (status === "HOAN_THANH") {
            finalProgress = 100;
        }

        if (status === "QUA_HAN") {
            finalProgress = 0;
        }

        const sql = `
        UPDATE tasks
        SET
            status = ?,
            progress = ?
        WHERE id = ?
    `;

        db.query(
            sql,
            [
                status,
                finalProgress,
                taskId
            ],
            callback
        );
    },/*
    |--------------------------------------------------------------------------
    | Cập nhật trạng thái công việc
    |--------------------------------------------------------------------------
    */

    updateStatus: (id, status, callback) => {
        const taskId = Number(id);

        if (
            !Number.isInteger(taskId) ||
            taskId <= 0
        ) {
            return callback(
                new Error("Mã công việc không hợp lệ")
            );
        }

        if (status === "DANG_LAM") {
            const sql = `
                UPDATE tasks
                SET
                    status = ?,
                    progress = CASE
                        WHEN progress < 1 THEN 1
                        WHEN progress > 89 THEN 89
                        ELSE progress
                    END
                WHERE id = ?
            `;

            return db.query(
                sql,
                [status, taskId],
                callback
            );
        }

        let progress = 0;

        switch (status) {
            case "CHUA_LAM":
                progress = 0;
                break;

            case "DANG_REVIEW":
                progress = 90;
                break;

            case "HOAN_THANH":
                progress = 100;
                break;

            case "QUA_HAN":
                progress = 0;
                break;

            default:
                return callback(
                    new Error("Trạng thái không hợp lệ")
                );
        }

        const sql = `
            UPDATE tasks
            SET
                status = ?,
                progress = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                status,
                progress,
                taskId
            ],
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Kiểm tra quyền quản lý dự án
    |--------------------------------------------------------------------------
    */

    canManageProject: (
        projectId,
        userId,
        role,
        callback
    ) => {
        const numericProjectId = Number(projectId);
        const numericUserId = Number(userId);

        if (role === "ADMIN") {
            return callback(null, true);
        }

        const sql = `
            SELECT p.id
            FROM projects p
            LEFT JOIN project_members pm
                ON p.id = pm.project_id
                AND pm.user_id = ?
            WHERE p.id = ?
              AND (
                    p.created_by = ?
                    OR pm.role_in_project IN
                    (
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

    /*
    |--------------------------------------------------------------------------
    | Kiểm tra quyền cập nhật trạng thái
    |--------------------------------------------------------------------------
    */

    canUpdateStatus: (
        taskId,
        userId,
        role,
        callback
    ) => {
        const numericTaskId = Number(taskId);
        const numericUserId = Number(userId);

        if (role === "ADMIN") {
            return callback(null, true);
        }

        const sql = `
            SELECT t.id
            FROM tasks t
            INNER JOIN projects p
                ON t.project_id = p.id
            LEFT JOIN project_members pm
                ON p.id = pm.project_id
                AND pm.user_id = ?
            WHERE t.id = ?
              AND
              (
                    t.assigned_to = ?
                    OR p.created_by = ?
                    OR pm.role_in_project IN
                    (
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
                numericTaskId,
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
    }
};

module.exports = TaskModel;