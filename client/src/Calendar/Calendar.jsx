import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import Sidebar from "../Sidebar/Sidebar";
import "./Calendar.css";

function Calendar() {
    const calendarRef = useRef(null);

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("all");

    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState("dayGridMonth");
    const [selectedTask, setSelectedTask] = useState(null);

    const loadTasks = () => {
        fetch("http://localhost:5000/api/tasks")
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => console.log(err));
    };

    const loadProjects = () => {
        fetch("http://localhost:5000/api/projects")
            .then((res) => res.json())
            .then((data) => setProjects(data))
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        loadTasks();
        loadProjects();

        const interval = setInterval(() => {
            loadTasks();
            loadProjects();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (!task.end_date) return false;
            if (selectedProject === "all") return true;
            return Number(task.project_id) === Number(selectedProject);
        });
    }, [tasks, selectedProject]);

    const events = filteredTasks.map((task) => ({
        id: String(task.id),
        title: task.title,
        start: task.end_date,
        allDay: true,
        color:
            task.status === "HOAN_THANH"
                ? "#22c55e"
                : task.status === "DANG_REVIEW"
                ? "#f59e0b"
                : task.status === "DANG_LAM"
                ? "#2563eb"
                : "#64748b",
    }));

    const today = new Date().toISOString().slice(0, 10);

    const upcomingTasks = useMemo(() => {
        return filteredTasks
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .slice(0, 10);
    }, [filteredTasks]);

    const totalDeadline = filteredTasks.length;

    const todayTasks = filteredTasks.filter(
        (task) => String(task.end_date).slice(0, 10) === today
    ).length;

    const doneTasks = filteredTasks.filter(
        (task) => task.status === "HOAN_THANH"
    ).length;

    const years = Array.from({ length: 101 }, (_, index) => 2000 + index);

    const goToDate = (date) => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        api.gotoDate(date);
        setCurrentDate(new Date(date));
    };

    const handlePrev = () => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        api.prev();
        setCurrentDate(api.getDate());
    };

    const handleNext = () => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        api.next();
        setCurrentDate(api.getDate());
    };

    const handleToday = () => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        api.today();
        setCurrentDate(api.getDate());
    };

    const handleChangeView = (view) => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        api.changeView(view);
        setCurrentView(view);
        setCurrentDate(api.getDate());
    };

    const handleChangeMonth = (e) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(Number(e.target.value));
        goToDate(newDate);
    };

    const handleChangeYear = (e) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(Number(e.target.value));
        goToDate(newDate);
    };

    const handleDateClick = (info) => {
        goToDate(info.date);
    };

    const handleEventClick = (info) => {
        const task = tasks.find((t) => Number(t.id) === Number(info.event.id));
        if (task) setSelectedTask(task);
    };

    return (
        <div className="app">
            <Sidebar />

            <main className="calendar-page">
                <div className="calendar-header">
                    <div>
                        <h1>Lịch</h1>
                        <p>Theo dõi deadline công việc và tiến độ dự án.</p>
                    </div>

                </div>

                <div className="calendar-stats">
                    <div>
                        <span>Tổng deadline</span>
                        <b>{totalDeadline}</b>
                    </div>

                    <div>
                        <span>Deadline hôm nay</span>
                        <b>{todayTasks}</b>
                    </div>

                    <div>
                        <span>Đã hoàn thành</span>
                        <b>{doneTasks}</b>
                    </div>
                </div>

                <div className="calendar-layout">
                    <section className="calendar-card">
                        <div className="calendar-custom-toolbar">
                            <div className="calendar-left-actions">
                                <button type="button" onClick={handlePrev}>
                                    ‹
                                </button>

                                <button type="button" onClick={handleNext}>
                                    ›
                                </button>

                                <button type="button" onClick={handleToday}>
                                    today
                                </button>
                            </div>

                            <div className="calendar-title-select">
                                <select
                                    value={currentDate.getMonth()}
                                    onChange={handleChangeMonth}
                                >
                                    {Array.from({ length: 12 }, (_, index) => (
                                        <option key={index} value={index}>
                                            Tháng {index + 1}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={currentDate.getFullYear()}
                                    onChange={handleChangeYear}
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={selectedProject}
                                    onChange={(e) =>
                                        setSelectedProject(e.target.value)
                                    }
                                >
                                    <option value="all">Tất cả dự án</option>

                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="calendar-view-actions">
                                <button
                                    type="button"
                                    className={
                                        currentView === "dayGridMonth"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        handleChangeView("dayGridMonth")
                                    }
                                >
                                    month
                                </button>

                                <button
                                    type="button"
                                    className={
                                        currentView === "dayGridWeek"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        handleChangeView("dayGridWeek")
                                    }
                                >
                                    week
                                </button>

                                <button
                                    type="button"
                                    className={
                                        currentView === "dayGridDay"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        handleChangeView("dayGridDay")
                                    }
                                >
                                    day
                                </button>
                            </div>
                        </div>

                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={false}
                            events={events}
                            height="auto"
                            locale="vi"
                            selectable={true}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            datesSet={(info) => {
                                setCurrentDate(info.view.currentStart);
                                setCurrentView(info.view.type);
                            }}
                        />
                    </section>

                    <aside className="deadline-panel">
                        <h3>Deadline sắp tới</h3>

                        <div className="deadline-list">
                            {upcomingTasks.length === 0 ? (
                                <p className="empty-deadline">
                                    Chưa có deadline
                                </p>
                            ) : (
                                upcomingTasks.map((task) => (
                                    <div
                                        className="deadline-item"
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                    >
                                        <h4>{task.title}</h4>
                                        <p>
                                            {task.project_name ||
                                                "Không rõ dự án"}
                                        </p>
                                        <span>
                                            📅{" "}
                                            {new Date(
                                                task.end_date
                                            ).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                </div>

                {selectedTask && (
                    <div className="calendar-modal-overlay">
                        <div className="calendar-modal">
                            <h2>{selectedTask.title}</h2>

                            <p>{selectedTask.description || "Không có mô tả"}</p>

                            <div className="calendar-modal-grid">
                                <div>
                                    <span>Dự án</span>
                                    <b>
                                        {selectedTask.project_name ||
                                            "Không rõ"}
                                    </b>
                                </div>

                                <div>
                                    <span>Người phụ trách</span>
                                    <b>
                                        {selectedTask.assignee_name ||
                                            "Chưa giao"}
                                    </b>
                                </div>

                                <div>
                                    <span>Deadline</span>
                                    <b>
                                        {selectedTask.end_date
                                            ? new Date(
                                                  selectedTask.end_date
                                              ).toLocaleDateString("vi-VN")
                                            : "Chưa có"}
                                    </b>
                                </div>

                                <div>
                                    <span>Tiến độ</span>
                                    <b>{Number(selectedTask.progress) || 0}%</b>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedTask(null)}
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