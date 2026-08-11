import { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

import {
    FaHome,
    FaFolderOpen,
    FaTasks,
    FaColumns,
    FaCalendarAlt,
    FaUsers,
    FaChartBar,
    FaFileAlt,
    FaCog,
    FaBolt,
    FaChevronDown,
    FaCircle
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

/* Project color tags — assigned by index */
const PROJECT_COLORS = [
    "#3b82f6", "#a855f7", "#10b981", "#f59e0b",
    "#ef4444", "#06b6d4", "#f97316", "#8b5cf6",
    "#ec4899", "#14b8a6"
];

const menus = [
    { path: "/",            text: "Tổng quan",   icon: <FaHome />,        roles: ["GUEST","ADMIN","MANAGER","MEMBER"] },
    { path: "/task",        text: "Công việc",   icon: <FaTasks />,       roles: ["ADMIN","MANAGER","MEMBER"] },
    { path: "/kanban",      text: "Kanban",      icon: <FaColumns />,     roles: ["ADMIN","MANAGER"] },
    { path: "/calendar",    text: "Lịch làm việc", icon: <FaCalendarAlt />, roles: ["ADMIN","MANAGER","MEMBER"] },
    { path: "/report",      text: "Báo cáo",     icon: <FaChartBar />,    roles: ["ADMIN"] },
    { path: "/automation",  text: "Tự động hóa", icon: <FaBolt />,        roles: ["ADMIN","MANAGER"] },
    { path: "/document",    text: "Tài liệu",    icon: <FaFileAlt />,     roles: ["ADMIN","MANAGER"] },
];

const bottomMenus = [
    { path: "/member",      text: "Thành viên",  icon: <FaUsers />,       roles: ["ADMIN"] },
    { path: "/setting",     text: "Cài đặt",     icon: <FaCog />,         roles: ["ADMIN","MANAGER","MEMBER"] },
];



function Sidebar() {
    const navigate = useNavigate();

    const [projects,       setProjects]       = useState([]);
    const [projectsOpen,   setProjectsOpen]   = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(false);

    /* ── User info ── */
    let user = null;
    try { user = JSON.parse(localStorage.getItem("user")); } catch { /* ignore */ }

    const token = localStorage.getItem("token");
    const role  = user?.role || "GUEST";

    /* ── Load projects for sidebar ── */
    const loadProjects = useCallback(async () => {
        if (!token) return;
        setLoadingProjects(true);
        try {
            const res = await fetch(`${API_URL}/project`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            const list = Array.isArray(data.projects)
                ? data.projects
                : Array.isArray(data)
                    ? data
                    : [];
            setProjects(list.slice(0, 8));
        } catch { /* ignore */ } finally {
            setLoadingProjects(false);
        }
    }, [token]);

    useEffect(() => { loadProjects(); }, [loadProjects]);

    const visibleMenus       = menus.filter(m => m.roles.includes(role));
    const visibleBottomMenus = bottomMenus.filter(m => m.roles.includes(role));
    const showProjects       = ["ADMIN","MANAGER","MEMBER"].includes(role) && token;

    return (
        <aside className="sidebar">
            {/* ── Logo ── */}
            <div className="logo">
                <div className="logo-icon">P</div>
                <div className="logo-text">
                    <h2>ProjectMaster</h2>
                    <span>Workspace</span>
                </div>
            </div>

            {/* ── Main Navigation ── */}
            <div className="sidebar-section-label">MENU CHÍNH</div>
            <nav className="sidebar-nav">
                {visibleMenus.map((menu) => (
                    <NavLink
                        key={menu.path}
                        to={menu.path}
                        end={menu.path === "/"}
                        className={({ isActive }) => isActive ? "menu active" : "menu"}
                    >
                        <span className="menu-icon">{menu.icon}</span>
                        <span className="menu-text">{menu.text}</span>
                    </NavLink>
                ))}
            </nav>

            {/* ── Projects Section ── */}
            {showProjects && (
                <div className="sidebar-projects">
                    <button
                        className="sidebar-section-toggle"
                        onClick={() => setProjectsOpen(v => !v)}
                    >
                        <span className="sidebar-section-label" style={{ margin: 0 }}>DỰ ÁN</span>
                        <FaChevronDown
                            className="toggle-chevron"
                            style={{ transform: projectsOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                        />
                        <NavLink
                            to="/project"
                            className="project-add-link"
                            onClick={e => e.stopPropagation()}
                            title="Quản lý dự án"
                        >
                            <FaFolderOpen />
                        </NavLink>
                    </button>

                    {projectsOpen && (
                        <div className="project-list">
                            {loadingProjects ? (
                                <div className="project-loading">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            ) : projects.length === 0 ? (
                                <p className="project-empty">Chưa có dự án nào</p>
                            ) : (
                                projects.map((project, idx) => (
                                    <button
                                        key={project.id}
                                        className="project-item"
                                        onClick={() => navigate(`/project/${project.id}`)}
                                        title={project.name}
                                    >
                                        <span
                                            className="project-color-tag"
                                            style={{ background: PROJECT_COLORS[idx % PROJECT_COLORS.length] }}
                                        />
                                        <span className="project-item-name">{project.name}</span>
                                        {project.status === "DANG_THUC_HIEN" && (
                                            <FaCircle className="project-active-dot" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Spacer ── */}
            <div className="sidebar-spacer" />

            {/* ── Bottom Navigation ── */}
            {visibleBottomMenus.length > 0 && (
                <>
                    <div className="sidebar-section-label">QUẢN TRỊ</div>
                    <nav className="sidebar-nav sidebar-nav-bottom">
                        {visibleBottomMenus.map((menu) => (
                            <NavLink
                                key={menu.path}
                                to={menu.path}
                                className={({ isActive }) => isActive ? "menu active" : "menu"}
                            >
                                <span className="menu-icon">{menu.icon}</span>
                                <span className="menu-text">{menu.text}</span>
                            </NavLink>
                        ))}
                    </nav>
                </>
            )}
        </aside>
    );
}

export default Sidebar;