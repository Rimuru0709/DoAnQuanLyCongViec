import "./Sidebar.css";
import { NavLink } from "react-router-dom";

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
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const name = user ? user.name : "Đào Quang Duy";
    const initial = name ? name.charAt(0).toUpperCase() : "D";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <aside className="sidebar">

            <div className="logo">
                <h2>ProjectMaster</h2>
            </div>

            <nav>

                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaHome />
                    <span>Tổng quan</span>
                </NavLink>

                <NavLink
                    to="/project"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaFolderOpen />
                    <span>Dự án</span>
                </NavLink>

                <NavLink
                    to="/task"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaTasks />
                    <span>Công việc</span>
                </NavLink>

                <NavLink
                    to="/kanban"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaColumns />
                    <span>Kanban</span>
                </NavLink>

                <NavLink
                    to="/calendar"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaCalendarAlt />
                    <span>Lịch</span>
                </NavLink>

                <NavLink
                    to="/member"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaUsers />
                    <span>Thành viên</span>
                </NavLink>

                <NavLink
                    to="/report"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaChartBar />
                    <span>Báo cáo</span>
                </NavLink>

                <NavLink
                    to="/document"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaFileAlt />
                    <span>Tài liệu</span>
                </NavLink>

                <NavLink
                    to="/notification"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaBell />
                    <span>Thông báo</span>

                    <div className="badge">
                        5
                    </div>
                </NavLink>

                <NavLink
                    to="/setting"
                    className={({ isActive }) =>
                        isActive ? "menu active" : "menu"
                    }
                >
                    <FaCog />
                    <span>Cài đặt</span>
                </NavLink>

            </nav>

            <div className="user-box" style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "stretch" }}>
                {user ? (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="avatar">
                                {initial}
                            </div>
                            <div>
                                <h4 style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "150px" }}>{name}</h4>
                                <p style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "150px" }}>{user?.email || "Administrator"}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#f87171",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600",
                                transition: "background 0.2s, border-color 0.2s"
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = "rgba(239, 68, 68, 0.25)";
                                e.target.style.borderColor = "rgba(239, 68, 68, 0.5)";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = "rgba(239, 68, 68, 0.15)";
                                e.target.style.borderColor = "rgba(239, 68, 68, 0.3)";
                            }}
                        >
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="avatar" style={{ background: "#4b5563" }}>
                                ?
                            </div>
                            <div>
                                <h4>Khách (Guest)</h4>
                                <p>Chưa đăng nhập</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.href = "/login"}
                            style={{
                                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                border: "none",
                                color: "#ffffff",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600",
                                transition: "background 0.2s"
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = "linear-gradient(135deg, #2563eb, #1d4ed8)";
                            }}
                        >
                            Đăng nhập
                        </button>
                    </>
                )}
            </div>

        </aside>
    );
}

export default Sidebar;