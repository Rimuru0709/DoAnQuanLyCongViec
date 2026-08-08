const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| Hàm chạy query bằng Promise
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Hàm chuyển giá trị thành Date
|--------------------------------------------------------------------------
*/

const toDate = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
};

/*
|--------------------------------------------------------------------------
| Chuẩn hóa ngày bắt đầu
|--------------------------------------------------------------------------
*/

const normalizeStartDate = (value) => {
    const date = toDate(value);

    if (!date) {
        return null;
    }

    date.setHours(
        0,
        0,
        0,
        0
    );

    return date;
};

/*
|--------------------------------------------------------------------------
| Chuẩn hóa ngày kết thúc
|--------------------------------------------------------------------------
*/

const normalizeEndDate = (value) => {
    const date = toDate(value);

    if (!date) {
        return null;
    }

    date.setHours(
        23,
        59,
        59,
        999
    );

    return date;
};

/*
|--------------------------------------------------------------------------
| Format ngày YYYY-MM-DD
|--------------------------------------------------------------------------
|
| Không dùng toISOString() để tránh bị lệch ngày do timezone.
|
*/

const formatLocalDate = (date) => {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
};

const HomeModel = {

    /*
    |--------------------------------------------------------------------------
    | Nội dung hoạt động của Task
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | DỮ LIỆU TRANG TỔNG QUAN
    |--------------------------------------------------------------------------
    */

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

        /*
        |--------------------------------------------------------------------------
        | Điều kiện phân quyền
        |--------------------------------------------------------------------------
        */

        let projectCondition = "";
        let projectParams = [];

        let taskCondition = "";
        let taskParams = [];

        let activityCondition = "";
        let activityParams = [];

        /*
        |--------------------------------------------------------------------------
        | MANAGER
        |--------------------------------------------------------------------------
        |
        | - Xem dự án mình tạo
        | - Hoặc dự án mình tham gia
        |
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
        |
        | - Xem dự án mình tham gia
        | - Xem task được giao
        | - Xem hoạt động liên quan
        |
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
                t.baseline_end_date,

                t.status,
                t.priority,
                t.progress,

                t.completed_at,

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

        /*
        |--------------------------------------------------------------------------
        | Chạy query đồng thời
        |--------------------------------------------------------------------------
        */

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
        */

        let averageProgress = 0;

        /*
        |--------------------------------------------------------------------------
        | MEMBER
        |--------------------------------------------------------------------------
        |
        | Tính tiến độ trung bình từ task của chính thành viên
        |
        */

        if (role === "MEMBER") {

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

        /*
        |--------------------------------------------------------------------------
        | ADMIN / MANAGER
        |--------------------------------------------------------------------------
        |
        | Tính trung bình từ tiến độ dự án
        |
        */

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
        | Dự án sắp đến hạn
        |--------------------------------------------------------------------------
        */

        const currentDate =
            new Date();

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
                .slice(
                    0,
                    5
                );

        /*
        |--------------------------------------------------------------------------
        | Hoạt động gần đây
        |--------------------------------------------------------------------------
        |
        | Nếu bảng activities chưa có dữ liệu
        | thì dùng task làm hoạt động tạm
        |
        */

        let recentActivities =
            activities;

        if (
            recentActivities.length === 0
        ) {

            recentActivities =
                tasks
                    .slice(
                        0,
                        5
                    )
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
        | Trả dữ liệu Tổng quan
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
                tasks.slice(
                    0,
                    12
                ),

            upcomingProjects,

            recentActivities
        };
    },

    /*
    |--------------------------------------------------------------------------
    | TASK BURNDOWN
    |--------------------------------------------------------------------------
    |
    | Trả về 3 đường:
    |
    | 1. Baseline Remaining Tasks
    | 2. Remaining Tasks
    | 3. Remaining Actual Tasks
    |
    */

    getTaskBurndown: async (
        userId,
        role
    ) => {

        const numericUserId =
            Number(userId);

        /*
        |--------------------------------------------------------------------------
        | Kiểm tra User
        |--------------------------------------------------------------------------
        */

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

        const validRoles = [
            "ADMIN",
            "MANAGER",
            "MEMBER"
        ];

        if (
            !validRoles.includes(role)
        ) {
            throw new Error(
                "Vai trò người dùng không hợp lệ"
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Phân quyền Burndown
        |--------------------------------------------------------------------------
        */

        let condition = "";
        let params = [];

        /*
        |--------------------------------------------------------------------------
        | MANAGER
        |--------------------------------------------------------------------------
        */

        if (role === "MANAGER") {

            condition = `
                AND (
                    p.created_by = ?
                    OR EXISTS (
                        SELECT 1
                        FROM project_members pm
                        WHERE pm.project_id = p.id
                          AND pm.user_id = ?
                    )
                )
            `;

            params = [
                numericUserId,
                numericUserId
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | MEMBER
        |--------------------------------------------------------------------------
        */

        if (role === "MEMBER") {

            condition = `
                AND t.assigned_to = ?
            `;

            params = [
                numericUserId
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Lấy dữ liệu Task
        |--------------------------------------------------------------------------
        */

        const sql = `
            SELECT
                t.id,
                t.project_id,
                t.title,

                t.start_date,
                t.end_date,
                t.baseline_end_date,

                t.status,
                t.progress,

                t.completed_at,
                t.created_at,

                p.name AS project_name

            FROM tasks t

            INNER JOIN projects p
                ON t.project_id = p.id

            WHERE
                t.start_date IS NOT NULL

                ${condition}

            ORDER BY
                t.start_date ASC,
                t.id ASC
        `;

        const tasks =
            await executeQuery(
                sql,
                params
            );

        /*
        |--------------------------------------------------------------------------
        | Không có Task
        |--------------------------------------------------------------------------
        */

        if (!tasks.length) {
            return [];
        }

        /*
        |--------------------------------------------------------------------------
        | Lấy danh sách ngày bắt đầu
        |--------------------------------------------------------------------------
        */

        const startDates =
            tasks
                .map(
                    (task) =>
                        normalizeStartDate(
                            task.start_date
                        )
                )
                .filter(Boolean);

        if (
            startDates.length === 0
        ) {
            return [];
        }

        /*
        |--------------------------------------------------------------------------
        | Ngày bắt đầu biểu đồ
        |--------------------------------------------------------------------------
        */

        const firstDate =
            new Date(
                Math.min(
                    ...startDates.map(
                        (date) =>
                            date.getTime()
                    )
                )
            );

        firstDate.setHours(
            0,
            0,
            0,
            0
        );

        /*
        |--------------------------------------------------------------------------
        | Lấy danh sách ngày kết thúc
        |--------------------------------------------------------------------------
        */

        const finishDates = [];

        tasks.forEach(
            (task) => {

                const baselineEnd =
                    normalizeEndDate(
                        task.baseline_end_date
                    );

                const currentEnd =
                    normalizeEndDate(
                        task.end_date
                    );

                const completedAt =
                    normalizeEndDate(
                        task.completed_at
                    );

                if (baselineEnd) {
                    finishDates.push(
                        baselineEnd
                    );
                }

                if (currentEnd) {
                    finishDates.push(
                        currentEnd
                    );
                }

                if (completedAt) {
                    finishDates.push(
                        completedAt
                    );
                }
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Không có ngày kết thúc
        |--------------------------------------------------------------------------
        */

        if (
            finishDates.length === 0
        ) {
            return [];
        }

        /*
        |--------------------------------------------------------------------------
        | Ngày kết thúc biểu đồ
        |--------------------------------------------------------------------------
        */

        const lastDate =
            new Date(
                Math.max(
                    ...finishDates.map(
                        (date) =>
                            date.getTime()
                    )
                )
            );

        lastDate.setHours(
            23,
            59,
            59,
            999
        );

        /*
        |--------------------------------------------------------------------------
        | Số điểm hiển thị
        |--------------------------------------------------------------------------
        |
        | Giữ 6 điểm để biểu đồ không quá dày.
        |
        */

        const POINT_COUNT = 6;

        const totalDuration =
            Math.max(
                1,
                lastDate.getTime() -
                firstDate.getTime()
            );

        const burndown = [];

        /*
        |--------------------------------------------------------------------------
        | Tạo từng điểm
        |--------------------------------------------------------------------------
        */

        for (
            let index = 0;
            index < POINT_COUNT;
            index++
        ) {

            const ratio =
                POINT_COUNT === 1
                    ? 0
                    : index /
                      (
                          POINT_COUNT -
                          1
                      );

            const pointDate =
                new Date(
                    firstDate.getTime() +
                    totalDuration *
                    ratio
                );

            /*
            |--------------------------------------------------------------------------
            | 1. BASELINE REMAINING TASKS
            |--------------------------------------------------------------------------
            |
            | Số task theo deadline kế hoạch ban đầu
            | vẫn còn tại mốc thời gian này.
            |
            */

            const baselineRemainingTasks =
                tasks.filter(
                    (task) => {

                        const baselineEnd =
                            normalizeEndDate(
                                task.baseline_end_date ||
                                task.end_date
                            );

                        if (!baselineEnd) {
                            return false;
                        }

                        return (
                            baselineEnd >
                            pointDate
                        );
                    }
                ).length;

            /*
            |--------------------------------------------------------------------------
            | 2. REMAINING TASKS
            |--------------------------------------------------------------------------
            |
            | Số task theo deadline hiện tại
            | vẫn còn tại mốc thời gian này.
            |
            */

            const remainingTasks =
                tasks.filter(
                    (task) => {

                        const currentEnd =
                            normalizeEndDate(
                                task.end_date
                            );

                        if (!currentEnd) {
                            return false;
                        }

                        return (
                            currentEnd >
                            pointDate
                        );
                    }
                ).length;

            /*
            |--------------------------------------------------------------------------
            | 3. REMAINING ACTUAL TASKS
            |--------------------------------------------------------------------------
            |
            | Số task thực tế chưa hoàn thành
            | tại mốc thời gian này.
            |
            */

            const remainingActualTasks =
                tasks.filter(
                    (task) => {

                        /*
                         * Nếu chưa có completed_at:
                         * task vẫn chưa hoàn thành.
                         */

                        if (
                            !task.completed_at
                        ) {
                            return true;
                        }

                        const completedAt =
                            toDate(
                                task.completed_at
                            );

                        /*
                         * Nếu completed_at lỗi:
                         * coi task vẫn chưa hoàn thành.
                         */

                        if (!completedAt) {
                            return true;
                        }

                        /*
                         * Nếu hoàn thành sau pointDate,
                         * tại pointDate task vẫn còn.
                         */

                        return (
                            completedAt >
                            pointDate
                        );
                    }
                ).length;

            /*
            |--------------------------------------------------------------------------
            | Thêm điểm vào biểu đồ
            |--------------------------------------------------------------------------
            */

            burndown.push({

                date:
                    formatLocalDate(
                        pointDate
                    ),

                baselineRemainingTasks,

                remainingTasks,

                remainingActualTasks
            });
        }

        return burndown;
    }
};

module.exports = HomeModel;