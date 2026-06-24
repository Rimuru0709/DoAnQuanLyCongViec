import "./Sidebar.css";
import { Link } from "react-router-dom";

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
            <h2>ProjectMaster</h2>

            <nav>
                <Link to="/">
                    <FaHome />
                    <span>Tổng quan</span>
                </Link>

                <Link to="/project">
                    <FaFolderOpen />
                    <span>Dự án</span>
                </Link>

                <Link to="/task">
                    <FaTasks />
                    <span>Công việc</span>
                </Link>

                <Link to="/kanban">
                    <FaColumns />
                    <span>Kanban</span>
                </Link>

                <Link to="/calendar">
                    <FaCalendarAlt />
                    <span>Lịch</span>
                </Link>

                <Link to="/member">
                    <FaUsers />
                    <span>Thành viên</span>
                </Link>

                <Link to="/report">
                    <FaChartBar />
                    <span>Báo cáo</span>
                </Link>

                <Link to="/document">
                    <FaFileAlt />
                    <span>Tài liệu</span>
                </Link>

                <Link to="/notification">
                    <FaBell />
                    <span>Thông báo</span>
                </Link>

                <Link to="/setting">
                    <FaCog />
                    <span>Cài đặt</span>
                </Link>
            </nav>

            <div className="user-box">
                <div className="avatar">A</div>

                <div>
                    <b>Nguyễn Văn A</b>
                    <p>Quản trị viên</p>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;