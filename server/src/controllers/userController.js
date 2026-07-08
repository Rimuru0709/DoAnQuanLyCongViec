const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
};

const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
};

const getUsers = (req, res) => {
    UserModel.getAll((err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

const register = async (req, res) => {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password || !phone) {
        return res.status(400).json({
            message: "Vui lòng nhập đầy đủ thông tin"
        });
    }

    if (full_name.trim().length < 2 || full_name.trim().length > 100) {
        return res.status(400).json({
            message: "Họ tên phải từ 2 đến 100 ký tự"
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "Email không đúng định dạng"
        });
    }

    if (!isValidPhone(phone)) {
        return res.status(400).json({
            message: "Số điện thoại chỉ gồm số và phải có 10–11 chữ số"
        });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({
            message: "Mật khẩu phải có ít nhất 6 ký tự, gồm chữ và số"
        });
    }

    UserModel.findByEmail(email, (err, emailResult) => {
        if (err) return res.status(500).json(err);

        if (emailResult.length > 0) {
            return res.status(400).json({
                message: "Email đã tồn tại"
            });
        }

        UserModel.findByPhone(phone, async (err, phoneResult) => {
            if (err) return res.status(500).json(err);

            if (phoneResult.length > 0) {
                return res.status(400).json({
                    message: "Số điện thoại đã được sử dụng"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userData = {
                full_name: full_name.trim(),
                email: email.trim(),
                password: hashedPassword,
                phone: phone.trim(),
                role: "MEMBER"
            };

            UserModel.create(userData, (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({
                            message: "Email hoặc số điện thoại đã tồn tại"
                        });
                    }

                    return res.status(500).json({
                        message: "Đăng ký thất bại"
                    });
                }

                res.json({
                    message: "Đăng ký thành công",
                    id: result.insertId
                });
            });
        });
    });
};

const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Vui lòng nhập email và mật khẩu"
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "Email không đúng định dạng"
        });
    }

    UserModel.findByEmail(email, async (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(400).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "project_master_secret",
            {
                expiresIn: "1d"
            }
        );

        res.json({
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
};

module.exports = {
    getUsers,
    register,
    login
};