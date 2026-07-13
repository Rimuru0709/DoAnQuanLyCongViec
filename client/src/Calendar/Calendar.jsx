import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { useNavigate } from "react-router-dom";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import Sidebar from "../Sidebar/Sidebar";
import "./Calendar.css";

const API_URL = "http://localhost:5000/api";

function Calendar() {
    const navigate = useNavigate();
    const calendarRef = useRef(null);

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] =
        useState("all");

    const [currentDate, setCurrentDate] =
        useState(new Date());

    const [currentView, setCurrentView] =
        useState("dayGridMonth");

    const [selectedTask, setSelectedTask] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const showMessage = (text) => {
        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 2500);
    };

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

    const authFetch = async (url) => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            logoutAndRedirect();

            throw new Error(
                "Chưa đăng nhập"
            );
        }

        const response = await fetch(url, {
            headers: {
                Authorization:
                    `Bearer ${token}`
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

    const loadData = async (
        showLoading = true
    ) => {
        if (showLoading) {
            setLoading(true);
        }

        try {
            const [
                taskResponse,
                projectResponse
            ] = await Promise.all([
                authFetch(
                    `${API_URL}/tasks`
                ),
                authFetch(
                    `${API_URL}/projects`
                )
            ]);

            const [
                taskData,
                projectData
            ] = await Promise.all([
                parseResponse(taskResponse),
                parseResponse(projectResponse)
            ]);

            if (!taskResponse.ok) {
                setTasks([]);

                showMessage(
                    taskData.message ||
                    "Không thể tải công việc"
                );
            } else {
                setTasks(
                    Array.isArray(taskData)
                        ? taskData
                        : Array.isArray(
                            taskData.tasks
                        )
                            ? taskData.tasks
                            : []
                );
            }

            if (!projectResponse.ok) {
                setProjects([]);

                showMessage(
                    projectData.message ||
                    "Không thể tải dự án"
                );
            } else {
                setProjects(
                    Array.isArray(projectData)
                        ? projectData
                        : Array.isArray(
                            projectData.projects
                        )
                            ? projectData.projects
                            : []
                );
            }
        } catch (error) {
            console.error(
                "Lỗi tải dữ liệu lịch:",
                error
            );

            if (
                error.message !==
                    "Phiên đăng nhập đã hết hạn" &&
                error.message !==
                    "Chưa đăng nhập"
            ) {
                showMessage(
                    "Không thể kết nối server"
                );
            }
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadData(true);

        const interval = setInterval(() => {
            loadData(false);
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const safeTasks = Array.isArray(tasks)
        ? tasks
        : [];

    const safeProjects = Array.isArray(projects)
        ? projects
        : [];

    const filteredTasks = useMemo(() => {
        return safeTasks.filter((task) => {
            if (!task.end_date) {
                return false;
            }

            if (selectedProject === "all") {
                return true;
            }

            return (
                Number(task.project_id) ===
                Number(selectedProject)
            );
        });
    }, [
        safeTasks,
        selectedProject
    ]);

    const events = useMemo(() => {
        return filteredTasks.map((task) => ({
            id: String(task.id),
            title: task.title,
            start: String(
                task.end_date
            ).slice(0, 10),
            allDay: true,
            color:
                task.status ===
                "HOAN_THANH"
                    ? "#22c55e"
                    : task.status ===
                        "DANG_REVIEW"
                        ? "#f59e0b"
                        : task.status ===
                            "DANG_LAM"
                            ? "#2563eb"
                            : task.status ===
                                "QUA_HAN"
                                ? "#ef4444"
                                : "#64748b"
        }));
    }, [filteredTasks]);

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const upcomingTasks = useMemo(() => {
        return [...filteredTasks]
            .filter((task) => {
                const endDate = String(
                    task.end_date
                ).slice(0, 10);

                return (
                    endDate >= today &&
                    task.status !==
                        "HOAN_THANH"
                );
            })
            .sort(
                (first, second) =>
                    new Date(first.end_date) -
                    new Date(second.end_date)
            )
            .slice(0, 10);
    }, [
        filteredTasks,
        today
    ]);

    const totalDeadline =
        filteredTasks.length;

    const todayTasks =
        filteredTasks.filter(
            (task) =>
                String(task.end_date).slice(
                    0,
                    10
                ) === today
        ).length;

    const doneTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "HOAN_THANH"
        ).length;

    const years = Array.from(
        { length: 101 },
        (_, index) => 2000 + index
    );

    const goToDate = (date) => {
        const api =
            calendarRef.current?.getApi();

        if (!api) {
            return;
        }

        api.gotoDate(date);
        setCurrentDate(new Date(date));
    };

    const handlePrev = () => {
        const api =
            calendarRef.current?.getApi();

        if (!api) {
            return;
        }

        api.prev();
        setCurrentDate(api.getDate());
    };

    const handleNext = () => {
        const api =
            calendarRef.current?.getApi();

        if (!api) {
            return;
        }

        api.next();
        setCurrentDate(api.getDate());
    };

    const handleToday = () => {
        const api =
            calendarRef.current?.getApi();

        if (!api) {
            return;
        }

        api.today();
        setCurrentDate(api.getDate());
    };

    const handleChangeView = (view) => {
        const api =
            calendarRef.current?.getApi();

        if (!api) {
            return;
        }

        api.changeView(view);
        setCurrentView(view);
        setCurrentDate(api.getDate());
    };

    const handleChangeMonth = (event) => {
        const newDate =
            new Date(currentDate);

        newDate.setMonth(
            Number(event.target.value)
        );

        goToDate(newDate);
    };

    const handleChangeYear = (event) => {
        const newDate =
            new Date(currentDate);

        newDate.setFullYear(
            Number(event.target.value)
        );

        goToDate(newDate);
    };

    const handleDateClick = (info) => {
        goToDate(info.date);
    };

    const handleEventClick = (info) => {
        const task = safeTasks.find(
            (item) =>
                Number(item.id) ===
                Number(info.event.id)
        );

        if (task) {
            setSelectedTask(task);
        }
    };

    return (
        <div className="app">
            <Sidebar />

            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <main className="calendar-page">
                <div className="calendar-header">
                    <div>
                        <h1>Lịch</h1>

                        <p>
                            Theo dõi deadline công việc
                            và tiến độ dự án.
                        </p>
                    </div>
                </div>

                <div className="calendar-stats">
                    <div>
                        <span>
                            Tổng deadline
                        </span>

                        <b>{totalDeadline}</b>
                    </div>

                    <div>
                        <span>
                            Deadline hôm nay
                        </span>

                        <b>{todayTasks}</b>
                    </div>

                    <div>
                        <span>
                            Đã hoàn thành
                        </span>

                        <b>{doneTasks}</b>
                    </div>
                </div>

                {loading ? (
                    <div className="calendar-card">
                        <p>
                            Đang tải dữ liệu...
                        </p>
                    </div>
                ) : (
                    <div className="calendar-layout">
                        <section className="calendar-card">
                            <div className="calendar-custom-toolbar">
                                <div className="calendar-left-actions">
                                    <button
                                        type="button"
                                        onClick={
                                            handlePrev
                                        }
                                    >
                                        ‹
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleNext
                                        }
                                    >
                                        ›
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleToday
                                        }
                                    >
                                        Hôm nay
                                    </button>
                                </div>

                                <div className="calendar-title-select">
                                    <select
                                        value={
                                            currentDate.getMonth()
                                        }
                                        onChange={
                                            handleChangeMonth
                                        }
                                    >
                                        {Array.from(
                                            {
                                                length: 12
                                            },
                                            (
                                                _,
                                                index
                                            ) => (
                                                <option
                                                    key={
                                                        index
                                                    }
                                                    value={
                                                        index
                                                    }
                                                >
                                                    Tháng{" "}
                                                    {index +
                                                        1}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <select
                                        value={
                                            currentDate.getFullYear()
                                        }
                                        onChange={
                                            handleChangeYear
                                        }
                                    >
                                        {years.map(
                                            (year) => (
                                                <option
                                                    key={
                                                        year
                                                    }
                                                    value={
                                                        year
                                                    }
                                                >
                                                    {year}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <select
                                        value={
                                            selectedProject
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedProject(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >
                                        <option value="all">
                                            Tất cả dự án
                                        </option>

                                        {safeProjects.map(
                                            (
                                                project
                                            ) => (
                                                <option
                                                    key={
                                                        project.id
                                                    }
                                                    value={
                                                        project.id
                                                    }
                                                >
                                                    {
                                                        project.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="calendar-view-actions">
                                    <button
                                        type="button"
                                        className={
                                            currentView ===
                                            "dayGridMonth"
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handleChangeView(
                                                "dayGridMonth"
                                            )
                                        }
                                    >
                                        Tháng
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            currentView ===
                                            "dayGridWeek"
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handleChangeView(
                                                "dayGridWeek"
                                            )
                                        }
                                    >
                                        Tuần
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            currentView ===
                                            "dayGridDay"
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handleChangeView(
                                                "dayGridDay"
                                            )
                                        }
                                    >
                                        Ngày
                                    </button>
                                </div>
                            </div>

                            <FullCalendar
                                ref={calendarRef}
                                plugins={[
                                    dayGridPlugin,
                                    interactionPlugin
                                ]}
                                initialView="dayGridMonth"
                                headerToolbar={false}
                                events={events}
                                height="auto"
                                locale="vi"
                                selectable
                                dateClick={
                                    handleDateClick
                                }
                                eventClick={
                                    handleEventClick
                                }
                                datesSet={(info) => {
                                    setCurrentDate(
                                        info.view
                                            .currentStart
                                    );

                                    setCurrentView(
                                        info.view.type
                                    );
                                }}
                            />
                        </section>

                        <aside className="deadline-panel">
                            <h3>
                                Deadline sắp tới
                            </h3>

                            <div className="deadline-list">
                                {upcomingTasks.length ===
                                0 ? (
                                    <p className="empty-deadline">
                                        Chưa có deadline
                                    </p>
                                ) : (
                                    upcomingTasks.map(
                                        (task) => (
                                            <div
                                                className="deadline-item"
                                                key={
                                                    task.id
                                                }
                                                onClick={() =>
                                                    setSelectedTask(
                                                        task
                                                    )
                                                }
                                            >
                                                <h4>
                                                    {
                                                        task.title
                                                    }
                                                </h4>

                                                <p>
                                                    {task.project_name ||
                                                        "Không rõ dự án"}
                                                </p>

                                                <span>
                                                    📅{" "}
                                                    {new Date(
                                                        task.end_date
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    )
                                )}
                            </div>
                        </aside>
                    </div>
                )}

                {selectedTask && (
                    <div className="calendar-modal-overlay">
                        <div className="calendar-modal">
                            <h2>
                                {selectedTask.title}
                            </h2>

                            <p>
                                {selectedTask.description ||
                                    "Không có mô tả"}
                            </p>

                            <div className="calendar-modal-grid">
                                <div>
                                    <span>Dự án</span>

                                    <b>
                                        {selectedTask.project_name ||
                                            "Không rõ"}
                                    </b>
                                </div>

                                <div>
                                    <span>
                                        Người phụ trách
                                    </span>

                                    <b>
                                        {selectedTask.assignee_name ||
                                            "Chưa giao"}
                                    </b>
                                </div>

                                <div>
                                    <span>
                                        Deadline
                                    </span>

                                    <b>
                                        {selectedTask.end_date
                                            ? new Date(
                                                selectedTask.end_date
                                            ).toLocaleDateString(
                                                "vi-VN"
                                            )
                                            : "Chưa có"}
                                    </b>
                                </div>

                                <div>
                                    <span>
                                        Tiến độ
                                    </span>

                                    <b>
                                        {Number(
                                            selectedTask.progress
                                        ) || 0}
                                        %
                                    </b>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedTask(
                                        null
                                    )
                                }
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Calendar;