const db = require("../config/db");

const UserModel = {
    getAll: (callback) => {
        const sql = `
            SELECT id, full_name, email, phone, role, avatar, created_at
            FROM users
            ORDER BY id DESC
        `;

        db.query(sql, callback);
    },

    findByEmail: (email, callback) => {
        const sql = "SELECT * FROM users WHERE email = ?";
        db.query(sql, [email], callback);
    },

    findByPhone: (phone, callback) => {
        const sql = "SELECT * FROM users WHERE phone = ?";
        db.query(sql, [phone], callback);
    },

    create: (data, callback) => {
        const sql = `
            INSERT INTO users
            (full_name, email, password, phone, role, avatar)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                data.full_name,
                data.email,
                data.password,
                data.phone || null,
                data.role || "MEMBER",
                data.avatar || null
            ],
            callback
        );
    }
};

module.exports = UserModel;