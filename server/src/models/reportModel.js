const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| Hàm thêm điều kiện lọc dự án
|--------------------------------------------------------------------------
*/

const buildProjectFilter = (
    filters,
    projectAlias = "p"
) => {
    const conditions = [];
    const params = [];

    if (filters.projectName) {
        conditions.push(
            `${projectAlias}.name LIKE ?`
        );

        params.push(
            `%${filters.projectName}%`
        );
    }

    if (filters.month) {
        conditions.push(
            `MONTH(${projectAlias}.start_date) = ?`
        );

        params.push(
            filters.month
        );
    }

    if (filters.quarter) {
        conditions.push(
            `QUARTER(${projectAlias}.start_date) = ?`
        );

        params.push(
            filters.quarter
        );
    }

    if (filters.year) {
        conditions.push(
            `YEAR(${projectAlias}.start_date) = ?`
        );

        params.push(
            filters.year
        );
    }

    return {
        whereSql:
            conditions.length > 0
                ? ` AND ${conditions.join(
                    " AND "
                )}`
                : "",

        params
    };
};

/*
|--------------------------------------------------------------------------
| Hàm thêm điều kiện lọc công việc
|--------------------------------------------------------------------------
*/

const buildTaskFilter = (
    filters,
    taskAlias = "t",
    projectAlias = "p"
) => {
    const conditions = [];
    const params = [];

    if (filters.projectName) {
        conditions.push(
            `${projectAlias}.name LIKE ?`
        );

        params.push(
            `%${filters.projectName}%`
        );
    }

    if (filters.month) {
        conditions.push(
            `MONTH(${taskAlias}.start_date) = ?`
        );

        params.push(
            filters.month
        );
    }

    if (filters.quarter) {
        conditions.push(
            `QUARTER(${taskAlias}.start_date) = ?`
        );

        params.push(
            filters.quarter
        );
    }

    if (filters.year) {
        conditions.push(
            `YEAR(${taskAlias}.start_date) = ?`
        );

        params.push(
            filters.year
        );
    }

    return {
        whereSql:
            conditions.length > 0
                ? ` AND ${conditions.join(
                    " AND "
                )}`
                : "",

        params
    };
};

