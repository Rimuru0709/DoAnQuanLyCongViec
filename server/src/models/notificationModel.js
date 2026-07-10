const db = require("../config/db");

// 1. Lấy danh sách thông báo có phân trang và bộ lọc
const getByUserId = (userId, filter, page, limit, callback) => {
    const offset = (page - 1) * limit;
    let sql = "SELECT * FROM notifications WHERE user_id = ?";
    let params = [userId];

    // Xử lý bộ lọc nếu người dùng chọn tab "Chưa đọc"
    if (filter === "unread") {
        sql += " AND is_read = 0";
    }

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    db.query(sql, params, callback);
};

// 2. Tạo thông báo mới (Hệ thống tự động gọi khi có task mới, quá hạn...)
const create = (data, callback) => {
    const sql = `
        INSERT INTO notifications (user_id, title, content, type) 
        VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [data.user_id, data.title, data.content, data.type || "info"], callback);
};

// 3. Đánh dấu 1 thông báo đã đọc
const markAsRead = (id, userId, callback) => {
    const sql = "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?";
    db.query(sql, [id, userId], callback);
};

// 4. Đánh dấu tất cả thông báo của User này đã đọc
const markAllAsRead = (userId, callback) => {
    const sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";
    db.query(sql, [userId], callback);
};

// 5. Xóa 1 thông báo
const deleteById = (id, userId, callback) => {
    const sql = "DELETE FROM notifications WHERE id = ? AND user_id = ?";
    db.query(sql, [id, userId], callback);
};

// 6. Xóa sạch hòm thư thông báo của User
const clearAll = (userId, callback) => {
    const sql = "DELETE FROM notifications WHERE user_id = ?";
    db.query(sql, [userId], callback);
};

module.exports = {
    getByUserId,
    create,
    markAsRead,
    markAllAsRead,
    deleteById,
    clearAll
};