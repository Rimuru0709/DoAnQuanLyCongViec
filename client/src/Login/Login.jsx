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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            showError("Email không đúng định dạng");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                showError(data.message || "Đăng nhập thất bại");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            toast.success(`Xin chào ${data.user.full_name}!`);

            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (err) {
            console.log(err);
            showError("Không thể kết nối server");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <h1>ProjectMaster</h1>
                <p>Quản lý dự án, công việc và tiến độ nhóm một cách hiệu quả.</p>

                <div className="auth-feature"><span>✓</span> Theo dõi tiến độ dự án</div>
                <div className="auth-feature"><span>✓</span> Phân công công việc nhóm</div>
                <div className="auth-feature"><span>✓</span> Quản lý Kanban, Gantt, tài liệu</div>
            </div>

            <div className="auth-right">
                <form className="login-card" onSubmit={handleLogin}>
                    <div className={`robot ${isPasswordFocus ? "secure" : ""} ${isSad ? "sad" : ""}`}>
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
                    <p className="auth-subtitle">Chào mừng bạn quay lại ProjectMaster</p>

                    {message && <div className="auth-message">{message}</div>}

                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Nhập email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocus(true)}
                        onBlur={() => setIsPasswordFocus(false)}
                    />

                    <button type="submit">Đăng nhập</button>

                    <p className="auth-link">
                        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Login;