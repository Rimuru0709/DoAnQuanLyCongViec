import { useEffect, useMemo, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./Kanban.css";

const columns = [
    { key: "CHUA_LAM", title: "Chưa làm" },
    { key: "DANG_LAM", title: "Đang làm" },
    { key: "DANG_REVIEW", title: "Đang review" },
    { key: "HOAN_THANH", title: "Hoàn thành" },
];

const priorityText = {
    THAP: "Thấp",
    TRUNG_BINH: "Trung bình",
    CAO: "Cao",
};

const formatDate = (date) => {
    if (!date) return "Chưa có";
    return new Date(date).toLocaleDateString("vi-VN");
};

const formatDateInput = (date) => {
    if (!date) return "";
    return String(date).slice(0, 10);
};

const getProgressByStatus = (status, currentProgress) => {
    if (status === "CHUA_LAM") return 0;

    if (status === "DANG_LAM") {
        return currentProgress > 0 && currentProgress < 90
            ? currentProgress
            : 1;
    }

    if (status === "DANG_REVIEW") return 90;
    if (status === "HOAN_THANH") return 100;

    return currentProgress;
};

function Kanban() {
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [selectedTask, setSelectedTask] = useState(null);

    const loadTasks = () => {
        fetch("http://localhost:5000/api/tasks")
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const projects = useMemo(() => {
        const map = new Map();

        tasks.forEach((task) => {
            if (task.project_id) {
                map.set(task.project_id, task.project_name);
            }
        });

        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [tasks]);

    const filteredTasks = tasks.filter((task) => {
        const matchSearch =
            task.title?.toLowerCase().includes(search.toLowerCase()) ||
            task.description?.toLowerCase().includes(search.toLowerCase());

        const matchProject =
            projectFilter === "ALL" || String(task.project_id) === projectFilter;

        const matchPriority =
            priorityFilter === "ALL" || task.priority === priorityFilter;

        return matchSearch && matchProject && matchPriority;
    });

    const stats = {
        total: filteredTasks.length,
        todo: filteredTasks.filter((t) => t.status === "CHUA_LAM").length,
        doing: filteredTasks.filter((t) => t.status === "DANG_LAM").length,
        done: filteredTasks.filter((t) => t.status === "HOAN_THANH").length,
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();

        const taskId = Number(e.dataTransfer.getData("taskId"));
        const oldTask = tasks.find((task) => task.id === taskId);

        if (!oldTask || oldTask.status === newStatus) return;

        const newProgress = getProgressByStatus(
            newStatus,
            Number(oldTask.progress) || 0
        );

        setTasks((prev) =>
            prev.map((task) =>
                task.id === taskId
                    ? {
                          ...task,
                          status: newStatus,
                          progress: newProgress,
                      }
                    : task
            )
        );

        const res = await fetch(
            `http://localhost:5000/api/tasks/${taskId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            }
        );

        if (!res.ok) {
            alert("Cập nhật trạng thái thất bại");
            loadTasks();
        }
    };

    const handleModalChange = (e) => {
        const { name, value } = e.target;

        if (name === "status") {
            const progress = getProgressByStatus(
                value,
                Number(selectedTask.progress) || 0
            );

            setSelectedTask({
                ...selectedTask,
                status: value,
                progress,
            });

            return;
        }

        if (name === "progress") {
            if (value === "") {
                setSelectedTask({
                    ...selectedTask,
                    progress: "",
                });
                return;
            }

            let progress = Number(value);

            if (selectedTask.status === "DANG_LAM") {
                if (progress < 1) progress = 1;
                if (progress > 89) progress = 89;
            }

            setSelectedTask({
                ...selectedTask,
                progress,
            });

            return;
        }

        setSelectedTask({
            ...selectedTask,
            [name]: value,
        });
    };

    const handleUpdateTask = async () => {
        if (selectedTask.progress === "") {
            alert("Vui lòng nhập tiến độ");
            return;
        }

        if (selectedTask.status === "DANG_LAM") {
            const progress = Number(selectedTask.progress);

            if (progress < 1 || progress > 89) {
                alert("Tiến độ Đang làm chỉ được nhập từ 1 đến 89");
                return;
            }
        }

        const res = await fetch(
            `http://localhost:5000/api/tasks/${selectedTask.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    project_id: selectedTask.project_id,
                    title: selectedTask.title,
                    description: selectedTask.description,
                    assigned_to: selectedTask.assigned_to || null,
                    start_date: formatDateInput(selectedTask.start_date),
                    end_date: formatDateInput(selectedTask.end_date),
                    status: selectedTask.status,
                    priority: selectedTask.priority,
                    progress: Number(selectedTask.progress),
                }),
            }
        );

        if (!res.ok) {
            alert("Cập nhật công việc thất bại");
            return;
        }

        setSelectedTask(null);
        loadTasks();
    };

    const handleDeleteTask = async () => {
        const confirmDelete = window.confirm(
            "Bạn có chắc muốn xóa công việc này không?"
        );

        if (!confirmDelete) return;

        const res = await fetch(
            `http://localhost:5000/api/tasks/${selectedTask.id}`,
            {
                method: "DELETE",
            }
        );

        if (!res.ok) {
            alert("Xóa công việc thất bại");
            return;
        }

        setSelectedTask(null);
        loadTasks();
    };

    return (
        <div className="app">
            <Sidebar />

            <main className="global-kanban-page">
                <div className="global-kanban-header">
                    <h1>Kanban tổng</h1>
                    <p>Quản lý công việc của tất cả dự án theo trạng thái.</p>
                </div>

                <div className="global-kanban-stats">
                    <div>
                        <span>Tổng công việc</span>
                        <b>{stats.total}</b>
                    </div>

                    <div>
                        <span>Chưa làm</span>
                        <b>{stats.todo}</b>
                    </div>

                    <div>
                        <span>Đang làm</span>
                        <b>{stats.doing}</b>
                    </div>

                    <div>
                        <span>Hoàn thành</span>
                        <b>{stats.done}</b>
                    </div>
                </div>

                <div className="global-kanban-filters">
                    <input
                        type="text"
                        placeholder="Tìm công việc..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả dự án</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả ưu tiên</option>
                        <option value="THAP">Thấp</option>
                        <option value="TRUNG_BINH">Trung bình</option>
                        <option value="CAO">Cao</option>
                    </select>
                </div>

                <div className="global-kanban-board">
                    {columns.map((column) => {
                        const columnTasks = filteredTasks.filter(
                            (task) => task.status === column.key
                        );

                        return (
                            <div
                                key={column.key}
                                className="global-kanban-column"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, column.key)}
                            >
                                <div className="global-kanban-column-header">
                                    <h3>{column.title}</h3>
                                    <span>{columnTasks.length}</span>
                                </div>

                                <div className="global-kanban-list">
                                    {columnTasks.length === 0 ? (
                                        <div className="global-kanban-empty">
                                            Chưa có công việc
                                        </div>
                                    ) : (
                                        columnTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="global-kanban-card"
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData(
                                                        "taskId",
                                                        task.id
                                                    );
                                                }}
                                                onClick={() =>
                                                    setSelectedTask({
                                                        ...task,
                                                        start_date: formatDateInput(
                                                            task.start_date
                                                        ),
                                                        end_date: formatDateInput(
                                                            task.end_date
                                                        ),
                                                    })
                                                }
                                            >
                                                <span
                                                    className="global-project-badge"
                                                    style={{
                                                        backgroundColor:
                                                            task.project_color ||
                                                            "#2563EB",
                                                    }}
                                                >
                                                    {task.project_name ||
                                                        "Không rõ dự án"}
                                                </span>

                                                <h4>{task.title}</h4>
                                                <p>
                                                    {task.description ||
                                                        "Không có mô tả"}
                                                </p>

                                                <div className="global-kanban-meta">
                                                    <span>
                                                        👤{" "}
                                                        {task.assignee_name ||
                                                            "Chưa giao"}
                                                    </span>
                                                    <span>
                                                        📅 {formatDate(task.end_date)}
                                                    </span>
                                                </div>

                                                <div className="global-kanban-progress">
                                                    <div>
                                                        <span>Tiến độ</span>
                                                        <b>
                                                            {Number(task.progress) ||
                                                                0}
                                                            %
                                                        </b>
                                                    </div>

                                                    <div className="global-kanban-progress-line">
                                                        <div
                                                            style={{
                                                                width: `${
                                                                    Number(
                                                                        task.progress
                                                                    ) || 0
                                                                }%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`global-priority ${task.priority}`}
                                                >
                                                    {priorityText[task.priority] ||
                                                        "Trung bình"}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedTask && (
                    <div className="global-task-modal-overlay">
                        <div className="global-task-modal">
                            <h2>Cập nhật công việc</h2>

                            <label>Tên công việc</label>
                            <input
                                type="text"
                                name="title"
                                value={selectedTask.title || ""}
                                onChange={handleModalChange}
                            />

                            <label>Mô tả</label>
                            <textarea
                                name="description"
                                value={selectedTask.description || ""}
                                onChange={handleModalChange}
                            />

                            <label>ID người phụ trách</label>
                            <input
                                type="number"
                                name="assigned_to"
                                value={selectedTask.assigned_to || ""}
                                onChange={handleModalChange}
                            />

                            <div className="global-form-row">
                                <div>
                                    <label>Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={selectedTask.start_date || ""}
                                        onChange={handleModalChange}
                                    />
                                </div>

                                <div>
                                    <label>Deadline</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={selectedTask.end_date || ""}
                                        onChange={handleModalChange}
                                    />
                                </div>
                            </div>

                            <label>Trạng thái</label>
                            <select
                                name="status"
                                value={selectedTask.status}
                                onChange={handleModalChange}
                            >
                                <option value="CHUA_LAM">Chưa làm</option>
                                <option value="DANG_LAM">Đang làm</option>
                                <option value="DANG_REVIEW">Đang review</option>
                                <option value="HOAN_THANH">Hoàn thành</option>
                            </select>

                            <label>Độ ưu tiên</label>
                            <select
                                name="priority"
                                value={selectedTask.priority || "TRUNG_BINH"}
                                onChange={handleModalChange}
                            >
                                <option value="THAP">Thấp</option>
                                <option value="TRUNG_BINH">Trung bình</option>
                                <option value="CAO">Cao</option>
                            </select>

                            <label>Tiến độ (%)</label>
                            <input
                                type="number"
                                name="progress"
                                min={selectedTask.status === "DANG_LAM" ? 1 : 0}
                                max={selectedTask.status === "DANG_LAM" ? 89 : 100}
                                value={selectedTask.progress}
                                onChange={handleModalChange}
                                disabled={selectedTask.status !== "DANG_LAM"}
                            />

                            <div className="global-modal-actions">
                                <button
                                    type="button"
                                    className="global-btn-cancel"
                                    onClick={() => setSelectedTask(null)}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    className="global-btn-delete"
                                    onClick={handleDeleteTask}
                                >
                                    Xóa
                                </button>

                                <button
                                    type="button"
                                    className="global-btn-save"
                                    onClick={handleUpdateTask}
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Kanban;