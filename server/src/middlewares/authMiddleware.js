const jwt = require("jsonwebtoken");
const db = require("../config/db");

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập"
            });
        }

        const tokenParts = authHeader.split(" ");

        if (
            tokenParts.length !== 2 ||
            tokenParts[0] !== "Bearer" ||
            !tokenParts[1]
        ) {
            return res.status(401).json({
                success: false,
                message: "Token không đúng định dạng"
            });
        }

        const token = tokenParts[1];

        jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
            if (error) {
                return res.status(401).json({
                    success: false,
                    message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
                });
            }

            const sql = `
                SELECT
                    id,
                    full_name,
                    email,
                    phone,
                    role,
                    avatar
                FROM users
                WHERE id = ?
                LIMIT 1
            `;

            db.query(sql, [decoded.id], (dbError, results) => {
                if (dbError) {
                    console.error("Lỗi kiểm tra người dùng:", dbError);

                    return res.status(500).json({
                        success: false,
                        message: "Lỗi máy chủ"
                    });
                }

                if (results.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: "Tài khoản không còn tồn tại"
                    });
                }

                req.user = results[0];
                next();
            });
        });
    } catch (error) {
        console.error("Lỗi xác thực:", error);

        return res.status(500).json({
            success: false,
            message: "Lỗi xác thực người dùng"
        });
    }
};

const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thực hiện chức năng này"
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    allowRoles
};