const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| Lấy thông báo theo người dùng
|--------------------------------------------------------------------------
*/

const getByUserId = (
    userId,
    filter,
    page,
    limit,
    callback
) => {
    const numericUserId =
        Number(userId);

    const safePage = Math.max(
        1,
        parseInt(page, 10) || 1
    );

    const safeLimit = Math.min(
        50,
        Math.max(
            1,
            parseInt(limit, 10) || 10
        )
    );

    const safeOffset =
        (safePage - 1) * safeLimit;

    if (
        !Number.isInteger(numericUserId) ||
        numericUserId <= 0
    ) {
        return callback(
            new Error(
                "Mã người dùng không hợp lệ"
            )
        );
    }

    let sql = `
        SELECT
            id,
            user_id,
            title,
            content,
            type,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = ?
    `;

    const params = [
        numericUserId
    ];

    if (filter === "unread") {
        sql += `
            AND is_read = 0
        `;
    }

    sql += `
        ORDER BY id DESC
        LIMIT ${safeLimit}
        OFFSET ${safeOffset}
    `;

    db.query(
        sql,
        params,
        callback
    );
};

/*
|--------------------------------------------------------------------------
| Tạo thông báo
|--------------------------------------------------------------------------
*/

const create = (
    data,
    callback
) => {
    const userId =
        Number(data.user_id);

    if (
        !Number.isInteger(userId) ||
        userId <= 0
    ) {
        return callback(
            new Error(
                "Mã người nhận không hợp lệ"
            )
        );
    }

    const title =
        String(data.title || "").trim();

    const content =
        String(data.content || "").trim();

    if (!title || !content) {
        return callback(
            new Error(
                "Tiêu đề và nội dung thông báo không được để trống"
            )
        );
    }

    const sql = `
        INSERT INTO notifications
        (
            user_id,
            title,
            content,
            type,
            is_read
        )
        VALUES (?, ?, ?, ?, 0)
    `;

    db.query(
        sql,
        [
            userId,
            title,
            content,
            data.type || "info"
        ],
        callback
    );
};

/*
|--------------------------------------------------------------------------
| Đánh dấu một thông báo đã đọc
|--------------------------------------------------------------------------
*/

const markAsRead = (
    id,
    userId,
    callback
) => {
    const sql = `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
          AND user_id = ?
    `;

    db.query(
        sql,
        [
            Number(id),
            Number(userId)
        ],
        callback
    );
};

/*
|--------------------------------------------------------------------------
| Đánh dấu tất cả đã đọc
|--------------------------------------------------------------------------
*/

const markAllAsRead = (
    userId,
    callback
) => {
    const sql = `
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
          AND is_read = 0
    `;

    db.query(
        sql,
        [Number(userId)],
        callback
    );
};

/*
|--------------------------------------------------------------------------
| Xóa một thông báo
|--------------------------------------------------------------------------
*/

const deleteById = (
    id,
    userId,
    callback
) => {
    const sql = `
        DELETE FROM notifications
        WHERE id = ?
          AND user_id = ?
    `;

    db.query(
        sql,
        [
            Number(id),
            Number(userId)
        ],
        callback
    );
};

/*
|--------------------------------------------------------------------------
| Xóa toàn bộ thông báo
|--------------------------------------------------------------------------
*/

const clearAll = (
    userId,
    callback
) => {
    const sql = `
        DELETE FROM notifications
        WHERE user_id = ?
    `;

    db.query(
        sql,
        [Number(userId)],
        callback
    );
};

/*
|--------------------------------------------------------------------------
| Đếm số thông báo chưa đọc (dùng cho notification bell badge)
|--------------------------------------------------------------------------
*/

const getUnreadCount = (
    userId,
    callback
) => {
    const sql = `
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = ?
          AND is_read = 0
    `;

    db.query(
        sql,
        [Number(userId)],
        (err, rows) => {
            if (err) return callback(err, 0);
            const count = (rows && rows[0]) ? Number(rows[0].count) : 0;
            callback(null, count);
        }
    );
};

/*
|--------------------------------------------------------------------------
| Lấy 5 thông báo mới nhất chưa đọc (dùng cho dropdown bell)
|--------------------------------------------------------------------------
*/

const getLatestUnread = (
    userId,
    limit = 5,
    callback
) => {
    const sql = `
        SELECT id, title, content, type, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    `;

    db.query(
        sql,
        [Number(userId), Math.min(20, limit)],
        callback
    );
};

/*
|--------------------------------------------------------------------------
| Tạo thông báo nhanh (dùng nội bộ trong controllers)
|--------------------------------------------------------------------------
*/

const createForUser = (
    userId,
    title,
    content,
    type = "info",
    appRef = null    // optional: Express app object để lấy io
) => {
    // Fire-and-forget: không callback, không block request
    if (!userId || !title || !content) return;

    const sql = `
        INSERT INTO notifications (user_id, title, content, type, is_read)
        VALUES (?, ?, ?, ?, 0)
    `;

    db.query(sql, [Number(userId), title, content, type], (err, result) => {
        if (err) {
            console.error("Lỗi tạo notification:", err.message);
            return;
        }

        // Emit real-time socket nếu có io
        try {
            const io = appRef?.get?.("io");
            if (io) {
                io.to(`user:${userId}`).emit("notification:new", {
                    id:         result.insertId,
                    user_id:    Number(userId),
                    title,
                    content,
                    type,
                    is_read:    0,
                    created_at: new Date().toISOString()
                });
            }
        } catch (e) {
            /* socket không ảnh hưởng đến logic chính */
        }
    });
};

module.exports = {
    getByUserId,
    create,
    markAsRead,
    markAllAsRead,
    deleteById,
    clearAll,
    getUnreadCount,
    getLatestUnread,
    createForUser
};