import {
    useEffect,
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./Home.css";

const API_URL = "http://localhost:5000/api";

function Home() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user")
        );
    } catch {
        currentUser = null;
    }

    const logoutAndRedirect = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
            replace: true
        });
    };

    const parseResponse = async (response) => {
        try {
            return await response.json();
        } catch {
            return {};
        }
    };

    const authFetch = async (
        url,
        options = {}
    ) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                ...options.headers
            }
        });

        if (response.status === 401) {
            logoutAndRedirect();

            throw new Error(
                "Phiên đăng nhập đã hết hạn"
            );
        }

        return response;
    };

    const loadDashboard = async () => {
        if (!token) {
            navigate("/login", {
                replace: true
            });

            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response =
                await authFetch(
                    `${API_URL}/home`
                );

            const data =
                await parseResponse(
                    response
                );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Không thể tải dữ liệu Tổng quan"
                );
            }

            setProjects(
                Array.isArray(
                    data.projects
                )
                    ? data.projects
                    : []
            );

            setTasks(
                Array.isArray(
                    data.tasks
                )
                    ? data.tasks
                    : []
            );
        } catch (error) {
            console.error(
                "Lỗi tải Tổng quan:",
                error
            );

            if (
                error.message !==
                "Phiên đăng nhập đã hết hạn"
            ) {
                setMessage(
                    error.message ||
                    "Không thể kết nối đến server"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const normalizeText = (value) => {
        return String(value || "")
            .toLowerCase()
            .trim();
    };

    const keyword = normalizeText(search);

    const filteredProjects = useMemo(() => {
        if (!keyword) {
            return projects;
        }

        return projects.filter((project) => {
            return (
                normalizeText(
                    project.name
                ).includes(keyword) ||
                normalizeText(
                    project.description
                ).includes(keyword) ||
                normalizeText(
                    project.customer
                ).includes(keyword)
            );
        });
    }, [projects, keyword]);

    const filteredTasks = useMemo(() => {
        if (!keyword) {
            return tasks;
        }

        return tasks.filter((task) => {
            return (
                normalizeText(
                    task.title
                ).includes(keyword) ||
                normalizeText(
                    task.project_name
                ).includes(keyword) ||
                normalizeText(
                    task.assignee_name
                ).includes(keyword)
            );
        });
    }, [tasks, keyword]);

    const totalProjects =
        filteredProjects.length;

    const totalTasks =
        filteredTasks.length;

    const doingTasks =
        filteredTasks.filter(
            (task) =>
                task.status === "DANG_LAM"
        ).length;

    const reviewTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "DANG_REVIEW"
        ).length;

    const completedTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "HOAN_THANH"
        ).length;

    const todoTasks =
        filteredTasks.filter(
            (task) =>
                task.status === "CHUA_LAM"
        ).length;

    const overdueTasks =
        filteredTasks.filter(
            (task) =>
                task.status === "QUA_HAN"
        ).length;

    const averageProjectProgress = (() => {
        if (
            currentUser?.role === "MEMBER"
        ) {
            if (filteredTasks.length === 0) {
                return 0;
            }

            return Math.round(
                filteredTasks.reduce(
                    (sum, task) =>
                        sum +
                        Number(
                            task.progress || 0
                        ),
                    0
                ) / filteredTasks.length
            );
        }

        if (filteredProjects.length === 0) {
            return 0;
        }

        return Math.round(
            filteredProjects.reduce(
                (sum, project) =>
                    sum +
                    Number(
                        project.progress || 0
                    ),
                0
            ) / filteredProjects.length
        );
    })();

    const statusCounts = [
        {
            key: "HOAN_THANH",
            label: "Hoàn thành",
            value: completedTasks
        },
        {
            key: "DANG_LAM",
            label: "Đang làm",
            value: doingTasks
        },
        {
            key: "DANG_REVIEW",
            label: "Đang review",
            value: reviewTasks
        },
        {
            key: "CHUA_LAM",
            label: "Chưa làm",
            value: todoTasks
        },
        {
            key: "QUA_HAN",
            label: "Quá hạn",
            value: overdueTasks
        }
    ];

    const largestStatusCount = Math.max(
        ...statusCounts.map(
            (item) => item.value
        ),
        1
    );

    const taskColumns = [
        {
            key: "CHUA_LAM",
            title: "Việc cần làm"
        },
        {
            key: "DANG_LAM",
            title: "Đang thực hiện"
        },
        {
            key: "DANG_REVIEW",
            title: "Đang review"
        },
        {
            key: "HOAN_THANH",
            title: "Hoàn thành"
        }
    ];

    const upcomingProjects = useMemo(() => {
        const now = new Date();

        now.setHours(0, 0, 0, 0);

        return [...filteredProjects]
            .filter((project) => {
                if (
                    !project.end_date ||
                    project.status ===
                    "HOAN_THANH"
                ) {
                    return false;
                }

                const deadline = new Date(
                    project.end_date
                );

                return deadline >= now;
            })
            .sort(
                (first, second) =>
                    new Date(
                        first.end_date
                    ) -
                    new Date(
                        second.end_date
                    )
            )
            .slice(0, 4);
    }, [filteredProjects]);

    const recentTasks = useMemo(() => {
        return [...filteredTasks]
            .sort(
                (first, second) =>
                    Number(second.id) -
                    Number(first.id)
            )
            .slice(0, 5);
    }, [filteredTasks]);

    const getActivityText = (task) => {
        const userName =
            task.assignee_name ||
            "Thành viên";

        if (
            task.status ===
            "HOAN_THANH"
        ) {
            return `${userName} đã hoàn thành "${task.title}"`;
        }

        if (
            task.status ===
            "DANG_REVIEW"
        ) {
            return `${userName} đang review "${task.title}"`;
        }

        if (
            task.status ===
            "DANG_LAM"
        ) {
            return `${userName} đang thực hiện "${task.title}"`;
        }

        if (
            task.status ===
            "QUA_HAN"
        ) {
            return `"${task.title}" đã quá hạn`;
        }

        return `${userName} được giao "${task.title}"`;
    };

    const formatDate = (date) => {
        if (!date) {
            return "Chưa có deadline";
        }

        return new Date(
            date
        ).toLocaleDateString("vi-VN");
    };

    const openProject = (projectId) => {
        navigate(
            `/project/${projectId}`
        );
    };

    if (loading) {
        return (
            <div className="app">
                <Sidebar />

                <main className="main">
                    <div className="card">
                        <h2>
                            Đang tải dữ liệu tổng quan...
                        </h2>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                {message && (
                    <div className="toast-success">
                        {message}
                    </div>
                )}

                <header className="topbar">
                    <div>
                        <h1>Tổng quan</h1>

                        {currentUser && (
                            <p>
                                Xin chào,{" "}
                                {currentUser.full_name}
                            </p>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Tìm kiếm dự án, công việc, thành viên..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />
                </header>

                <section className="stats">
                    <div className="stat-card">
                        <p>Tổng dự án</p>
                        <h2>
                            {totalProjects}
                        </h2>
                        <span>
                            Dự án được phép xem
                        </span>
                    </div>

                    <div className="stat-card">
                        <p>Tổng công việc</p>
                        <h2>
                            {totalTasks}
                        </h2>
                        <span>
                            Công việc hiện tại
                        </span>
                    </div>

                    <div className="stat-card">
                        <p>Đang thực hiện</p>
                        <h2>
                            {doingTasks}
                        </h2>
                        <span>
                            {reviewTasks} đang review
                        </span>
                    </div>

                    <div className="stat-card">
                        <p>Hoàn thành</p>
                        <h2>
                            {completedTasks}
                        </h2>
                        <span>
                            Đã hoàn tất
                        </span>
                    </div>

                    <div className="stat-card danger">
                        <p>Quá hạn</p>
                        <h2>
                            {overdueTasks}
                        </h2>
                        <span>
                            Cần xử lý
                        </span>
                    </div>
                </section>

                <section className="dashboard-grid">
                    <div className="card progress-card">
                        <h3>
                            Tiến độ dự án
                        </h3>

                        <div
                            className="circle"
                            style={{
                                background:
                                    `conic-gradient(
                                        #22c55e 0% ${averageProjectProgress}%,
                                        #2563eb ${averageProjectProgress}% 100%
                                    )`
                            }}
                        >
                            <div className="circle-inner">
                                {
                                    averageProjectProgress
                                }
                                %
                            </div>
                        </div>

                        <p>
                            {currentUser?.role === "MEMBER"
                                ? "Tiến độ công việc của bạn"
                                : "Tiến độ trung bình dự án"}
                        </p>
                    </div>

                    <div className="card chart-card">
                        <h3>
                            Công việc theo trạng thái
                        </h3>

                        <div className="bars">
                            {statusCounts.map(
                                (item) => {
                                    const height =
                                        item.value === 0
                                            ? 5
                                            : Math.max(
                                                15,
                                                Math.round(
                                                    (
                                                        item.value /
                                                        largestStatusCount
                                                    ) *
                                                    100
                                                )
                                            );

                                    return (
                                        <div
                                            key={
                                                item.key
                                            }
                                        >
                                            <b>
                                                {
                                                    item.value
                                                }
                                            </b>

                                            <span
                                                style={{
                                                    height:
                                                        `${height}%`
                                                }}
                                            />

                                            <p>
                                                {
                                                    item.label
                                                }
                                            </p>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="card activity-card">
                        <h3>
                            Hoạt động gần đây
                        </h3>

                        {recentTasks.length ===
                            0 ? (
                            <p>
                                Chưa có hoạt động
                            </p>
                        ) : (
                            <ul>
                                {recentTasks.map(
                                    (task) => (
                                        <li
                                            key={
                                                task.id
                                            }
                                            onClick={() =>
                                                openProject(
                                                    task.project_id
                                                )
                                            }
                                        >
                                            {getActivityText(
                                                task
                                            )}
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="content-grid">
                    <div className="card kanban">
                        <h3>
                            Bảng công việc Kanban
                        </h3>

                        <div className="kanban-board">
                            {taskColumns.map(
                                (column) => {
                                    const columnTasks =
                                        filteredTasks
                                            .filter(
                                                (
                                                    task
                                                ) =>
                                                    task.status ===
                                                    column.key
                                            )
                                            .slice(
                                                0,
                                                3
                                            );

                                    return (
                                        <div
                                            className="column"
                                            key={
                                                column.key
                                            }
                                        >
                                            <h4>
                                                {
                                                    column.title
                                                }
                                            </h4>

                                            {columnTasks.length ===
                                                0 ? (
                                                <p>
                                                    Chưa có công việc
                                                </p>
                                            ) : (
                                                columnTasks.map(
                                                    (
                                                        task
                                                    ) => (
                                                        <div
                                                            className="task"
                                                            key={
                                                                task.id
                                                            }
                                                            onClick={() =>
                                                                openProject(
                                                                    task.project_id
                                                                )
                                                            }
                                                        >
                                                            <b>
                                                                {
                                                                    task.title
                                                                }
                                                            </b>

                                                            <small>
                                                                {task.project_name ||
                                                                    "Chưa có dự án"}
                                                            </small>

                                                            <span>
                                                                {Number(
                                                                    task.progress
                                                                ) ||
                                                                    0}
                                                                %
                                                            </span>
                                                        </div>
                                                    )
                                                )
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        "/task"
                                                    )
                                                }
                                            >
                                                Xem công việc
                                            </button>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="right-panel">
                        <div className="card">
                            <h3>
                                Dự án sắp đến hạn
                            </h3>

                            {upcomingProjects.length ===
                                0 ? (
                                <p>
                                    Chưa có dự án sắp đến hạn
                                </p>
                            ) : (
                                upcomingProjects.map(
                                    (project) => (
                                        <div
                                            className="upcoming-project"
                                            key={
                                                project.id
                                            }
                                            onClick={() =>
                                                openProject(
                                                    project.id
                                                )
                                            }
                                        >
                                            <div>
                                                <b>
                                                    {
                                                        project.name
                                                    }
                                                </b>

                                                <small>
                                                    {formatDate(
                                                        project.end_date
                                                    )}
                                                </small>
                                            </div>

                                            <span>
                                                {Number(
                                                    project.progress
                                                ) ||
                                                    0}
                                                %
                                            </span>
                                        </div>
                                    )
                                )
                            )}
                        </div>

                        <div className="card">
                            <h3>
                                Tiến độ các dự án
                            </h3>

                            {filteredProjects.length ===
                                0 ? (
                                <p>
                                    Chưa có dự án
                                </p>
                            ) : (
                                filteredProjects
                                    .slice(0, 5)
                                    .map(
                                        (project) => {
                                            const progress =
                                                Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            project.progress
                                                        ) ||
                                                        0
                                                    )
                                                );

                                            return (
                                                <div
                                                    className="project-progress-item"
                                                    key={
                                                        project.id
                                                    }
                                                    onClick={() =>
                                                        openProject(
                                                            project.id
                                                        )
                                                    }
                                                >
                                                    <div>
                                                        <span>
                                                            {
                                                                project.name
                                                            }
                                                        </span>

                                                        <b>
                                                            {
                                                                progress
                                                            }
                                                            %
                                                        </b>
                                                    </div>

                                                    <div className="project-progress-line">
                                                        <span
                                                            style={{
                                                                width:
                                                                    `${progress}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;