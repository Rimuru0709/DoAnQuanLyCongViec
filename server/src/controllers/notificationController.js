const Notification = require("../models/notificationModel");

// Lấy danh sách thông báo (Phục vụ Infinite Scroll / Pagination ở React)
const getUserNotifications = (req, res) => {
    const userId = req.user?.id || 1; // Fallback về 1 để test nếu chưa bật Middleware Authen
    
    // Ép kiểu các tham số phân trang ngay lập tức để tránh lỗi cú pháp SQL ở Model
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const filter = req.query.filter || "all";

    Notification.getByUserId(userId, filter, page, limit, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                message: "Lỗi cơ sở dữ liệu khi tải danh sách thông báo", 
                error: err.message || err 
            });
        }
        
        res.json({
            results: results || [],
            page: page,
            limit: limit
        });
    });
};

// Đánh dấu đã đọc 1 cái
const readNotification = (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    Notification.markAsRead(id, userId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                message: "Không thể cập nhật trạng thái đã đọc cho thông báo này", 
                error: err.message || err 
            });
        }
        res.json({ message: "Đã đánh dấu đọc thông báo này thành công" });
    });
};

// Đọc hết sạch sành sanh
const readAllNotifications = (req, res) => {
    const userId = req.user?.id || 1;

    Notification.markAllAsRead(userId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                message: "Không thể cập nhật trạng thái đã đọc cho toàn bộ thông báo", 
                error: err.message || err 
            });
        }
        res.json({ message: "Đã đánh dấu đọc toàn bộ hòm thư" });
    });
};

// Xóa 1 thông báo cụ thể
const removeNotification = (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    Notification.deleteById(id, userId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                message: "Không thể xóa thông báo này", 
                error: err.message || err 
            });
        }
        res.json({ message: "Xóa thông báo thành công" });
    });
};

// Dọn sạch thùng rác hòm thư thông báo
const cleanAllNotifications = (req, res) => {
    const userId = req.user?.id || 1;

    Notification.clearAll(userId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                message: "Không thể dọn sạch hòm thư thông báo", 
                error: err.message || err 
            });
        }
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