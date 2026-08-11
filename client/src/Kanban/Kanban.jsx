import {
    useEffect,
    useMemo,
    useState
} from "react";
import { useNavigate } from "react-router-dom";
import GanttChart from "./GanttChart";
import { getSocket } from "../services/socket";
import "./Kanban.css";

const API_URL =
    "http://localhost:5000/api/tasks";

const columns = [
    {
        key: "CHUA_LAM",
        title: "Chưa làm"
    },
    {
        key: "DANG_LAM",
        title: "Đang làm"
    },
    {
        key: "DANG_REVIEW",
        title: "Đang review"
    },
    {
        key: "HOAN_THANH",
        title: "Hoàn thành"
    },
    {
        key: "QUA_HAN",
        title: "Quá hạn"
    }
];

const priorityText = {
    THAP: "Thấp",
    TRUNG_BINH: "Trung bình",
    CAO: "Cao"
};

const formatDate = (date) => {
    if (!date) {
        return "Chưa có";
    }

    return new Date(date).toLocaleDateString(
        "vi-VN"
    );
};

const formatDateInput = (date) => {
    if (!date) {
        return "";
    }

    return String(date).slice(0, 10);
};

const getProgressByStatus = (
    status,
    currentProgress
) => {
    const progress =
        Number(currentProgress) || 0;

    if (status === "CHUA_LAM") {
        return 0;
    }

    if (status === "DANG_LAM") {
        return Math.min(
            89,
            Math.max(1, progress)
        );
    }

    if (status === "DANG_REVIEW") {
        return 90;
    }

    if (status === "HOAN_THANH") {
        return 100;
    }

    if (status === "QUA_HAN") {
        return 0;
    }

    return progress;
};

