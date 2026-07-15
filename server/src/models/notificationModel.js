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

module.exports = {
    getByUserId,
    create,
    markAsRead,
    markAllAsRead,
    deleteById,
    clearAll
};