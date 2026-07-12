import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordFocus, setIsPasswordFocus] = useState(false);
    const [isSad, setIsSad] = useState(false);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showError = (text) => {
        setMessage(text);
        setIsSad(true);
        toast.error(text);

        setTimeout(() => {
            setIsSad(false);
        }, 2500);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            showError("Vui lòng nhập email và mật khẩu");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            showError("Email không đúng định dạng");
            return;
        }

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: trimmedEmail,
                        password: trimmedPassword
                    })
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                showError(
                    data.message || "Đăng nhập thất bại"
                );
                return;
            }

            if (!data.token || !data.user) {
                showError(
                    "Dữ liệu đăng nhập trả về không hợp lệ"
                );
                return;
            }

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            toast.success(
                `Xin chào ${data.user.full_name}!`
            );

            navigate("/home", {
                replace: true
            });
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);

            showError(
                "Không thể kết nối đến server"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <h1>ProjectMaster</h1>

                <p>
                    Quản lý dự án, công việc và tiến độ nhóm
                    một cách hiệu quả.
                </p>

                <div className="auth-feature">
                    <span>✓</span>
                    Theo dõi tiến độ dự án
                </div>

                <div className="auth-feature">
                    <span>✓</span>
                    Phân công công việc nhóm
                </div>

                <div className="auth-feature">
                    <span>✓</span>
                    Quản lý Kanban, Gantt, tài liệu
                </div>
            </div>

            <div className="auth-right">
                <form
                    className="login-card"
                    onSubmit={handleLogin}
                >
                    <div
                        className={`
                            robot
                            ${isPasswordFocus ? "secure" : ""}
                            ${isSad ? "sad" : ""}
                        `}
                    >
                        <div className="robot-head">
                            <div className="robot-screen">
                                <div className="robot-eyes">
                                    <span></span>
                                    <span></span>
                                </div>

                                <div className="robot-smile"></div>
                            </div>
                        </div>

                        <div className="robot-arm left"></div>
                        <div className="robot-arm right"></div>
                        <div className="robot-leg left"></div>
                        <div className="robot-leg right"></div>
                    </div>

                    <h2>Đăng nhập</h2>

                    <p className="auth-subtitle">
                        Chào mừng bạn quay lại ProjectMaster
                    </p>

                    {message && (
                        <div className="auth-message">
                            {message}
                        </div>
                    )}

                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        id="email"
                        type="email"
                        placeholder="Nhập email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="password">
                        Mật khẩu
                    </label>

                    <input
                        id="password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        onFocus={() =>
                            setIsPasswordFocus(true)
                        }
                        onBlur={() =>
                            setIsPasswordFocus(false)
                        }
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Đang đăng nhập..."
                            : "Đăng nhập"}
                    </button>

                    <p className="auth-link">
                        Chưa có tài khoản?{" "}
                        <Link to="/register">
                            Đăng ký
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Login;