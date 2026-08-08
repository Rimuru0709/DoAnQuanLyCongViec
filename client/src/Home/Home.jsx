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
    const [taskBurndown, setTaskBurndown] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [chartPage, setChartPage] = useState(1);
    const [ganttProjectId, setGanttProjectId] = useState("");

    const [ganttSearch, setGanttSearch] = useState("");
    const [selectedKanbanStatus, setSelectedKanbanStatus] = useState(null);

const [kanbanSearch, setKanbanSearch] = useState("");

    const CHART_PAGE_SIZE = 4;
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

    const handleLogout = () => {
        setShowUserMenu(false);
        logoutAndRedirect();
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

            setTaskBurndown(
                Array.isArray(
                    data.taskBurndown
                )
                    ? data.taskBurndown
                    : []
            );
        }
        catch (error) {
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

    const totalChartPages = Math.max(
        1,
        Math.ceil(
            filteredProjects.length /
            CHART_PAGE_SIZE
        )
    );

    const chartProjects = useMemo(() => {
        const startIndex =
            (chartPage - 1) *
            CHART_PAGE_SIZE;

        return filteredProjects.slice(
            startIndex,
            startIndex + CHART_PAGE_SIZE
        );
    }, [
        filteredProjects,
        chartPage
    ]);

    useEffect(() => {
        if (chartPage > totalChartPages) {
            setChartPage(
                totalChartPages
            );
        }
    }, [
        chartPage,
        totalChartPages
    ]);

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

        // Backend trả YYYY-MM-DD
        if (
            typeof date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(date)
        ) {
            const [
                year,
                month,
                day
            ] = date.split("-");

            return `${Number(day)}/${Number(month)}/${year}`;
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Không xác định";
        }

        return parsedDate.toLocaleDateString(
            "vi-VN"
        );
    };

    const burndownChart = useMemo(() => {
        if (taskBurndown.length === 0) {
            return {
                maxValue: 1,
                baselinePoints: "",
                remainingPoints: "",
                actualPoints: "",
                width: 1000,
                height: 260
            };
        }

        const values =
            taskBurndown.flatMap(
                (item) => [
                    Number(
                        item.baselineRemainingTasks
                    ) || 0,

                    Number(
                        item.remainingTasks
                    ) || 0,

                    Number(
                        item.remainingActualTasks
                    ) || 0
                ]
            );

        const maxValue = Math.max(
            ...values,
            1
        );

        const width = 1000;
        const height = 260;

        const getX = (index) => {
            if (taskBurndown.length === 1) {
                return width / 2;
            }

            return (
                index /
                (taskBurndown.length - 1)
            ) * width;
        };

        const getY = (value) => {
            return (
                height -
                (
                    Number(value || 0) /
                    maxValue
                ) *
                height
            );
        };

        const baselinePoints =
            taskBurndown
                .map(
                    (item, index) =>
                        `${getX(index)},${getY(
                            item.baselineRemainingTasks
                        )}`
                )
                .join(" ");

        const remainingPoints =
            taskBurndown
                .map(
                    (item, index) =>
                        `${getX(index)},${getY(
                            item.remainingTasks
                        )}`
                )
                .join(" ");

        const actualPoints =
            taskBurndown
                .map(
                    (item, index) =>
                        `${getX(index)},${getY(
                            item.remainingActualTasks
                        )}`
                )
                .join(" ");

        return {
            maxValue,
            baselinePoints,
            remainingPoints,
            actualPoints,
            width,
            height
        };
    }, [taskBurndown]);

    const today = useMemo(() => {
        const value = new Date();
        value.setHours(0, 0, 0, 0);
        return value;
    }, []);

    const projectTimeline = useMemo(() => {
        const validDates = filteredProjects.flatMap(
            (project) => {
                const dates = [];

                if (project.start_date) {
                    const startDate = new Date(
                        project.start_date
                    );

                    if (
                        !Number.isNaN(
                            startDate.getTime()
                        )
                    ) {
                        dates.push(startDate);
                    }
                }

                if (project.end_date) {
                    const endDate = new Date(
                        project.end_date
                    );

                    if (
                        !Number.isNaN(
                            endDate.getTime()
                        )
                    ) {
                        dates.push(endDate);
                    }
                }

                return dates;
            }
        );

        const start =
            validDates.length > 0
                ? new Date(
                    Math.min(
                        ...validDates.map(
                            (date) =>
                                date.getTime()
                        )
                    )
                )
                : today;

        const end =
            validDates.length > 0
                ? new Date(
                    Math.max(
                        ...validDates.map(
                            (date) =>
                                date.getTime()
                        )
                    )
                )
                : today;

        const totalTime = Math.max(
            1,
            end.getTime() - start.getTime()
        );

        const todayPercent = Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    ((today.getTime() -
                        start.getTime()) /
                        totalTime) *
                    100
                )
            )
        );

        return {
            start,
            end,
            todayPercent
        };
    }, [filteredProjects, today]);

    const milestones = useMemo(() => {
        return [...filteredProjects]
            .filter((project) => {
                if (!project.end_date) {
                    return false;
                }

                const endDate =
                    new Date(project.end_date);

                return !Number.isNaN(
                    endDate.getTime()
                );
            })
            .sort(
                (first, second) =>
                    new Date(first.end_date) -
                    new Date(second.end_date)
            )
            .slice(0, 5);
    }, [filteredProjects]);

    const lateTasks = useMemo(() => {
        return [...filteredTasks]
            .filter((task) => {
                if (
                    !task.end_date ||
                    task.status ===
                    "HOAN_THANH"
                ) {
                    return false;
                }

                const deadline = new Date(
                    task.end_date
                );

                if (
                    Number.isNaN(
                        deadline.getTime()
                    )
                ) {
                    return false;
                }

                deadline.setHours(0, 0, 0, 0);

                return (
                    deadline < today ||
                    task.status === "QUA_HAN"
                );
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
            .slice(0, 5);
    }, [filteredTasks, today]);

    const getActivityIcon = (task) => {
        if (
            task.status === "HOAN_THANH"
        ) {
            return "✓";
        }

        if (
            task.status === "DANG_REVIEW"
        ) {
            return "◷";
        }

        if (task.status === "DANG_LAM") {
            return "▶";
        }

        if (task.status === "QUA_HAN") {
            return "!";
        }

        return "+";
    };

    /*
|--------------------------------------------------------------------------
| DANH SÁCH DỰ ÁN CHO TASK TIMELINE
|--------------------------------------------------------------------------
*/

    const ganttProjects = useMemo(() => {
        const projectMap =
            new Map();

        tasks.forEach((task) => {

            if (!task.project_id) {
                return;
            }

            if (
                !projectMap.has(
                    String(
                        task.project_id
                    )
                )
            ) {
                projectMap.set(
                    String(
                        task.project_id
                    ),
                    {
                        id:
                            task.project_id,

                        name:
                            task.project_name ||
                            "Dự án"
                    }
                );
            }
        });

        return Array.from(
            projectMap.values()
        );
    }, [tasks]);


    /*
    |--------------------------------------------------------------------------
    | TỰ ĐỘNG CHỌN DỰ ÁN ĐẦU TIÊN
    |--------------------------------------------------------------------------
    |
    | Nếu người dùng chưa chọn dự án:
    | - Tự động lấy dự án đầu tiên có công việc.
    |
    */

    useEffect(() => {

        if (
            ganttProjectId ||
            ganttProjects.length === 0
        ) {
            return;
        }

        setGanttProjectId(
            String(
                ganttProjects[0].id
            )
        );

    }, [
        ganttProjectId,
        ganttProjects
    ]);


    /*
    |--------------------------------------------------------------------------
    | DỮ LIỆU TASK TIMELINE
    |--------------------------------------------------------------------------
    */

    const recentGanttData =
        useMemo(() => {

            /*
            |--------------------------------------------------------------------------
            | Dự án đang chọn
            |--------------------------------------------------------------------------
            */

            const selectedProjectId =
                ganttProjectId ||
                (
                    ganttProjects.length > 0
                        ? String(
                            ganttProjects[0].id
                        )
                        : ""
                );


            /*
            |--------------------------------------------------------------------------
            | Từ khóa tìm kiếm
            |--------------------------------------------------------------------------
            */

            const ganttKeyword =
                normalizeText(
                    ganttSearch
                );


            /*
            |--------------------------------------------------------------------------
            | Lọc Task theo dự án
            |--------------------------------------------------------------------------
            */

            const projectTasks =
                tasks.filter(
                    (task) => {

                        const sameProject =
                            String(
                                task.project_id
                            ) ===
                            String(
                                selectedProjectId
                            );

                        if (!sameProject) {
                            return false;
                        }


                        /*
                        |--------------------------------------------------------------------------
                        | Không nhập tìm kiếm
                        |--------------------------------------------------------------------------
                        */

                        if (!ganttKeyword) {
                            return true;
                        }


                        /*
                        |--------------------------------------------------------------------------
                        | Tìm theo:
                        | - Tên công việc
                        | - Người phụ trách
                        |--------------------------------------------------------------------------
                        */

                        const title =
                            normalizeText(
                                task.title
                            );

                        const assignee =
                            normalizeText(
                                task.assignee_name
                            );

                        return (
                            title.includes(
                                ganttKeyword
                            ) ||
                            assignee.includes(
                                ganttKeyword
                            )
                        );
                    }
                );


            /*
            |--------------------------------------------------------------------------
            | Chuẩn hóa ngày Task
            |--------------------------------------------------------------------------
            */

            const validTasks =
                projectTasks
                    .filter(
                        (task) =>
                            task.start_date &&
                            task.end_date
                    )
                    .map(
                        (task) => {

                            const start =
                                new Date(
                                    task.start_date
                                );

                            const end =
                                new Date(
                                    task.end_date
                                );

                            return {
                                ...task,
                                start,
                                end
                            };
                        }
                    )
                    .filter(
                        (task) => {

                            const validStart =
                                !Number.isNaN(
                                    task.start
                                        .getTime()
                                );

                            const validEnd =
                                !Number.isNaN(
                                    task.end
                                        .getTime()
                                );

                            return (
                                validStart &&
                                validEnd
                            );
                        }
                    )
                    .sort(
                        (
                            first,
                            second
                        ) => {

                            /*
                             * Sắp xếp ngày bắt đầu tăng dần
                             */

                            const startCompare =
                                first.start -
                                second.start;

                            if (
                                startCompare !== 0
                            ) {
                                return startCompare;
                            }

                            /*
                             * Nếu cùng ngày thì theo ID
                             */

                            return (
                                Number(
                                    first.id
                                ) -
                                Number(
                                    second.id
                                )
                            );
                        }
                    );


            /*
            |--------------------------------------------------------------------------
            | Không có Task
            |--------------------------------------------------------------------------
            */

            if (
                validTasks.length === 0
            ) {
                return {
                    tasks: [],
                    minDate: null,
                    maxDate: null,
                    totalDays: 1
                };
            }


            /*
            |--------------------------------------------------------------------------
            | Ngày bắt đầu nhỏ nhất
            |--------------------------------------------------------------------------
            */

            const minDate =
                new Date(
                    Math.min(
                        ...validTasks.map(
                            (task) =>
                                task.start
                                    .getTime()
                        )
                    )
                );

            minDate.setHours(
                0,
                0,
                0,
                0
            );


            /*
            |--------------------------------------------------------------------------
            | Ngày kết thúc lớn nhất
            |--------------------------------------------------------------------------
            */

            const maxDate =
                new Date(
                    Math.max(
                        ...validTasks.map(
                            (task) =>
                                task.end
                                    .getTime()
                        )
                    )
                );

            maxDate.setHours(
                23,
                59,
                59,
                999
            );


            /*
            |--------------------------------------------------------------------------
            | Tổng số ngày
            |--------------------------------------------------------------------------
            */

            const DAY =
                1000 *
                60 *
                60 *
                24;

            const totalDays =
                Math.max(
                    1,
                    Math.ceil(
                        (
                            maxDate.getTime() -
                            minDate.getTime()
                        ) /
                        DAY
                    ) + 1
                );


            /*
            |--------------------------------------------------------------------------
            | Trả dữ liệu
            |--------------------------------------------------------------------------
            */

            return {
                tasks:
                    validTasks,

                minDate,

                maxDate,

                totalDays
            };

        }, [
            tasks,
            ganttProjectId,
            ganttProjects,
            ganttSearch
        ]);

    const selectedKanbanTasks =
    useMemo(() => {

        if (!selectedKanbanStatus) {
            return [];
        }

        const kanbanKeyword =
            normalizeText(
                kanbanSearch
            );

        return filteredTasks
            .filter(
                (task) =>
                    task.status ===
                    selectedKanbanStatus
            )
            .filter((task) => {

                if (!kanbanKeyword) {
                    return true;
                }

                return (
                    normalizeText(
                        task.title
                    ).includes(
                        kanbanKeyword
                    ) ||

                    normalizeText(
                        task.project_name
                    ).includes(
                        kanbanKeyword
                    ) ||

                    normalizeText(
                        task.assignee_name
                    ).includes(
                        kanbanKeyword
                    )
                );
            });

    }, [
        filteredTasks,
        selectedKanbanStatus,
        kanbanSearch
    ]);

    const openProject = (projectId) => {
        if (!projectId) {
            navigate("/project");
            return;
        }

        navigate(`/project/${projectId}`);
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
                    <div className="topbar-account-wrapper">
                        <button
                            type="button"
                            className="topbar-account"
                            onClick={() =>
                                setShowUserMenu(
                                    (previous) => !previous
                                )
                            }
                        >
                            <div className="topbar-avatar">
                                {currentUser?.full_name
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                            </div>

                            <div className="topbar-account-info">
                                <strong>
                                    {currentUser?.full_name || "Khách"}
                                </strong>

                                <span>
                                    {currentUser?.role === "ADMIN"
                                        ? "Quản trị viên"
                                        : currentUser?.role === "MANAGER"
                                            ? "Quản lý"
                                            : currentUser?.role === "MEMBER"
                                                ? "Thành viên"
                                                : "Chưa đăng nhập"}
                                </span>
                            </div>

                            <span
                                className={`account-arrow ${showUserMenu ? "open" : ""
                                    }`}
                            >
                                ▼
                            </span>
                        </button>

                        {showUserMenu && (
                            <div className="account-dropdown">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        navigate("/setting");
                                    }}
                                >
                                    ⚙ Cài đặt
                                </button>

                                {currentUser ? (
                                    <button
                                        type="button"
                                        className="account-logout"
                                        onClick={handleLogout}
                                    >
                                        ↪ Đăng xuất
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/login")
                                        }
                                    >
                                        Đăng nhập
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="topbar-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm dự án, công việc, thành viên..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>
                </header>

                <section className="card timeline-card">
                    <div className="timeline-header">
                        <div>
                            <span>Bắt đầu</span>
                            <b>
                                {formatDate(
                                    projectTimeline.start
                                )}
                            </b>
                        </div>

                        <div className="timeline-title">
                            Tiến độ thời gian dự án
                        </div>

                        <div>
                            <span>Kết thúc</span>
                            <b>
                                {formatDate(
                                    projectTimeline.end
                                )}
                            </b>
                        </div>
                    </div>

                    <div className="timeline-track">
                        <div
                            className="timeline-completed"
                            style={{
                                width: `${projectTimeline.todayPercent}%`
                            }}
                        />

                        <div
                            className="timeline-today"
                            style={{
                                left: `${projectTimeline.todayPercent}%`
                            }}
                        >
                            <span>Hôm nay</span>
                        </div>
                    </div>

                    <div className="timeline-projects">
                        {filteredProjects.length === 0 ? (
                            <p>Chưa có dự án để hiển thị</p>
                        ) : (
                            filteredProjects
                                .slice(0, 4)
                                .map((project) => (
                                    <button
                                        key={project.id}
                                        type="button"
                                        onClick={() =>
                                            openProject(project.id)
                                        }
                                    >
                                        {project.name}
                                    </button>
                                ))
                        )}
                    </div>
                </section>

                <section className="stats">
                    <div className="stat-card">
                        <p>Tổng dự án</p>
                        <h2>{totalProjects}</h2>
                        <span>Dự án được phép xem</span>
                    </div>

                    <div className="stat-card">
                        <p>Tổng công việc</p>
                        <h2>{totalTasks}</h2>
                        <span>Công việc hiện tại</span>
                    </div>

                    <div className="stat-card">
                        <p>Đang thực hiện</p>
                        <h2>{doingTasks}</h2>
                        <span>{reviewTasks} đang review</span>
                    </div>

                    <div className="stat-card">
                        <p>Hoàn thành</p>
                        <h2>{completedTasks}</h2>
                        <span>Đã hoàn tất</span>
                    </div>

                    <div className="stat-card danger">
                        <p>Quá hạn</p>
                        <h2>{overdueTasks}</h2>
                        <span>Cần xử lý</span>
                    </div>
                </section>


                <section className="ms-project-overview">
                    <div className="ms-left-column">
                        <div className="card ms-progress-card">
                            <div className="ms-progress-header">
                                <div>
                                    <span>TỔNG QUAN</span>
                                    <h3>Tiến độ hoàn thành</h3>
                                </div>

                                <small>
                                    {formatDate(
                                        projectTimeline.start
                                    )}
                                    {" — "}
                                    {formatDate(
                                        projectTimeline.end
                                    )}
                                </small>
                            </div>

                            <div className="ms-progress-box">
                                <span>% HOÀN THÀNH</span>

                                <strong>
                                    {averageProjectProgress}%
                                </strong>

                                <p>
                                    {currentUser?.role === "MEMBER"
                                        ? "Tiến độ công việc của bạn"
                                        : "Tiến độ trung bình toàn dự án"}
                                </p>
                            </div>
                        </div>

                        <div className="card ms-milestone-card">
                            <div className="ms-section-title">
                                <span>MILESTONES DUE</span>

                                <h3>
                                    Các mốc quan trọng cần hoàn thành
                                </h3>

                                <p>
                                    Các dự án sắp đến mốc hoàn thành.
                                </p>
                            </div>

                            {milestones.length === 0 ? (
                                <p className="empty-text">
                                    Chưa có mốc quan trọng
                                </p>
                            ) : (
                                <div className="overview-table">
                                    <div className="overview-table-head">
                                        <span>Tên</span>
                                        <span>Hoàn thành</span>
                                    </div>

                                    {milestones.map((project) => (
                                        <div
                                            className="overview-table-row"
                                            key={project.id}
                                            onClick={() =>
                                                openProject(project.id)
                                            }
                                        >
                                            <span>
                                                {project.name}
                                            </span>

                                            <b>
                                                {formatDate(
                                                    project.end_date
                                                )}
                                            </b>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ms-right-column">
                        <div className="card ms-chart-card">
                            <div className="ms-section-title">
                                <span>% COMPLETE</span>
                                <h3>Tiến độ các dự án</h3>
                                <p>
                                    Phần trăm hoàn thành của từng dự án.
                                </p>
                            </div>

                            <div className="ms-project-chart">

                                {/* Trục Y */}
                                <div className="chart-y-axis">
                                    {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map(
                                        (value) => (
                                            <div
                                                className="chart-y-row"
                                                key={value}
                                            >
                                                <span>{value}%</span>
                                                <div className="chart-line" />
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Cột biểu đồ */}
                                <div className="chart-bars">

                                    {chartProjects.map(
                                        (project) => {
                                            const progress =
                                                Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            project.progress
                                                        ) || 0
                                                    )
                                                );

                                            return (
                                                <div
                                                    className="ms-project-bar-item"
                                                    key={project.id}
                                                    title={project.name}
                                                >
                                                    <div className="ms-bar-area">

                                                        <b
                                                            style={{
                                                                bottom:
                                                                    progress === 0
                                                                        ? "6px"
                                                                        : `calc(${progress}% + 6px)`
                                                            }}
                                                        >
                                                            {progress}%
                                                        </b>

                                                        <span
                                                            style={{
                                                                height:
                                                                    progress === 0
                                                                        ? "2px"
                                                                        : `${progress}%`
                                                            }}
                                                        />

                                                    </div>

                                                    <p>
                                                        {project.name}
                                                    </p>
                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </div>

                            {filteredProjects.length >
                                CHART_PAGE_SIZE && (
                                    <div className="chart-pagination">

                                        <button
                                            type="button"
                                            disabled={
                                                chartPage === 1
                                            }
                                            onClick={() =>
                                                setChartPage(
                                                    (page) =>
                                                        Math.max(
                                                            1,
                                                            page - 1
                                                        )
                                                )
                                            }
                                        >
                                            ◀ Trước
                                        </button>

                                        <span>
                                            {(
                                                chartPage - 1
                                            ) *
                                                CHART_PAGE_SIZE +
                                                1}
                                            {" - "}
                                            {Math.min(
                                                chartPage *
                                                CHART_PAGE_SIZE,
                                                filteredProjects.length
                                            )}
                                            {" / "}
                                            {filteredProjects.length}
                                            {" dự án"}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={
                                                chartPage ===
                                                totalChartPages
                                            }
                                            onClick={() =>
                                                setChartPage(
                                                    (page) =>
                                                        Math.min(
                                                            totalChartPages,
                                                            page + 1
                                                        )
                                                )
                                            }
                                        >
                                            Sau ▶
                                        </button>

                                    </div>
                                )}

                        </div>

                        <div className="card ms-late-task-card">
                            <div className="ms-section-title">
                                <span>LATE TASKS</span>
                                <h3>Công việc trễ hạn</h3>
                                <p>
                                    Các công việc đã quá hạn nhưng chưa hoàn thành.
                                </p>
                            </div>

                            {lateTasks.length === 0 ? (
                                <p className="empty-text">
                                    Không có công việc trễ hạn
                                </p>
                            ) : (
                                <div className="late-task-table">
                                    <div className="late-task-table-head ms-late-head">
                                        <span>Công việc</span>
                                        <span>Bắt đầu</span>
                                        <span>Kết thúc</span>
                                        <span>Thời lượng</span>
                                        <span>Tiến độ</span>
                                        <span>Người phụ trách</span>
                                    </div>

                                    {lateTasks.map((task) => (
                                        <div
                                            className="late-task-table-row ms-late-row"
                                            key={task.id}
                                            onClick={() =>
                                                openProject(
                                                    task.project_id
                                                )
                                            }
                                        >
                                            <span>{task.title}</span>

                                            <span>
                                                {formatDate(
                                                    task.start_date
                                                )}
                                            </span>

                                            <span>
                                                {formatDate(
                                                    task.end_date
                                                )}
                                            </span>

                                            <span>
                                                {task.duration
                                                    ? `${task.duration} ngày`
                                                    : "—"}
                                            </span>

                                            <b>
                                                {Number(
                                                    task.progress
                                                ) || 0}
                                                %
                                            </b>

                                            <span>
                                                {task.assignee_name ||
                                                    "Chưa phân công"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="card task-burndown-card">
                    <div className="ms-section-title">
                        <span>TASK BURNDOWN</span>

                        <h3>
                            Tiến độ hoàn thành công việc
                        </h3>

                        <p>
                            Theo dõi số lượng công việc còn lại
                            theo kế hoạch và thực tế.
                        </p>
                    </div>

                    {taskBurndown.length === 0 ? (
                        <p className="empty-text">
                            Chưa có dữ liệu Task Burndown
                        </p>
                    ) : (
                        <>
                            <div className="burndown-chart">

                                {/* =========================
                    TRỤC Y
                ========================= */}
                                <div className="burndown-y-axis">
                                    {[100, 75, 50, 25, 0].map(
                                        (percent) => {
                                            const value =
                                                Math.round(
                                                    (
                                                        burndownChart.maxValue *
                                                        percent
                                                    ) / 100
                                                );

                                            return (
                                                <div
                                                    className="burndown-y-row"
                                                    key={percent}
                                                >
                                                    <span>
                                                        {value}
                                                    </span>

                                                    <div className="burndown-grid-line" />
                                                </div>
                                            );
                                        }
                                    )}
                                </div>

                                {/* =========================
                    SVG BIỂU ĐỒ
                ========================= */}
                                <div className="burndown-svg-wrapper">
                                    <svg
                                        className="burndown-svg"
                                        viewBox="0 0 1000 260"
                                        preserveAspectRatio="none"
                                    >
                                        {/* Baseline */}
                                        <polyline
                                            className="burndown-baseline-line"
                                            points={
                                                burndownChart.baselinePoints
                                            }
                                        />

                                        {/* Remaining */}
                                        <polyline
                                            className="burndown-remaining-line"
                                            points={
                                                burndownChart.remainingPoints
                                            }
                                        />

                                        {/* Actual */}
                                        <polyline
                                            className="burndown-actual-line"
                                            points={
                                                burndownChart.actualPoints
                                            }
                                        />

                                        {/* Điểm Baseline */}
                                        {taskBurndown.map(
                                            (item, index) => {
                                                const x =
                                                    taskBurndown.length === 1
                                                        ? 500
                                                        : (
                                                            index /
                                                            (
                                                                taskBurndown.length -
                                                                1
                                                            )
                                                        ) * 1000;

                                                const y =
                                                    260 -
                                                    (
                                                        Number(
                                                            item.baselineRemainingTasks
                                                        ) /
                                                        burndownChart.maxValue
                                                    ) * 260;

                                                return (
                                                    <circle
                                                        key={`baseline-${index}`}
                                                        className="burndown-baseline-dot"
                                                        cx={x}
                                                        cy={y}
                                                        r="5"
                                                    >
                                                        <title>
                                                            {formatDate(
                                                                item.date
                                                            )}
                                                            {" - Baseline: "}
                                                            {
                                                                item.baselineRemainingTasks
                                                            }
                                                        </title>
                                                    </circle>
                                                );
                                            }
                                        )}

                                        {/* Điểm Remaining */}
                                        {taskBurndown.map(
                                            (item, index) => {
                                                const x =
                                                    taskBurndown.length === 1
                                                        ? 500
                                                        : (
                                                            index /
                                                            (
                                                                taskBurndown.length -
                                                                1
                                                            )
                                                        ) * 1000;

                                                const y =
                                                    260 -
                                                    (
                                                        Number(
                                                            item.remainingTasks
                                                        ) /
                                                        burndownChart.maxValue
                                                    ) * 260;

                                                return (
                                                    <circle
                                                        key={`remaining-${index}`}
                                                        className="burndown-remaining-dot"
                                                        cx={x}
                                                        cy={y}
                                                        r="5"
                                                    >
                                                        <title>
                                                            {formatDate(
                                                                item.date
                                                            )}
                                                            {" - Còn lại: "}
                                                            {
                                                                item.remainingTasks
                                                            }
                                                        </title>
                                                    </circle>
                                                );
                                            }
                                        )}

                                        {/* Điểm Actual */}
                                        {taskBurndown.map(
                                            (item, index) => {
                                                const x =
                                                    taskBurndown.length === 1
                                                        ? 500
                                                        : (
                                                            index /
                                                            (
                                                                taskBurndown.length -
                                                                1
                                                            )
                                                        ) * 1000;

                                                const y =
                                                    260 -
                                                    (
                                                        Number(
                                                            item.remainingActualTasks
                                                        ) /
                                                        burndownChart.maxValue
                                                    ) * 260;

                                                return (
                                                    <circle
                                                        key={`actual-${index}`}
                                                        className="burndown-actual-dot"
                                                        cx={x}
                                                        cy={y}
                                                        r="5"
                                                    >
                                                        <title>
                                                            {formatDate(
                                                                item.date
                                                            )}
                                                            {" - Thực tế: "}
                                                            {
                                                                item.remainingActualTasks
                                                            }
                                                        </title>
                                                    </circle>
                                                );
                                            }
                                        )}
                                    </svg>
                                </div>
                            </div>

                            {/* =========================
                TRỤC X
            ========================= */}
                            <div className="burndown-x-axis">
                                {taskBurndown.map(
                                    (item, index) => (
                                        <span key={index}>
                                            {formatDate(
                                                item.date
                                            )}
                                        </span>
                                    )
                                )}
                            </div>

                            {/* =========================
                CHÚ THÍCH
            ========================= */}
                            <div className="burndown-legend">
                                <div>
                                    <span className="legend-line baseline" />

                                    <span>
                                        Các nhiệm vụ còn lại cơ bản
                                    </span>
                                </div>

                                <div>
                                    <span className="legend-line remaining" />

                                    <span>
                                        Các nhiệm vụ còn lại
                                    </span>
                                </div>

                                <div>
                                    <span className="legend-line actual" />

                                    <span>
                                        Các nhiệm vụ thực tế còn lại
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                <section className="card recent-gantt-card">

                    <div className="ms-section-title">
                        <span>
                            TASK TIMELINE
                        </span>

                        <h3>
                            Tiến độ công việc gần đây
                        </h3>

                        <p>
                            Theo dõi thời gian thực hiện
                            và người phụ trách của từng công việc.
                        </p>
                    </div>

                    <div className="gantt-toolbar">

                        <div className="gantt-filter-group">

                            <label htmlFor="ganttProject">
                                Dự án
                            </label>

                            <select
                                id="ganttProject"
                                value={
                                    ganttProjectId ||
                                    (
                                        ganttProjects.length > 0
                                            ? String(
                                                ganttProjects[0].id
                                            )
                                            : ""
                                    )
                                }
                                onChange={(event) => {
                                    setGanttProjectId(
                                        event.target.value
                                    );

                                    setGanttSearch("");
                                }}
                            >

                                {ganttProjects.length === 0 ? (
                                    <option value="">
                                        Chưa có dự án
                                    </option>
                                ) : (
                                    ganttProjects.map(
                                        (project) => (
                                            <option
                                                key={project.id}
                                                value={
                                                    String(
                                                        project.id
                                                    )
                                                }
                                            >
                                                {project.name}
                                            </option>
                                        )
                                    )
                                )}

                            </select>

                        </div>


                        <div className="gantt-search-group">

                            <label htmlFor="ganttSearch">
                                Tìm kiếm
                            </label>

                            <input
                                id="ganttSearch"
                                type="text"
                                placeholder="Tìm công việc hoặc người phụ trách..."
                                value={ganttSearch}
                                onChange={(event) =>
                                    setGanttSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    {recentGanttData.tasks.length === 0 ? (
                        <p className="empty-text">
                            Chưa có công việc để hiển thị
                        </p>
                    ) : (
                        <div className="recent-gantt">

                            <div className="gantt-date-header">
                                <span>
                                    {formatDate(
                                        recentGanttData.minDate
                                    )}
                                </span>

                                <span>
                                    {formatDate(
                                        recentGanttData.maxDate
                                    )}
                                </span>
                            </div>

                            <div className="gantt-chart-area">

                                {/* Grid nền */}
                                <div className="gantt-grid">
                                    {[
                                        0,
                                        1,
                                        2,
                                        3,
                                        4,
                                        5
                                    ].map((item) => (
                                        <span key={item} />
                                    ))}
                                </div>

                                {/* Công việc */}
                                {recentGanttData.tasks.map(
                                    (task, index) => {

                                        const DAY =
                                            1000 *
                                            60 *
                                            60 *
                                            24;

                                        const startOffset =
                                            Math.max(
                                                0,
                                                Math.floor(
                                                    (
                                                        task.start.getTime() -
                                                        recentGanttData
                                                            .minDate
                                                            .getTime()
                                                    ) /
                                                    DAY
                                                )
                                            );

                                        const duration =
                                            Math.max(
                                                1,
                                                Math.ceil(
                                                    (
                                                        task.end.getTime() -
                                                        task.start.getTime()
                                                    ) /
                                                    DAY
                                                ) + 1
                                            );

                                        const left =
                                            (
                                                startOffset /
                                                recentGanttData.totalDays
                                            ) *
                                            100;

                                        const width =
                                            (
                                                duration /
                                                recentGanttData.totalDays
                                            ) *
                                            100;

                                        const safeWidth =
                                            Math.max(
                                                4,
                                                Math.min(
                                                    width,
                                                    100 - left
                                                )
                                            );

                                        return (
                                            <div
                                                className="gantt-task-row"
                                                key={task.id}
                                                onClick={() =>
                                                    openProject(
                                                        task.project_id
                                                    )
                                                }
                                            >

                                                <div
                                                    className="gantt-task-bar"
                                                    style={{
                                                        left:
                                                            `${left}%`,

                                                        width:
                                                            `${safeWidth}%`
                                                    }}
                                                >
                                                    <div
                                                        className="gantt-progress-line"
                                                        style={{
                                                            width:
                                                                `${Math.min(
                                                                    100,
                                                                    Math.max(
                                                                        0,
                                                                        Number(
                                                                            task.progress
                                                                        ) || 0
                                                                    )
                                                                )}%`
                                                        }}
                                                    />
                                                </div>

                                                <div
                                                    className="gantt-assignee"
                                                    style={{
                                                        left: `${Math.min(
                                                            left + 1,
                                                            88
                                                        )}%`
                                                    }}
                                                >
                                                    <b>
                                                        {task.assignee_name ||
                                                            "Chưa phân công"}
                                                    </b>

                                                    <small>
                                                        {task.title}
                                                    </small>
                                                </div>

                                                {index <
                                                    recentGanttData.tasks.length -
                                                    1 && (
                                                        <div
                                                            className="gantt-connector"
                                                            style={{
                                                                left:
                                                                    `${Math.min(
                                                                        left +
                                                                        safeWidth,
                                                                        98
                                                                    )}%`
                                                            }}
                                                        />
                                                    )}

                                            </div>
                                        );
                                    }
                                )}

                                <div className="gantt-final-date">
                                    <span className="gantt-diamond">
                                        ◆
                                    </span>

                                    <b>
                                        {formatDate(
                                            recentGanttData.maxDate
                                        )}
                                    </b>
                                </div>

                            </div>
                        </div>
                    )}

                </section>

                <section className="content-grid">

    <div className="card kanban">

        <h3>
            Bảng công việc Kanban
        </h3>


        <div className="kanban-board">

            {taskColumns.map((column) => {

                const columnTasks =
                    filteredTasks
                        .filter(
                            (task) =>
                                task.status ===
                                column.key
                        )
                        .slice(0, 3);

                return (

                    <div
                        className="column"
                        key={column.key}
                    >

                        <h4>
                            {column.title}
                        </h4>


                        <div className="column-task-list">

                            {columnTasks.length === 0 ? (

                                <p>
                                    Chưa có công việc
                                </p>

                            ) : (

                                columnTasks.map(
                                    (task) => (

                                        <div
                                            className="task"
                                            key={task.id}
                                            onClick={() =>
                                                openProject(
                                                    task.project_id
                                                )
                                            }
                                        >

                                            <b>
                                                {task.title}
                                            </b>

                                            <small>
                                                {task.project_name ||
                                                    "Chưa có dự án"}
                                            </small>

                                            <span>
                                                {Number(
                                                    task.progress
                                                ) || 0}
                                                %
                                            </span>

                                        </div>

                                    )
                                )

                            )}

                        </div>


                        <button
                            type="button"
                            onClick={() => {

                                setSelectedKanbanStatus(
                                    column.key
                                );

                                setKanbanSearch("");

                            }}
                        >
                            Xem công việc
                        </button>

                    </div>

                );
            })}

        </div>


        {/* =========================================
            BẢNG DANH SÁCH CÔNG VIỆC
        ========================================= */}

        {selectedKanbanStatus && (

    <div
        className="kanban-modal-overlay"
        onClick={() => {
            setSelectedKanbanStatus(null);
            setKanbanSearch("");
        }}
    >

        <div
            className="kanban-modal"
            onClick={(event) =>
                event.stopPropagation()
            }
        >

            {/* =========================
                HEADER
            ========================= */}

            <div className="kanban-modal-header">

                <div>
                    <span>
                        DANH SÁCH CÔNG VIỆC
                    </span>

                    <h3>
                        {
                            taskColumns.find(
                                (column) =>
                                    column.key ===
                                    selectedKanbanStatus
                            )?.title
                        }
                    </h3>
                </div>


                <button
                    type="button"
                    className="kanban-modal-close"
                    onClick={() => {
                        setSelectedKanbanStatus(null);
                        setKanbanSearch("");
                    }}
                >
                    ✕
                </button>

            </div>


            {/* =========================
                TÌM KIẾM
            ========================= */}

            <div className="kanban-modal-search">

                <input
                    type="text"
                    placeholder="Tìm công việc, dự án, người phụ trách..."
                    value={kanbanSearch}
                    onChange={(event) =>
                        setKanbanSearch(
                            event.target.value
                        )
                    }
                    autoFocus
                />

            </div>


            {/* =========================
                DANH SÁCH
            ========================= */}

            {selectedKanbanTasks.length === 0 ? (

                <p className="empty-text">
                    Không tìm thấy công việc
                </p>

            ) : (

                <div className="kanban-modal-table">

                    <div className="kanban-modal-table-head">

                        <span>Công việc</span>
                        <span>Dự án</span>
                        <span>Bắt đầu</span>
                        <span>Kết thúc</span>
                        <span>Tiến độ</span>
                        <span>Người phụ trách</span>

                    </div>


                    <div className="kanban-modal-table-body">

                        {selectedKanbanTasks.map(
                            (task) => (

                                <div
                                    className="kanban-modal-table-row"
                                    key={task.id}
                                    onClick={() =>
                                        openProject(
                                            task.project_id
                                        )
                                    }
                                >

                                    <span>
                                        {task.title}
                                    </span>

                                    <span>
                                        {task.project_name ||
                                            "Chưa có dự án"}
                                    </span>

                                    <span>
                                        {formatDate(
                                            task.start_date
                                        )}
                                    </span>

                                    <span>
                                        {formatDate(
                                            task.end_date
                                        )}
                                    </span>

                                    <b>
                                        {Number(
                                            task.progress
                                        ) || 0}
                                        %
                                    </b>

                                    <span>
                                        {task.assignee_name ||
                                            "Chưa phân công"}
                                    </span>

                                </div>

                            )
                        )}

                    </div>

                </div>

            )}

        </div>

    </div>

)}

    </div>

</section>
            </main>
        </div>
    );
}

export default Home;