function Kanban() {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [projectFilter, setProjectFilter] =
        useState("ALL");
    const [priorityFilter, setPriorityFilter] =
        useState("ALL");
    const [selectedTask, setSelectedTask] =
        useState(null);
    const [loading, setLoading] =
        useState(false);
    const [message, setMessage] =
        useState("");
    const [isSubmitting, setIsSubmitting] =
        useState(false);

    // View mode: "kanban" | "gantt"
    const [viewMode, setViewMode] = useState("kanban");

    // Active project for Gantt (uses first matched project or filter)
    const activeGanttProject = useMemo(() => {
        if (projectFilter !== "ALL") return projectFilter;
        const projs = [...new Set(tasks.map(t => t.project_id).filter(Boolean))];
        return projs[0] || null;
    }, [projectFilter, tasks]);

    const token =
        localStorage.getItem("token");

    let currentUser;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user")
        );
    } catch {
        currentUser = null;
    }

    const canManageTasks =
        currentUser?.role === "ADMIN" ||
        currentUser?.role === "MANAGER";

    const showToast = (text) => {
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

    const authFetch = async (
        url,
        options = {}
    ) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.body && {
                    "Content-Type":
                        "application/json"
                }),
                Authorization:
                    `Bearer ${token}`,
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

    const loadTasks = async (showLoading = true) => {
        const currentToken =
            localStorage.getItem("token");

        if (!currentToken) {
            localStorage.removeItem("user");

            navigate("/login", {
                replace: true
            });

            return;
        }

        if (showLoading) {
            setLoading(true);
        }

        try {
            const response = await fetch(API_URL, {
                headers: {
                    Authorization:
                        `Bearer ${currentToken}`
                }
            });

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login", {
                    replace: true
                });

                return;
            }

            if (!response.ok) {
                setTasks([]);

                showToast(
                    data.message ||
                    "Không thể tải danh sách công việc"
                );

                return;
            }

            setTasks(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.tasks)
                        ? data.tasks
                        : []
            );
        } catch (error) {
            console.error(
                "Lỗi tải công việc:",
                error
            );

            showToast(
                "Không thể kết nối đến server"
            );
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadTasks();

        // Socket.io — cập nhật real-time khi task thay đổi
        const socket = getSocket();
        if (socket) {
            socket.on("task:updated", () => {
                loadTasks(false); // silent refresh
            });
        }

        return () => {
            socket?.off("task:updated");
        };
    }, []);

    const projects = useMemo(() => {
        const projectMap = new Map();

        const safeTasks =
            Array.isArray(tasks)
                ? tasks
                : [];

        safeTasks.forEach((task) => {
            if (
                task.project_id &&
                task.project_name
            ) {
                projectMap.set(
                    task.project_id,
                    task.project_name
                );
            }
        });

        return Array.from(
            projectMap,
            ([id, name]) => ({
                id,
                name
            })
        );
    }, [tasks]);

    const safeTasks = Array.isArray(tasks)
        ? tasks
        : [];

    const filteredTasks = safeTasks.filter((task) => {
        const keyword =
            search.trim().toLowerCase();

        const title =
            task.title?.toLowerCase() || "";

        const description =
            task.description?.toLowerCase() || "";

        const matchSearch =
            title.includes(keyword) ||
            description.includes(keyword);

        const matchProject =
            projectFilter === "ALL" ||
            String(task.project_id) ===
            String(projectFilter);

        const matchPriority =
            priorityFilter === "ALL" ||
            task.priority === priorityFilter;

        return (
            matchSearch &&
            matchProject &&
            matchPriority
        );
    });
    const stats = {
        total: filteredTasks.length,

        todo: filteredTasks.filter(
            (task) =>
                task.status === "CHUA_LAM"
        ).length,

        doing: filteredTasks.filter(
            (task) =>
                task.status === "DANG_LAM"
        ).length,

        done: filteredTasks.filter(
            (task) =>
                task.status === "HOAN_THANH"
        ).length
    };

    const handleDragStart = (
        event,
        taskId
    ) => {
        event.dataTransfer.effectAllowed =
            "move";

        event.dataTransfer.setData(
            "text/plain",
            String(taskId)
        );
    };

    const handleDrop = async (
        event,
        newStatus
    ) => {
        event.preventDefault();

        const taskId = Number(
            event.dataTransfer.getData(
                "text/plain"
            )
        );

        const oldTask = tasks.find(
            (task) =>
                Number(task.id) === taskId
        );

        if (
            !oldTask ||
            oldTask.status === newStatus
        ) {
            return;
        }

        const oldStatus =
            oldTask.status;

        const oldProgress =
            Number(oldTask.progress) || 0;

        const newProgress =
            getProgressByStatus(
                newStatus,
                oldProgress
            );

        // Cập nhật giao diện ngay
        setTasks((previousTasks) =>
            previousTasks.map((task) =>
                Number(task.id) === taskId
                    ? {
                        ...task,
                        status: newStatus,
                        progress: newProgress
                    }
                    : task
            )
        );

        try {
            const response = await authFetch(
                `${API_URL}/${taskId}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                // Khôi phục giao diện cũ
                setTasks((previousTasks) =>
                    previousTasks.map((task) =>
                        Number(task.id) ===
                            taskId
                            ? {
                                ...task,
                                status: oldStatus,
                                progress:
                                    oldProgress
                            }
                            : task
                    )
                );

                showToast(
                    data.message ||
                    "Cập nhật trạng thái thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Cập nhật trạng thái thành công"
            );

            await loadTasks(false);
        } catch (error) {
            console.error(
                "Lỗi cập nhật trạng thái:",
                error
            );

            setTasks((previousTasks) =>
                previousTasks.map((task) =>
                    Number(task.id) === taskId
                        ? {
                            ...task,
                            status: oldStatus,
                            progress: oldProgress
                        }
                        : task
                )
            );
        }
    };

    const openTaskModal = (task) => {
        if (!canManageTasks) {
            showToast(
                "Bạn chỉ có thể kéo thả để cập nhật trạng thái"
            );

            return;
        }

        setSelectedTask({
            ...task,
            start_date:
                formatDateInput(
                    task.start_date
                ),
            end_date:
                formatDateInput(
                    task.end_date
                )
        });
    };

    const handleModalChange = (event) => {
        const { name, value } =
            event.target;

        if (name === "status") {
            const progress =
                getProgressByStatus(
                    value,
                    selectedTask.progress
                );

            setSelectedTask(
                (previous) => ({
                    ...previous,
                    status: value,
                    progress
                })
            );

            return;
        }

        if (name === "progress") {
            if (value === "") {
                setSelectedTask(
                    (previous) => ({
                        ...previous,
                        progress: ""
                    })
                );

                return;
            }

            let progress = Number(value);

            if (
                selectedTask.status ===
                "DANG_LAM"
            ) {
                progress = Math.min(
                    89,
                    Math.max(1, progress)
                );
            }

            setSelectedTask(
                (previous) => ({
                    ...previous,
                    progress
                })
            );

            return;
        }

        setSelectedTask(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );
    };

    const handleUpdateTask = async () => {
        if (!canManageTasks) {
            showToast(
                "Bạn không có quyền sửa công việc"
            );

            return;
        }

        if (
            !selectedTask.title?.trim()
        ) {
            showToast(
                "Vui lòng nhập tên công việc"
            );

            return;
        }

        if (
            selectedTask.start_date &&
            selectedTask.end_date &&
            new Date(
                selectedTask.end_date
            ) <
            new Date(
                selectedTask.start_date
            )
        ) {
            showToast(
                "Deadline không được trước ngày bắt đầu"
            );

            return;
        }

        if (
            selectedTask.progress === ""
        ) {
            showToast(
                "Vui lòng nhập tiến độ"
            );

            return;
        }

        setIsSubmitting(true);

        try {
            const response = await authFetch(
                `${API_URL}/${selectedTask.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        project_id:
                            selectedTask.project_id,
                        title:
                            selectedTask.title.trim(),
                        description:
                            selectedTask.description ||
                            "",
                        assigned_to:
                            selectedTask.assigned_to ||
                            null,
                        start_date:
                            selectedTask.start_date ||
                            null,
                        end_date:
                            selectedTask.end_date ||
                            null,
                        status:
                            selectedTask.status,
                        priority:
                            selectedTask.priority,
                        progress:
                            Number(
                                selectedTask.progress
                            )
                    })
                }
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Cập nhật công việc thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Cập nhật công việc thành công"
            );

            setSelectedTask(null);
            await loadTasks(false);
        } catch (error) {
            console.error(
                "Lỗi cập nhật công việc:",
                error
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!canManageTasks) {
            showToast(
                "Bạn không có quyền xóa công việc"
            );

            return;
        }

        const confirmed = window.confirm(
            "Bạn có chắc muốn xóa công việc này không?"
        );

        if (!confirmed) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await authFetch(
                `${API_URL}/${selectedTask.id}`,
                {
                    method: "DELETE"
                }
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Xóa công việc thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Xóa công việc thành công"
            );

            setSelectedTask(null);
            await loadTasks(false);
        } catch (error) {
            console.error(
                "Lỗi xóa công việc:",
                error
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-content">

            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <main className="global-kanban-page">
                <div className="global-kanban-header">
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                        <h1>Kanban tổng</h1>
                        {/* View mode toggle */}
                        <div style={{display:'flex', gap:4, marginLeft:8}}>
                            <button
                                onClick={() => setViewMode("kanban")}
                                style={{
                                    padding: '5px 14px', borderRadius: 8, border: '1px solid',
                                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                    background: viewMode === 'kanban' ? '#2563eb' : 'rgba(255,255,255,0.05)',
                                    color: viewMode === 'kanban' ? '#fff' : '#94a3b8',
                                    borderColor: viewMode === 'kanban' ? '#2563eb' : 'rgba(255,255,255,0.1)'
                                }}
                            >
                                📋 Kanban
                            </button>
                            <button
                                onClick={() => setViewMode("gantt")}
                                style={{
                                    padding: '5px 14px', borderRadius: 8, border: '1px solid',
                                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                    background: viewMode === 'gantt' ? '#2563eb' : 'rgba(255,255,255,0.05)',
                                    color: viewMode === 'gantt' ? '#fff' : '#94a3b8',
                                    borderColor: viewMode === 'gantt' ? '#2563eb' : 'rgba(255,255,255,0.1)'
                                }}
                            >
                                📊 Gantt
                            </button>
                        </div>
                    </div>

                    <p>
                        Quản lý công việc của các dự án
                        thuộc tài khoản của bạn.
                    </p>
                </div>

                <div className="global-kanban-stats">
                    <div>
                        <span>
                            Tổng công việc
                        </span>

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
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                    <select
                        value={projectFilter}
                        onChange={(event) =>
                            setProjectFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            Tất cả dự án
                        </option>

                        {projects.map(
                            (project) => (
                                <option
                                    key={
                                        project.id
                                    }
                                    value={
                                        project.id
                                    }
                                >
                                    {project.name}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(event) =>
                            setPriorityFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            Tất cả ưu tiên
                        </option>

                        <option value="THAP">
                            Thấp
                        </option>

                        <option value="TRUNG_BINH">
                            Trung bình
                        </option>

                        <option value="CAO">
                            Cao
                        </option>
                    </select>
                </div>

                {/* ── GANTT VIEW ── */}
                {viewMode === "gantt" && (
                    <div style={{ marginTop: 16 }}>
                        {activeGanttProject ? (
                            <GanttChart
                                projectId={activeGanttProject}
                                onTaskClick={(taskId) => {
                                    const t = tasks.find(x => x.id === taskId);
                                    if (t) openTaskModal(t);
                                }}
                            />
                        ) : (
                            <div className="global-kanban-empty">
                                Chọn một dự án cụ thể để xem Gantt Chart
                            </div>
                        )}
                    </div>
                )}

                {/* ── KANBAN VIEW ── */}
                {loading ? (
                    <div className="global-kanban-empty">
                        Đang tải dữ liệu...
                    </div>
                ) : viewMode === "kanban" && (
                    <div className="global-kanban-board">
                        {columns.map((column) => {
                            const columnTasks =
                                filteredTasks.filter(
                                    (task) =>
                                        task.status ===
                                        column.key
                                );

                            return (
                                <div
                                    key={
                                        column.key
                                    }
                                    className="global-kanban-column"
                                    onDragOver={(
                                        event
                                    ) => {
                                        event.preventDefault();

                                        event.dataTransfer.dropEffect =
                                            "move";
                                    }}
                                    onDrop={(event) =>
                                        handleDrop(
                                            event,
                                            column.key
                                        )
                                    }
                                >
                                    <div className="global-kanban-column-header">
                                        <h3>
                                            {
                                                column.title
                                            }
                                        </h3>

                                        <span>
                                            {
                                                columnTasks.length
                                            }
                                        </span>
                                    </div>

                                    <div className="global-kanban-list">
                                        {columnTasks.length ===
                                            0 ? (
                                            <div className="global-kanban-empty">
                                                Chưa có công việc
                                            </div>
                                        ) : (
                                            columnTasks.map(
                                                (task) => {
                                                    const progress =
                                                        Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                Number(
                                                                    task.progress
                                                                ) ||
                                                                0
                                                            )
                                                        );

                                                    return (
                                                        <div
                                                            key={
                                                                task.id
                                                            }
                                                            className="global-kanban-card"
                                                            draggable
                                                            onDragStart={(
                                                                event
                                                            ) =>
                                                                handleDragStart(
                                                                    event,
                                                                    task.id
                                                                )
                                                            }
                                                            onClick={() =>
                                                                openTaskModal(
                                                                    task
                                                                )
                                                            }
                                                        >
                                                            <span
                                                                className="global-project-badge"
                                                                style={{
                                                                    backgroundColor:
                                                                        task.project_color ||
                                                                        "#2563EB"
                                                                }}
                                                            >
                                                                {task.project_name ||
                                                                    "Không rõ dự án"}
                                                            </span>

                                                            <h4>
                                                                {
                                                                    task.title
                                                                }
                                                            </h4>

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
                                                                    📅{" "}
                                                                    {formatDate(
                                                                        task.end_date
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <div className="global-kanban-progress">
                                                                <div>
                                                                    <span>
                                                                        Tiến độ
                                                                    </span>

                                                                    <b>
                                                                        {
                                                                            progress
                                                                        }
                                                                        %
                                                                    </b>
                                                                </div>

                                                                <div className="global-kanban-progress-line">
                                                                    <div
                                                                        style={{
                                                                            width: `${progress}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Checklist progress */}
                                                            {Number(task.checklist_total) > 0 && (
                                                                <div style={{
                                                                    display: 'flex', alignItems: 'center',
                                                                    gap: 8, marginTop: 6
                                                                }}>
                                                                    <div style={{
                                                                        flex: 1, height: 4,
                                                                        background: 'rgba(255,255,255,0.08)',
                                                                        borderRadius: 2, overflow: 'hidden'
                                                                    }}>
                                                                        <div style={{
                                                                            width: `${Math.round((task.checklist_done / task.checklist_total) * 100)}%`,
                                                                            height: '100%',
                                                                            background: task.checklist_done === task.checklist_total ? '#16a34a' : '#2563eb',
                                                                            borderRadius: 2,
                                                                            transition: 'width 0.3s'
                                                                        }} />
                                                                    </div>
                                                                    <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>
                                                                        ✅ {task.checklist_done}/{task.checklist_total}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <span
                                                                className={`global-priority ${task.priority ||
                                                                    "TRUNG_BINH"
                                                                    }`}
                                                            >
                                                                {priorityText[
                                                                    task.priority
                                                                ] ||
                                                                    "Trung bình"}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {selectedTask &&
                    canManageTasks && (
                        <div className="global-task-modal-overlay">
                            <div className="global-task-modal">
                                <h2>
                                    Cập nhật công việc
                                </h2>

                                <label>
                                    Tên công việc
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={
                                        selectedTask.title ||
                                        ""
                                    }
                                    onChange={
                                        handleModalChange
                                    }
                                />

                                <label>Mô tả</label>

                                <textarea
                                    name="description"
                                    value={
                                        selectedTask.description ||
                                        ""
                                    }
                                    onChange={
                                        handleModalChange
                                    }
                                />

                                <label>
                                    ID người phụ trách
                                </label>

                                <input
                                    type="number"
                                    name="assigned_to"
                                    value={
                                        selectedTask.assigned_to ||
                                        ""
                                    }
                                    onChange={
                                        handleModalChange
                                    }
                                />

                                <div className="global-form-row">
                                    <div>
                                        <label>
                                            Ngày bắt đầu
                                        </label>

                                        <input
                                            type="date"
                                            name="start_date"
                                            value={
                                                selectedTask.start_date ||
                                                ""
                                            }
                                            onChange={
                                                handleModalChange
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label>
                                            Deadline
                                        </label>

                                        <input
                                            type="date"
                                            name="end_date"
                                            min={
                                                selectedTask.start_date ||
                                                undefined
                                            }
                                            value={
                                                selectedTask.end_date ||
                                                ""
                                            }
                                            onChange={
                                                handleModalChange
                                            }
                                        />
                                    </div>
                                </div>

                                <label>
                                    Trạng thái
                                </label>

                                <select
                                    name="status"
                                    value={
                                        selectedTask.status
                                    }
                                    onChange={
                                        handleModalChange
                                    }
                                >
                                    <option value="CHUA_LAM">
                                        Chưa làm
                                    </option>

                                    <option value="DANG_LAM">
                                        Đang làm
                                    </option>

                                    <option value="DANG_REVIEW">
                                        Đang review
                                    </option>

                                    <option value="HOAN_THANH">
                                        Hoàn thành
                                    </option>

                                    <option value="QUA_HAN">
                                        Quá hạn
                                    </option>
                                </select>

                                <label>
                                    Độ ưu tiên
                                </label>

                                <select
                                    name="priority"
                                    value={
                                        selectedTask.priority ||
                                        "TRUNG_BINH"
                                    }
                                    onChange={
                                        handleModalChange
                                    }
                                >
                                    <option value="THAP">
                                        Thấp
                                    </option>

                                    <option value="TRUNG_BINH">
                                        Trung bình
                                    </option>

                                    <option value="CAO">
                                        Cao
                                    </option>
                                </select>

                                <label>
                                    Tiến độ (%)
                                </label>

                                <input
                                    type="number"
                                    name="progress"
                                    min={
                                        selectedTask.status ===
                                            "DANG_LAM"
                                            ? 1
                                            : 0
                                    }
                                    max={
                                        selectedTask.status ===
                                            "DANG_LAM"
                                            ? 89
                                            : 100
                                    }
                                    value={
                                        selectedTask.progress
                                    }
                                    onChange={
                                        handleModalChange
                                    }
                                    disabled={
                                        selectedTask.status !==
                                        "DANG_LAM"
                                    }
                                />

                                <div className="global-modal-actions">
                                    <button
                                        type="button"
                                        className="global-btn-cancel"
                                        onClick={() =>
                                            setSelectedTask(
                                                null
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                    >
                                        Hủy
                                    </button>

                                    <button
                                        type="button"
                                        className="global-btn-delete"
                                        onClick={
                                            handleDeleteTask
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                    >
                                        Xóa
                                    </button>

                                    <button
                                        type="button"
                                        className="global-btn-save"
                                        onClick={
                                            handleUpdateTask
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting
                                            ? "Đang lưu..."
                                            : "Cập nhật"}
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