import "./Sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";

import {
    FaHome,
    FaFolderOpen,
    FaTasks,
    FaColumns,
    FaCalendarAlt,
    FaUsers,
    FaChartBar,
    FaFileAlt,
    FaBell,
    FaCog
} from "react-icons/fa";

function Sidebar() {
    const navigate = useNavigate();

    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;

    const name = user ? user.full_name : "Khách (Guest)";
    const initial = user ? name.charAt(0).toUpperCase() : "?";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <aside className="sidebar">
            <div className="logo">
                <h2>ProjectMaster</h2>
            </div>

            <nav>
                <NavLink to="/" end className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaHome />
                    <span>Tổng quan</span>
                </NavLink>

                <NavLink to="/project" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaFolderOpen />
                    <span>Dự án</span>
                </NavLink>

                <NavLink to="/task" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaTasks />
                    <span>Công việc</span>
                </NavLink>

                <NavLink to="/kanban" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaColumns />
                    <span>Kanban</span>
                </NavLink>

                <NavLink to="/calendar" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaCalendarAlt />
                    <span>Lịch</span>
                </NavLink>

                <NavLink to="/member" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaUsers />
                    <span>Thành viên</span>
                </NavLink>

                <NavLink to="/report" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaChartBar />
                    <span>Báo cáo</span>
                </NavLink>

                <NavLink to="/document" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaFileAlt />
                    <span>Tài liệu</span>
                </NavLink>

                <NavLink to="/notification" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaBell />
                    <span>Thông báo</span>
                </NavLink>

                <NavLink to="/setting" className={({ isActive }) => isActive ? "menu active" : "menu"}>
                    <FaCog />
                    <span>Cài đặt</span>
                </NavLink>
            </nav>

            <div className="user-box">
                {user ? (
                    <>
                        <div className="user-info">
                            <div className="avatar">{initial}</div>

                            <div>
                                <h4>{name}</h4>
                                <p>{user.email || user.role}</p>
                            </div>
                        </div>

                        <button className="btn-logout" onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <>
                        <div className="user-info">
                            <div className="avatar guest-avatar">?</div>

                            <div>
                                <h4>Khách (Guest)</h4>
                                <p>Chưa đăng nhập</p>
                            </div>
                        </div>

                        <button className="btn-login" onClick={() => navigate("/login")}>
                            Đăng nhập
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;