const HomeModel = require(
    "../models/homeModel"
);

const getHomeData = async (
    req,
    res
) => {
    try {
        if (!req.user) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Bạn chưa đăng nhập"
                });
        }

        const data =
            await HomeModel.getHomeData(
                req.user.id,
                req.user.role
            );

        return res
            .status(200)
            .json({
                success: true,
                ...data
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