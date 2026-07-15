const Notification = require(
    "../models/notificationModel"
);

/*
|--------------------------------------------------------------------------
| Lấy danh sách thông báo
|--------------------------------------------------------------------------
*/

const getUserNotifications = (
    req,
    res
) => {
    const userId = req.user.id;

    const page = Math.max(
        1,
        parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
        50,
        Math.max(
            1,
            parseInt(req.query.limit, 10) || 10
        )
    );

    const filter =
        req.query.filter === "unread"
            ? "unread"
            : "all";

    Notification.getByUserId(
        userId,
        filter,
        page,
        limit,
        (err, results) => {
            if (err) {
                console.error(
                    "Lỗi tải thông báo:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể tải danh sách thông báo",
                    error: err.message
                });
            }

            return res.status(200).json({
                success: true,
                results:
                    Array.isArray(results)
                        ? results
                        : [],
                page,
                limit
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Đánh dấu một thông báo đã đọc
|--------------------------------------------------------------------------
*/

const readNotification = (
    req,
    res
) => {
    const notificationId =
        Number(req.params.id);

    const userId = req.user.id;

    if (
        !Number.isInteger(notificationId) ||
        notificationId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Mã thông báo không hợp lệ"
        });
    }

    Notification.markAsRead(
        notificationId,
        userId,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi đánh dấu đã đọc:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể cập nhật thông báo",
                    error: err.message
                });
            }

            if (
                !result ||
                result.affectedRows === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy thông báo"
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Đã đánh dấu thông báo là đã đọc"
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Đánh dấu tất cả đã đọc
|--------------------------------------------------------------------------
*/

const readAllNotifications = (
    req,
    res
) => {
    const userId = req.user.id;

    Notification.markAllAsRead(
        userId,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi đánh dấu tất cả đã đọc:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể đánh dấu tất cả thông báo",
                    error: err.message
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Đã đánh dấu tất cả thông báo là đã đọc",
                affectedRows:
                    result?.affectedRows || 0
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Xóa một thông báo
|--------------------------------------------------------------------------
*/

const removeNotification = (
    req,
    res
) => {
    const notificationId =
        Number(req.params.id);

    const userId = req.user.id;

    if (
        !Number.isInteger(notificationId) ||
        notificationId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Mã thông báo không hợp lệ"
        });
    }

    Notification.deleteById(
        notificationId,
        userId,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi xóa thông báo:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể xóa thông báo",
                    error: err.message
                });
            }

            if (
                !result ||
                result.affectedRows === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy thông báo"
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Xóa thông báo thành công"
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Xóa toàn bộ thông báo
|--------------------------------------------------------------------------
*/

const cleanAllNotifications = (
    req,
    res
) => {
    const userId = req.user.id;

    Notification.clearAll(
        userId,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi xóa toàn bộ thông báo:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể xóa toàn bộ thông báo",
                    error: err.message
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Đã xóa toàn bộ thông báo",
                affectedRows:
                    result?.affectedRows || 0
            });
        }
    );
};

module.exports = {
    getUserNotifications,
    readNotification,
    readAllNotifications,
    removeNotification,
    cleanAllNotifications
};