import {
    useEffect,
    useState
} from "react";

import "./Sidebar.css";

import {
    NavLink,
} from "react-router-dom";

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

const NOTIFICATION_API =
    "http://localhost:5000/api/notifications";

function Sidebar() {

    const [
        unreadCount,
        setUnreadCount
    ] = useState(0);

    const userJson =
        localStorage.getItem("user");

    let user = null;

    try {
        user = userJson
            ? JSON.parse(userJson)
            : null;
    } catch (error) {
        console.error(
            "Lỗi đọc thông tin người dùng:",
            error
        );

        user = null;
    }

    const role =
        user?.role || "GUEST";

    /*
    |--------------------------------------------------------------------------
    | Lấy số thông báo chưa đọc
    |--------------------------------------------------------------------------
    */

    const loadUnreadNotifications =
        async () => {
            const token =
                localStorage.getItem(
                    "token"
                );

            if (!token) {
                setUnreadCount(0);
                return;
            }

            try {
                const response =
                    await fetch(
                        `${NOTIFICATION_API}?page=1&limit=50&filter=unread`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Không thể tải thông báo chưa đọc"
                    );
                }

                const data =
                    await response.json();

                const results =
                    Array.isArray(
                        data.results
                    )
                        ? data.results
                        : [];

                setUnreadCount(
                    results.length
                );
            } catch (error) {
                console.error(
                    "Lỗi tải số thông báo chưa đọc:",
                    error
                );

                setUnreadCount(0);
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Tải thông báo và cập nhật mỗi 30 giây
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadUnreadNotifications();

        const interval =
            setInterval(
                loadUnreadNotifications,
                30000
            );

        const handleNotificationUpdated =
            () => {
                loadUnreadNotifications();
            };

        window.addEventListener(
            "notification-updated",
            handleNotificationUpdated
        );

        return () => {
            clearInterval(interval);

            window.removeEventListener(
                "notification-updated",
                handleNotificationUpdated
            );
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Danh sách menu
    |--------------------------------------------------------------------------
    */

    const menus = [
        {
            path: "/",
            text: "Tổng quan",
            icon: <FaHome />,
            roles: [
                "GUEST",
                "ADMIN",
                "MANAGER",
                "MEMBER"
            ]
        },
        {
            path: "/project",
            text: "Dự án",
            icon: <FaFolderOpen />,
            roles: [
                "ADMIN",
                "MANAGER"
            ]
        },
        {
            path: "/task",
            text: "Công việc",
            icon: <FaTasks />,
            roles: [
                "ADMIN",
                "MANAGER",
                "MEMBER"
            ]
        },
        {
            path: "/kanban",
            text: "Kanban",
            icon: <FaColumns />,
            roles: [
                "ADMIN",
                "MANAGER"
            ]
        },
        {
            path: "/calendar",
            text: "Lịch",
            icon: <FaCalendarAlt />,
            roles: [
                "ADMIN",
                "MANAGER",
                "MEMBER"
            ]
        },
        {
            path: "/member",
            text: "Thành viên",
            icon: <FaUsers />,
            roles: [
                "ADMIN"
            ]
        },
        {
            path: "/report",
            text: "Báo cáo",
            icon: <FaChartBar />,
            roles: [
                "ADMIN"
            ]
        },
        {
            path: "/document",
            text: "Tài liệu",
            icon: <FaFileAlt />,
            roles: [
                "ADMIN",
                "MANAGER"
            ]
        },
        {
            path: "/notification",
            text: "Thông báo",
            icon: <FaBell />,
            roles: [
                "ADMIN",
                "MANAGER",
                "MEMBER"
            ]
        },
        {
            path: "/setting",
            text: "Cài đặt",
            icon: <FaCog />,
            roles: [
                "ADMIN",
                "MANAGER",
                "MEMBER"
            ]
        }
    ];

    return (
        <aside className="sidebar">
            <div className="logo">
                <h2>
                    ProjectMaster
                </h2>
            </div>

            <nav>
                {menus
                    .filter(
                        (menu) =>
                            menu.roles.includes(
                                role
                            )
                    )
                    .map(
                        (menu) => (
                            <NavLink
                                key={
                                    menu.path
                                }
                                to={
                                    menu.path
                                }
                                end={
                                    menu.path ===
                                    "/"
                                }
                                className={({
                                    isActive
                                }) =>
                                    isActive
                                        ? "menu active"
                                        : "menu"
                                }
                            >
                                <span className="menu-icon">
                                    {
                                        menu.icon
                                    }
                                </span>

                                <span className="menu-text">
                                    {
                                        menu.text
                                    }
                                </span>

                                {menu.path ===
                                    "/notification" &&
                                    unreadCount >
                                        0 && (
                                        <span
                                            className="sidebar-notification-dot"
                                            title={`${unreadCount} thông báo chưa đọc`}
                                        />
                                    )}
                            </NavLink>
                        )
                    )}
            </nav>

        </aside>
    );
}

export default Sidebar;