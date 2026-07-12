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

    const role = user?.role || "GUEST";
    const name = user?.full_name || "Khách";
    const initial = name.charAt(0).toUpperCase();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const menus = [
        {
            path: "/",
            text: "Tổng quan",
            icon: <FaHome />,
            roles: ["GUEST", "ADMIN", "MANAGER", "MEMBER"]
        },
        {
            path: "/project",
            text: "Dự án",
            icon: <FaFolderOpen />,
            roles: ["ADMIN", "MANAGER"]
        },
        {
            path: "/task",
            text: "Công việc",
            icon: <FaTasks />,
            roles: ["ADMIN", "MANAGER", "MEMBER"]
        },
        {
            path: "/kanban",
            text: "Kanban",
            icon: <FaColumns />,
            roles: ["ADMIN", "MANAGER"]
        },
        {
            path: "/calendar",
            text: "Lịch",
            icon: <FaCalendarAlt />,
            roles: ["ADMIN", "MANAGER", "MEMBER"]
        },
        {
            path: "/member",
            text: "Thành viên",
            icon: <FaUsers />,
            roles: ["ADMIN"]
        },
        {
            path: "/report",
            text: "Báo cáo",
            icon: <FaChartBar />,
            roles: ["ADMIN"]
        },
        {
            path: "/document",
            text: "Tài liệu",
            icon: <FaFileAlt />,
            roles: ["ADMIN", "MANAGER"]
        },
        {
            path: "/notification",
            text: "Thông báo",
            icon: <FaBell />,
            roles: ["ADMIN", "MANAGER", "MEMBER"]
        },
        {
            path: "/setting",
            text: "Cài đặt",
            icon: <FaCog />,
            roles: ["ADMIN", "MANAGER", "MEMBER"]
        }
    ];

    return (
        <aside className="sidebar">
            <div className="logo">
                <h2>ProjectMaster</h2>
            </div>

            <nav>
                {menus
                    .filter(menu => menu.roles.includes(role))
                    .map(menu => (
                        <NavLink
                            key={menu.path}
                            to={menu.path}
                            end={menu.path === "/"}
                            className={({ isActive }) =>
                                isActive
                                    ? "menu active"
                                    : "menu"
                            }
                        >
                            {menu.icon}
                            <span>{menu.text}</span>
                        </NavLink>
                    ))}
            </nav>

            <div className="user-box">
                {user ? (
                    <>
                        <div className="user-info">
                            <div className="avatar">
                                {initial}
                            </div>

                            <div>
                                <h4>{name}</h4>
                                <p>{role}</p>
                            </div>
                        </div>

                        <button
                            className="btn-logout"
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <>
                        <div className="user-info">
                            <div className="avatar guest-avatar">
                                ?
                            </div>

                            <div>
                                <h4>Khách</h4>
                                <p>Chưa đăng nhập</p>
                            </div>
                        </div>

                        <button
                            className="btn-login"
                            onClick={() =>
                                navigate("/login")
                            }
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