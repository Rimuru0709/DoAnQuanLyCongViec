const Notification = require("../models/notificationModel");

// Lấy danh sách thông báo (Phục vụ Infinite Scroll / Pagination ở React)
const getUserNotifications = (req, res) => {
    const userId = req.user?.id || 1; // Fallback về 1 để test nếu chưa bật Middleware Authen
    const { page = 1, limit = 10, filter = "all" } = req.query;

    Notification.getByUserId(userId, filter, page, limit, (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err });
        
        res.json({
            results: results,
            page: Number(page),
            limit: Number(limit)
        });
    });
};

// Đánh dấu đã đọc 1 cái
const readNotification = (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    Notification.markAsRead(id, userId, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Đã đánh dấu đọc thông báo này thành công" });
    });
};

// Đọc hết sạch sành sanh
const readAllNotifications = (req, res) => {
    const userId = req.user?.id || 1;

    Notification.markAllAsRead(userId, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Đã đánh dấu đọc toàn bộ hòm thư" });
    });
};

// Xóa 1 thông báo cụ thể
const removeNotification = (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    Notification.deleteById(id, userId, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Xóa thông báo thành công" });
    });
};

// Dọn sạch thùng rác hòm thư thông báo
const cleanAllNotifications = (req, res) => {
    const userId = req.user?.id || 1;

    Notification.clearAll(userId, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Đã xóa sạch hòm thư thông báo" });
    });
};

module.exports = {
    getUserNotifications,
    readNotification,
    readAllNotifications,
    removeNotification,
    cleanAllNotifications
};