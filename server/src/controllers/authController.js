const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const createToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );
};

const login = (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập email và mật khẩu"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const sql = `
            SELECT
                id,
                full_name,
                email,
                password,
                phone,
                role,
                avatar,
                created_at
            FROM users
            WHERE email = ?
            LIMIT 1
        `;

        db.query(sql, [normalizedEmail], async (error, results) => {
            if (error) {
                console.error("Lỗi đăng nhập:", error);

                return res.status(500).json({
                    success: false,
                    message: "Lỗi máy chủ"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Email hoặc mật khẩu không chính xác"
                });
            }

            const user = results[0];

            let passwordMatched = false;

            try {
                passwordMatched = await bcrypt.compare(
                    password,
                    user.password
                );
            } catch (compareError) {
                console.error("Lỗi kiểm tra mật khẩu:", compareError);
            }

            if (!passwordMatched) {
                return res.status(401).json({
                    success: false,
                    message: "Email hoặc mật khẩu không chính xác"
                });
            }

            const token = createToken(user);

            return res.status(200).json({
                success: true,
                message: "Đăng nhập thành công",
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    avatar: user.avatar
                }
            });
        });
    } catch (error) {
        console.error("Lỗi login:", error);

        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi đăng nhập"
        });
    }
};

const getCurrentUser = (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
};

module.exports = {
    login,
    getCurrentUser
};