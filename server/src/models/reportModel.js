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