const ReportModel = {
    /*
    |--------------------------------------------------------------------------
    | Thống kê tổng quan
    |--------------------------------------------------------------------------
    |
    | Trả về:
    | - Tổng số dự án
    | - Tổng số tài liệu
    | - Tổng dung lượng tài liệu
    |
    */

    getGeneralStats: (
        filters,
        callback
    ) => {
        const projectFilter =
            buildProjectFilter(
                filters,
                "p"
            );

        const documentProjectFilter =
            buildProjectFilter(
                filters,
                "p"
            );

        const sql = `
            SELECT
                (
                    SELECT COUNT(*)
                    FROM projects p
                    WHERE 1 = 1
                    ${projectFilter.whereSql}
                ) AS total_projects,

                (
                    SELECT COUNT(d.id)
                    FROM documents d
                    INNER JOIN projects p
                        ON d.project_id = p.id
                    WHERE 1 = 1
                    ${documentProjectFilter.whereSql}
                ) AS total_files,

                (
                    SELECT
                        COALESCE(
                            SUM(d.file_size),
                            0
                        )
                    FROM documents d
                    INNER JOIN projects p
                        ON d.project_id = p.id
                    WHERE 1 = 1
                    ${documentProjectFilter.whereSql}
                ) AS total_size_bytes
        `;

        const params = [
            ...projectFilter.params,
            ...documentProjectFilter.params,
            ...documentProjectFilter.params
        ];

        db.query(
            sql,
            params,
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Thống kê tài liệu theo từng dự án
    |--------------------------------------------------------------------------
    */

    getStatsByProject: (
        filters,
        callback
    ) => {
        const projectFilter =
            buildProjectFilter(
                filters,
                "p"
            );

        const sql = `
            SELECT
                p.id AS project_id,
                p.name AS project_name,

                COUNT(d.id) AS file_count,

                COALESCE(
                    SUM(d.file_size),
                    0
                ) AS total_size_bytes

            FROM projects p

            LEFT JOIN documents d
                ON p.id = d.project_id

            WHERE 1 = 1
            ${projectFilter.whereSql}

            GROUP BY
                p.id,
                p.name

            ORDER BY
                file_count DESC,
                p.id DESC
        `;

        db.query(
            sql,
            projectFilter.params,
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Thống kê công việc theo trạng thái
    |--------------------------------------------------------------------------
    */

    getTaskStats: (
        filters,
        callback
    ) => {
        const taskFilter =
            buildTaskFilter(
                filters,
                "t",
                "p"
            );

        const sql = `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN t.status = 'CHUA_LAM'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS todo,

                COALESCE(
                    SUM(
                        CASE
                            WHEN t.status IN (
                                'DANG_LAM',
                                'DANG_REVIEW'
                            )
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS in_progress,

                COALESCE(
                    SUM(
                        CASE
                            WHEN t.status = 'HOAN_THANH'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS done,

                COALESCE(
                    SUM(
                        CASE
                            WHEN
                                t.status = 'QUA_HAN'
                                OR (
                                    t.status <> 'HOAN_THANH'
                                    AND t.end_date IS NOT NULL
                                    AND t.end_date <
                                        CURDATE()
                                )
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS overdue

            FROM tasks t

            INNER JOIN projects p
                ON t.project_id = p.id

            WHERE 1 = 1
            ${taskFilter.whereSql}
        `;

        db.query(
            sql,
            taskFilter.params,
            callback
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Thống kê khối lượng công việc theo thành viên
    |--------------------------------------------------------------------------
    |
    | Trả về: user_id, full_name, total_tasks, active_tasks, done_tasks
    | active_tasks > 5 → cảnh báo quá tải
    |
    */

    getWorkloadStats: (callback) => {
        const sql = `
            SELECT
                u.id            AS user_id,
                u.full_name,
                u.role          AS user_role,
                COUNT(t.id)     AS total_tasks,
                SUM(CASE WHEN t.status IN ('CHUA_LAM','DANG_LAM','DANG_REVIEW') THEN 1 ELSE 0 END) AS active_tasks,
                SUM(CASE WHEN t.status = 'HOAN_THANH' THEN 1 ELSE 0 END) AS done_tasks,
                SUM(CASE WHEN t.status = 'QUA_HAN'
                          OR (t.status <> 'HOAN_THANH' AND t.end_date IS NOT NULL AND t.end_date < CURDATE())
                    THEN 1 ELSE 0 END) AS overdue_tasks
            FROM users u
            INNER JOIN tasks t ON t.assigned_to = u.id
            GROUP BY u.id, u.full_name, u.role
            ORDER BY active_tasks DESC
        `;

        db.query(sql, [], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Thống kê thời gian (Estimated vs Actual Hours)
    |--------------------------------------------------------------------------
    */

    getTimeTrackingStats: (filters, callback) => {
        const taskFilter = buildTaskFilter(filters, "t", "p");

        const sql = `
            SELECT
                t.id              AS task_id,
                t.title           AS task_title,
                t.status,
                t.priority,
                t.estimated_hours,
                COALESCE(SUM(tl.hours), 0) AS actual_hours,
                t.estimated_hours - COALESCE(SUM(tl.hours), 0) AS remaining_hours,
                p.id              AS project_id,
                p.name            AS project_name,
                u.full_name       AS assignee_name
            FROM tasks t
            INNER JOIN projects p ON p.id = t.project_id
            LEFT JOIN  users    u ON u.id = t.assigned_to
            LEFT JOIN  time_logs tl ON tl.task_id = t.id
            WHERE t.estimated_hours IS NOT NULL
            ${taskFilter.whereSql}
            GROUP BY t.id, t.title, t.status, t.priority, t.estimated_hours,
                     p.id, p.name, u.full_name
            ORDER BY actual_hours DESC
            LIMIT 50
        `;

        db.query(sql, taskFilter.params, callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Thống kê bottleneck — task quá hạn lâu nhất
    |--------------------------------------------------------------------------
    */

    getBottleneckStats: (callback) => {
        const sql = `
            SELECT
                t.id,
                t.title,
                t.status,
                t.priority,
                t.end_date,
                DATEDIFF(CURDATE(), t.end_date) AS days_overdue,
                p.name       AS project_name,
                u.full_name  AS assignee_name
            FROM tasks t
            INNER JOIN projects p ON p.id = t.project_id
            LEFT JOIN  users    u ON u.id = t.assigned_to
            WHERE
                t.status <> 'HOAN_THANH'
                AND t.end_date IS NOT NULL
                AND t.end_date < CURDATE()
            ORDER BY days_overdue DESC
            LIMIT 20
        `;

        db.query(sql, [], callback);
    },

    /*
    |--------------------------------------------------------------------------
    | Thống kê theo loại file
    |--------------------------------------------------------------------------
    */

    getStatsByFileType: (
        callback
    ) => {
        const sql = `
            SELECT
                file_type,
                COUNT(*) AS count
            FROM documents
            GROUP BY file_type
            ORDER BY count DESC
        `;

        db.query(
            sql,
            [],
            callback
        );
    }
};

module.exports = ReportModel;