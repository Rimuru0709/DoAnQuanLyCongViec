import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../Login/Login.css";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

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

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value,
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,11}$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

        if (!form.full_name.trim()) {
            showError("Vui lòng nhập họ tên");
            return;
        }

        if (form.full_name.trim().length < 2 || form.full_name.trim().length > 100) {
            showError("Họ tên phải từ 2 đến 100 ký tự");
            return;
        }

        if (!emailRegex.test(form.email)) {
            showError("Email không đúng định dạng");
            return;
        }

        if (!phoneRegex.test(form.phone)) {
            showError("Số điện thoại chỉ gồm số và phải có 10–11 chữ số");
            return;
        }

        if (!passwordRegex.test(form.password)) {
            showError("Mật khẩu phải có ít nhất 6 ký tự, gồm chữ và số");
            return;
        }

        if (form.password !== form.confirmPassword) {
            showError("Mật khẩu xác nhận không khớp");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: form.full_name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                showError(data.message || "Đăng ký thất bại");
                return;
            }

            toast.success("Đăng ký thành công!");

            setTimeout(() => {
                navigate("/login");
            }, 1800);
        } catch (err) {
            console.log(err);
            showError("Không thể kết nối server");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <h1>ProjectMaster</h1>
                <p>Tạo tài khoản để bắt đầu quản lý dự án và công việc nhóm.</p>

                <div className="auth-feature">
                    <span>✓</span> Quản lý dự án chuyên nghiệp
                </div>

                <div className="auth-feature">
                    <span>✓</span> Theo dõi tiến độ rõ ràng
                </div>

                <div className="auth-feature">
                    <span>✓</span> Làm việc nhóm hiệu quả
                </div>
            </div>

            <div className="auth-right">
                <form className="login-card" onSubmit={handleRegister}>
                    <div
                        className={`robot ${isPasswordFocus ? "secure" : ""} ${
                            isSad ? "sad" : ""
                        }`}
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

                    <h2>Đăng ký</h2>
                    <p className="auth-subtitle">Tạo tài khoản ProjectMaster</p>

                    {message && <div className="auth-message">{message}</div>}

                    <label>Họ tên</label>
                    <input
                        type="text"
                        name="full_name"
                        placeholder="Nhập họ tên"
                        value={form.full_name}
                        onChange={handleChange}
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Nhập email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    <label>Số điện thoại</label>
                    <input
                        type="text"
                        name="phone"
                        placeholder="Nhập số điện thoại"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Nhập mật khẩu"
                        value={form.password}
                        onChange={handleChange}
                        onFocus={() => setIsPasswordFocus(true)}
                        onBlur={() => setIsPasswordFocus(false)}
                    />

                    <label>Xác nhận mật khẩu</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => setIsPasswordFocus(true)}
                        onBlur={() => setIsPasswordFocus(false)}
                    />

                    <button type="submit">Đăng ký</button>

                    <p className="auth-link">
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Register;