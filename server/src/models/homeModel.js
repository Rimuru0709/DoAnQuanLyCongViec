const db = require("../config/db");

const executeQuery = (
    sql,
    params = []
) => {
    return new Promise(
        (resolve, reject) => {
            db.query(
                sql,
                params,
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(result);
                }
            );
        }
    );
};

const HomeModel = {
    getTaskActivityText: (task) => {
        const userName =
            task.assignee_name ||
            "Thành viên";

        switch (task.status) {
            case "HOAN_THANH":
                return `${userName} đã hoàn thành "${task.title}"`;

            case "DANG_REVIEW":
                return `${userName} đang review "${task.title}"`;

            case "DANG_LAM":
                return `${userName} đang thực hiện "${task.title}"`;

            case "QUA_HAN":
                return `Công việc "${task.title}" đã quá hạn`;

            default:
                return `${userName} được giao "${task.title}"`;
        }
    },

    getHomeData: async (
        userId,
        role
    ) => {
        const numericUserId =
            Number(userId);

        const validRoles = [
            "ADMIN",
            "MANAGER",
            "MEMBER"
        ];

        if (
            !Number.isInteger(
                numericUserId
            ) ||
            numericUserId <= 0
        ) {
            throw new Error(
                "Mã người dùng không hợp lệ"
            );
        }

        if (
            !validRoles.includes(role)
        ) {
            throw new Error(
                "Vai trò người dùng không hợp lệ"
            );
        }

        let projectCondition = "";
        let projectParams = [];

        let taskCondition = "";
        let taskParams = [];

        let activityCondition = "";
        let activityParams = [];

        /*
        |--------------------------------------------------------------------------
        | ADMIN
        |--------------------------------------------------------------------------
        | Không thêm điều kiện WHERE.
        | Admin được xem toàn bộ dự án, công việc và hoạt động.
        */

        /*
        |--------------------------------------------------------------------------
        | MANAGER
        |--------------------------------------------------------------------------
        | Chỉ xem:
        | - Dự án mình tạo.
        | - Hoặc dự án mình tham gia.
        */

        if (role === "MANAGER") {
            projectCondition = `
                WHERE
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
            `;

            projectParams = [
                numericUserId,
                numericUserId
            ];

            taskCondition = `
                WHERE
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
            `;

            taskParams = [
                numericUserId,
                numericUserId
            ];

            activityCondition = `
                WHERE
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
            `;

            activityParams = [
                numericUserId,
                numericUserId
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | MEMBER
        |--------------------------------------------------------------------------
        | Chỉ xem:
        | - Dự án mình tham gia.
        | - Công việc được giao cho mình.
        | - Hoạt động liên quan đến mình.
        */

        if (role === "MEMBER") {
            projectCondition = `
                WHERE EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                      AND pm.user_id = ?
                )
            `;

            projectParams = [
                numericUserId
            ];

            taskCondition = `
                WHERE t.assigned_to = ?
            `;

            taskParams = [
                numericUserId
            ];

            activityCondition = `
                WHERE
                    a.user_id = ?
                    OR t.assigned_to = ?
            `;

            activityParams = [
                numericUserId,
                numericUserId
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Lấy danh sách dự án
        |--------------------------------------------------------------------------
        */

        const projectsSql = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.customer,
                p.manager_name,
                p.start_date,
                p.end_date,
                p.status,
                p.progress,
                p.color,
                p.created_by,
                p.created_at
            FROM projects p
            ${projectCondition}
            ORDER BY p.id DESC
        `;

        /*
        |--------------------------------------------------------------------------
        | Lấy danh sách công việc
        |--------------------------------------------------------------------------
        */

        const tasksSql = `
            SELECT
                t.id,
                t.project_id,
                t.column_id,
                t.title,
                t.description,
                t.assigned_to,
                t.start_date,
                t.end_date,
                t.status,
                t.priority,
                t.progress,
                t.task_order,
                t.created_at,

                p.name AS project_name,
                p.color AS project_color,

                u.full_name AS assignee_name
            FROM tasks t
            INNER JOIN projects p
                ON t.project_id = p.id
            LEFT JOIN users u
                ON t.assigned_to = u.id
            ${taskCondition}
            ORDER BY t.id DESC
        `;

        /*
        |--------------------------------------------------------------------------
        | Lấy hoạt động gần đây
        |--------------------------------------------------------------------------
        */

        const activitiesSql = `
            SELECT
                a.id,
                a.project_id,
                a.task_id,
                a.user_id,
                a.action,
                a.content,
                a.created_at,

                u.full_name,

                p.name AS project_name,

                t.title AS task_title,
                t.assigned_to
            FROM activities a
            LEFT JOIN users u
                ON a.user_id = u.id
            LEFT JOIN projects p
                ON a.project_id = p.id
            LEFT JOIN tasks t
                ON a.task_id = t.id
            ${activityCondition}
            ORDER BY a.id DESC
            LIMIT 5
        `;

        const [
            projects,
            tasks,
            activities
        ] = await Promise.all([
            executeQuery(
                projectsSql,
                projectParams
            ),

            executeQuery(
                tasksSql,
                taskParams
            ),

            executeQuery(
                activitiesSql,
                activityParams
            )
        ]);

        /*
        |--------------------------------------------------------------------------
        | Đếm công việc theo trạng thái
        |--------------------------------------------------------------------------
        */

        const statusCounts = {
            CHUA_LAM: 0,
            DANG_LAM: 0,
            DANG_REVIEW: 0,
            HOAN_THANH: 0,
            QUA_HAN: 0
        };

        tasks.forEach((task) => {
            if (
                Object.prototype
                    .hasOwnProperty.call(
                        statusCounts,
                        task.status
                    )
            ) {
                statusCounts[
                    task.status
                ] += 1;
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Tính tiến độ trung bình
        |--------------------------------------------------------------------------
        |
        | MEMBER:
        | - Tính trung bình các công việc được giao.
        |
        | ADMIN / MANAGER:
        | - Tính trung bình các dự án được phép xem.
        */

        let averageProgress = 0;

        if (
            role === "MEMBER"
        ) {
            if (tasks.length > 0) {
                const totalProgress =
                    tasks.reduce(
                        (
                            sum,
                            task
                        ) =>
                            sum +
                            Number(
                                task.progress ||
                                0
                            ),
                        0
                    );

                averageProgress =
                    Math.round(
                        totalProgress /
                        tasks.length
                    );
            }
        } else if (
            projects.length > 0
        ) {
            const totalProgress =
                projects.reduce(
                    (
                        sum,
                        project
                    ) =>
                        sum +
                        Number(
                            project.progress ||
                            0
                        ),
                    0
                );

            averageProgress =
                Math.round(
                    totalProgress /
                    projects.length
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Lấy dự án sắp đến hạn
        |--------------------------------------------------------------------------
        */

        const currentDate = new Date();

        currentDate.setHours(
            0,
            0,
            0,
            0
        );

        const upcomingProjects =
            projects
                .filter(
                    (project) => {
                        if (
                            !project.end_date
                        ) {
                            return false;
                        }

                        if (
                            project.status ===
                            "HOAN_THANH"
                        ) {
                            return false;
                        }

                        const deadline =
                            new Date(
                                project.end_date
                            );

                        deadline.setHours(
                            23,
                            59,
                            59,
                            999
                        );

                        return (
                            deadline >=
                            currentDate
                        );
                    }
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        new Date(
                            first.end_date
                        ) -
                        new Date(
                            second.end_date
                        )
                )
                .slice(0, 5);

        /*
        |--------------------------------------------------------------------------
        | Hoạt động gần đây
        |--------------------------------------------------------------------------
        |
        | Nếu bảng activities chưa có dữ liệu,
        | dùng danh sách task làm hoạt động tạm.
        */

        let recentActivities =
            activities;

        if (
            recentActivities.length ===
            0
        ) {
            recentActivities =
                tasks
                    .slice(0, 5)
                    .map(
                        (task) => ({
                            id:
                                `task-${task.id}`,

                            project_id:
                                task.project_id,

                            task_id:
                                task.id,

                            full_name:
                                task.assignee_name ||
                                "Thành viên",

                            content:
                                HomeModel
                                    .getTaskActivityText(
                                        task
                                    ),

                            created_at:
                                task.created_at ||
                                null
                        })
                    );
        }

        /*
        |--------------------------------------------------------------------------
        | Dữ liệu trả về
        |--------------------------------------------------------------------------
        */

        return {
            userRole: role,

            summary: {
                totalProjects:
                    projects.length,

                totalTasks:
                    tasks.length,

                doingTasks:
                    statusCounts
                        .DANG_LAM,

                reviewTasks:
                    statusCounts
                        .DANG_REVIEW,

                completedTasks:
                    statusCounts
                        .HOAN_THANH,

                todoTasks:
                    statusCounts
                        .CHUA_LAM,

                overdueTasks:
                    statusCounts
                        .QUA_HAN,

                averageProgress
            },

            statusCounts,

            projects,

            tasks,

            kanbanTasks:
                tasks.slice(0, 12),

            upcomingProjects,

            recentActivities
        };
    }
};

module.exports = HomeModel;