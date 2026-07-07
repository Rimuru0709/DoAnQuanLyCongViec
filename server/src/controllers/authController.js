const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Tận dụng trực tiếp Pool từ db.js

// Tự động kiểm tra và nâng cấp bảng users nếu thiếu trường password
const ensurePasswordColumn = async () => {
    try {
        // Dùng db.query trực tiếp (vì Pool của mysql2 hỗ trợ async/await sẵn nếu dùng đúng kiểu)
        // Hoặc dự phòng dùng cú pháp tương thích cao nhất bên dưới:
        const [columns] = await db.query("SHOW COLUMNS FROM users");
        const columnNames = columns.map(c => c.Field.toLowerCase());

        if (!columnNames.includes("password")) {
            await db.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL");
            console.log("✅ Đã tự động thêm cột 'password' vào bảng 'users'.");
        }
    } catch (err) {
        console.error("❌ Không thể kiểm tra cấu trúc bảng users:", err.message);
    }
};

// Đăng ký người dùng
const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    try {
        await ensurePasswordColumn();

        // Kiểm tra xem email đã tồn tại chưa
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email này đã được sử dụng!" });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Kiểm tra xem trường lưu tên là 'full_name' hay 'name'
        const [columns] = await db.query("SHOW COLUMNS FROM users");
        const columnNames = columns.map(c => c.Field.toLowerCase());

        let sql = "";
        let params = [];

        if (columnNames.includes("full_name")) {
            sql = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
            params = [name, email, hashedPassword];
        } else {
            sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
            params = [name, email, hashedPassword];
        }

        const [result] = await db.query(sql, params);

        res.status(201).json({
            success: true,
            message: "Đăng ký tài khoản thành công!",
            userId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

// Đăng nhập người dùng
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu!" });
    }

    try {
        await ensurePasswordColumn();

        // Tìm user theo email
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        const user = users[0];

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) {
            return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        // Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, name: user.full_name || user.name },
            process.env.JWT_SECRET || 'SECRET_KEY_MAC_DINH',
            { expiresIn: '1d' }
        );

        // Trả token và thông tin user về
        res.json({
            success: true,
            message: "Đăng nhập thành công!",
            token: token,
            user: {
                id: user.id,
                name: user.full_name || user.name,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

module.exports = {
    register,
    login
};