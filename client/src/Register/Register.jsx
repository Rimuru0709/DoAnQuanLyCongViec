import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!name || !email || !password || !confirmPassword) {
            setError("Vui lòng điền đầy đủ các thông tin!");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Đăng ký thất bại");
            }

            setSuccess("Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...");
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Đăng ký</h2>
                    <p>Tạo tài khoản quản lý công việc ProjectMaster</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            <span>✅</span> {success}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Họ và tên</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="Nguyễn Văn A"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="username@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Đăng ký"}
                    </button>
                </form>

                <div className="auth-footer">
                    Đã có tài khoản?
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
