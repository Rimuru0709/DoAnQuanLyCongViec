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

            <div className="user-box">

                <div className="avatar">
                    D
                </div>

                <div>
                    <h4>Đào Quang Duy</h4>
                    <p>Administrator</p>
                </div>

            </div>

        </aside>
    );
}

export default Sidebar;