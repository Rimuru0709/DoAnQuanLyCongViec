const ReportModel = require(
    "../models/reportModel"
);

/*
|--------------------------------------------------------------------------
| Chuyển đổi Bytes sang định dạng dễ đọc
|--------------------------------------------------------------------------
*/

const formatBytes = (
    bytes,
    decimals = 2
) => {
    const numericBytes =
        Number(bytes) || 0;

    if (numericBytes === 0) {
        return "0 Bytes";
    }

    const k = 1024;

    const decimalPlaces =
        decimals < 0
            ? 0
            : decimals;

    const sizes = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const index = Math.floor(
        Math.log(numericBytes) /
        Math.log(k)
    );

    const safeIndex = Math.min(
        index,
        sizes.length - 1
    );

    const value =
        numericBytes /
        Math.pow(k, safeIndex);

    return (
        parseFloat(
            value.toFixed(
                decimalPlaces
            )
        ) +
        " " +
        sizes[safeIndex]
    );
};

/*
|--------------------------------------------------------------------------
| Chuyển callback của Model thành Promise
|--------------------------------------------------------------------------
*/

const getGeneralStatsPromise = (
    filters
) => {
    return new Promise(
        (resolve, reject) => {
            ReportModel.getGeneralStats(
                filters,
                (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(data);
                }
            );
        }
    );
};

const getStatsByProjectPromise = (
    filters
) => {
    return new Promise(
        (resolve, reject) => {
            ReportModel.getStatsByProject(
                filters,
                (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(data);
                }
            );
        }
    );
};

const getTaskStatsPromise = (
    filters
) => {
    return new Promise(
        (resolve, reject) => {
            ReportModel.getTaskStats(
                filters,
                (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(data);
                }
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Đọc và kiểm tra tham số số
|--------------------------------------------------------------------------
*/

const parseOptionalInteger = (
    value
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const numericValue =
        Number(value);

    if (
        !Number.isInteger(
            numericValue
        )
    ) {
        return null;
    }

    return numericValue;
};

/*
|--------------------------------------------------------------------------
| GET /api/reports/dashboard
|--------------------------------------------------------------------------
|
| Hỗ trợ:
| - Tên dự án
| - Tháng
| - Quý
| - Năm
|
*/

const getDashboardReport =
    async (req, res) => {
        try {
            const projectName =
                String(
                    req.query.projectName ||
                    ""
                ).trim();

            const month =
                parseOptionalInteger(
                    req.query.month
                );

            const quarter =
                parseOptionalInteger(
                    req.query.quarter
                );

            const year =
                parseOptionalInteger(
                    req.query.year
                );

            /*
            |--------------------------------------------------------------------------
            | Kiểm tra bộ lọc
            |--------------------------------------------------------------------------
            */

            if (
                month !== null &&
                (
                    month < 1 ||
                    month > 12
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Tháng phải nằm trong khoảng từ 1 đến 12"
                    });
            }

            if (
                quarter !== null &&
                (
                    quarter < 1 ||
                    quarter > 4
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Quý phải nằm trong khoảng từ 1 đến 4"
                    });
            }

            if (
                year !== null &&
                (
                    year < 1900 ||
                    year > 2100
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Năm phải nằm trong khoảng từ 1900 đến 2100"
                    });
            }

            /*
            |--------------------------------------------------------------------------
            | Không cho lọc cả tháng và quý cùng lúc
            |--------------------------------------------------------------------------
            */

            if (
                month !== null &&
                quarter !== null
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Chỉ được chọn Tháng hoặc Quý, không chọn đồng thời cả hai"
                    });
            }

            const filters = {
                projectName,
                month,
                quarter,
                year
            };

            /*
            |--------------------------------------------------------------------------
            | Chạy các thống kê song song
            |--------------------------------------------------------------------------
            */

            const [
                generalResult,
                projectResult,
                taskResult
            ] = await Promise.all([
                getGeneralStatsPromise(
                    filters
                ),

                getStatsByProjectPromise(
                    filters
                ),

                getTaskStatsPromise(
                    filters
                )
            ]);

            const general =
                Array.isArray(
                    generalResult
                )
                    ? generalResult[0] ||
                      {}
                    : {};

            const taskStats =
                Array.isArray(
                    taskResult
                )
                    ? taskResult[0] ||
                      {}
                    : {};

            const projects =
                Array.isArray(
                    projectResult
                )
                    ? projectResult
                    : [];

            /*
            |--------------------------------------------------------------------------
            | Tổng số công việc
            |--------------------------------------------------------------------------
            */

            const todo =
                Number(
                    taskStats.todo
                ) || 0;

            const inProgress =
                Number(
                    taskStats.in_progress
                ) || 0;

            const done =
                Number(
                    taskStats.done
                ) || 0;

            const overdue =
                Number(
                    taskStats.overdue
                ) || 0;

            const totalTasks =
                todo +
                inProgress +
                done +
                overdue;

            /*
            |--------------------------------------------------------------------------
            | Danh sách năm
            |--------------------------------------------------------------------------
            */

            const availableYears =
                Array.from(
                    {
                        length: 101
                    },
                    (
                        _,
                        index
                    ) =>
                        2000 +
                        index
                );

            /*
            |--------------------------------------------------------------------------
            | Trả dữ liệu
            |--------------------------------------------------------------------------
            */

            return res
                .status(200)
                .json({
                    success: true,

                    filters: {
                        projectName,
                        month,
                        quarter,
                        year
                    },

                    summary: {
                        totalProjects:
                            Number(
                                general.total_projects
                            ) || 0,

                        totalFiles:
                            Number(
                                general.total_files
                            ) || 0,

                        totalTasks,

                        formattedTotalSize:
                            formatBytes(
                                general.total_size_bytes
                            ),

                        rawTotalSizeBytes:
                            Number(
                                general.total_size_bytes
                            ) || 0
                    },

                    projects:
                        projects.map(
                            (
                                project
                            ) => ({
                                id:
                                    project.project_id,

                                name:
                                    project.project_name,

                                fileCount:
                                    Number(
                                        project.file_count
                                    ) || 0,

                                storageUsed:
                                    formatBytes(
                                        project.total_size_bytes
                                    ),

                                rawTotalSizeBytes:
                                    Number(
                                        project.total_size_bytes
                                    ) || 0
                            })
                        ),

                    taskSummary: {
                        todo,
                        inProgress,
                        done,
                        overdue
                    },

                    availableYears
                });
        } catch (error) {
            console.error(
                "Lỗi Controller Báo Cáo:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Hệ thống không thể tổng hợp báo cáo",
                    error:
                        error.message
                });
        }
    };

module.exports = {
    getDashboardReport
};