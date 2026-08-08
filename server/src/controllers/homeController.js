const HomeModel = require("../models/homeModel");

/*
|--------------------------------------------------------------------------
| Lấy dữ liệu trang Tổng quan
|--------------------------------------------------------------------------
*/

const getHomeData = async (req, res) => {
    try {

        /*
        |--------------------------------------------------------------------------
        | Kiểm tra đăng nhập
        |--------------------------------------------------------------------------
        */

        if (!req.user) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Bạn chưa đăng nhập"
                });
        }

        /*
        |--------------------------------------------------------------------------
        | Lấy thông tin người dùng từ Token
        |--------------------------------------------------------------------------
        */

        const userId = req.user.id;
        const role = req.user.role;

        /*
        |--------------------------------------------------------------------------
        | Lấy dữ liệu Home + Task Burndown
        |--------------------------------------------------------------------------
        |
        | Chạy song song để không phải chờ getHomeData()
        | xong mới chạy getTaskBurndown().
        |
        */

        const [
            data,
            taskBurndown
        ] = await Promise.all([

            HomeModel.getHomeData(
                userId,
                role
            ),

            HomeModel.getTaskBurndown(
                userId,
                role
            )

        ]);

        /*
        |--------------------------------------------------------------------------
        | Trả dữ liệu về Frontend
        |--------------------------------------------------------------------------
        */

        return res
            .status(200)
            .json({
                success: true,

                /*
                 * Bao gồm:
                 *
                 * userRole
                 * summary
                 * statusCounts
                 * projects
                 * tasks
                 * kanbanTasks
                 * upcomingProjects
                 * recentActivities
                 */

                ...data,

                /*
                 * Dữ liệu Task Burndown
                 */

                taskBurndown:
                    Array.isArray(
                        taskBurndown
                    )
                        ? taskBurndown
                        : []
            });

    } catch (error) {

        console.error(
            "Lỗi tải dữ liệu trang Tổng quan:",
            error
        );

        return res
            .status(500)
            .json({
                success: false,

                message:
                    "Không thể tải dữ liệu trang Tổng quan",

                error:
                    error.message
            });
    }
};

module.exports = {
    getHomeData
};