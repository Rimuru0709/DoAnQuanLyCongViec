import "./ProjectDetail.css";
import Sidebar from "../../Sidebar/Sidebar";
import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams
} from "react-router-dom";

import TaskModal from "./TaskModal";
import Kanban from "./Kanban";
import Gantt from "./Gantt";
import Document from "./Document";
import Member from "./Member";
import Setting from "./Setting";

import {
    FaPlus,
    FaEllipsisH,
    FaCalendarAlt,
    FaUsers,
    FaFilePdf,
    FaFileExcel
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTaskId, setDeleteTaskId] = useState(null);

    const [taskSearch, setTaskSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [memberRefreshKey, setMemberRefreshKey] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const tasksPerPage = 5;
    const token = localStorage.getItem("token");

    let currentUser = null;

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

    const statusText = {
        DANG_THUC_HIEN: "Đang thực hiện",
        SAP_TOI: "Sắp tới",
        HOAN_THANH: "Hoàn thành",
        TAM_DUNG: "Tạm dừng",
        QUA_HAN: "Quá hạn"
    };

    const taskStatusText = {
        CHUA_LAM: "Chưa làm",
        DANG_LAM: "Đang làm",
        DANG_REVIEW: "Đang review",
        HOAN_THANH: "Hoàn thành",
        QUA_HAN: "Quá hạn"
    };

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

    const authFetch = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.body && {
                    "Content-Type": "application/json"
                }),
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

    const parseResponse = async (response) => {
        try {
            return await response.json();
        } catch {
            return {};
        }
    };

    const getTaskStatusClass = (status) => {
        if (status === "HOAN_THANH") return "done";
        if (status === "DANG_LAM") return "doing";
        if (status === "DANG_REVIEW") return "review";
        if (status === "CHUA_LAM") return "todo";

        return "overdue";
    };

    const formatDate = (date) => {
        if (!date) {
            return "Chưa có";
        }

        return new Date(date).toLocaleDateString(
            "vi-VN"
        );
    };

    const loadProject = async () => {
        try {
            const response = await authFetch(
                `${API_URL}/projects/${id}`
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                setError(
                    data.message ||
                    "Không thể tải thông tin dự án"
                );

                setProject(null);
                return;
            }

            setProject(data);
        } catch (requestError) {
            console.error(
                "Lỗi tải dự án:",
                requestError
            );

            if (
                requestError.message !==
                "Phiên đăng nhập đã hết hạn"
            ) {
                setError(
                    "Không thể kết nối đến server"
                );
            }
        }
    };

    const loadTasks = async () => {
        try {
            const response = await authFetch(
                `${API_URL}/tasks/project/${id}`
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Không thể tải công việc"
                );

                setTasks([]);
                return;
            }

            setTasks(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.tasks)
                        ? data.tasks
                        : []
            );
        } catch (requestError) {
            console.error(
                "Lỗi tải công việc:",
                requestError
            );
        }
    };

    const loadPageData = async () => {
        if (!token) {
            navigate("/login", {
                replace: true
            });

            return;
        }

        setLoading(true);
        setError("");

        await Promise.all([
            loadProject(),
            loadTasks()
        ]);

        setLoading(false);
    };

    useEffect(() => {
        loadPageData();
    }, [id]);

    const openAddTaskModal = () => {
        if (!canManageTasks) {
            showToast(
                "Bạn không có quyền thêm công việc"
            );

            return;
        }

        setSelectedTask(null);
        setShowTaskModal(true);
    };

    const openEditTaskModal = (task) => {
        const isTaskAssignee =
            Number(task.assigned_to) ===
            Number(currentUser?.id);

        if (
            !canManageTasks &&
            !isTaskAssignee
        ) {
            showToast(
                "Bạn không có quyền cập nhật công việc này"
            );

            return;
        }

        setSelectedTask(task);
        setShowTaskModal(true);
    };

    const closeTaskModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
    };

    const handleTaskSuccess = async () => {
        await Promise.all([
            loadTasks(),
            loadProject()
        ]);

        setMemberRefreshKey((previous) =>
            previous + 1
        );
    };

    const openDeleteModal = (task) => {
        if (!canManageTasks) {
            showToast(
                "Bạn không có quyền xóa công việc"
            );

            return;
        }

        setDeleteTaskId(task.id);
        setShowDeleteModal(true);
    };

    const handleDeleteTask = async () => {
        try {
            const response = await authFetch(
                `${API_URL}/tasks/${deleteTaskId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await parseResponse(response);

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

            await Promise.all([
                loadTasks(),
                loadProject()
            ]);

            setShowDeleteModal(false);
            setShowTaskModal(false);
            setDeleteTaskId(null);
        } catch (requestError) {
            console.error(
                "Lỗi xóa công việc:",
                requestError
            );
        }
    };

    const handleChangeTaskStatus = async (
        task,
        newStatus
    ) => {
        const oldStatus = task.status;
        const oldProgress = Number(task.progress) || 0;

        let newProgress = oldProgress;

        if (newStatus === "CHUA_LAM") {
            newProgress = 0;
        }

        if (newStatus === "DANG_LAM") {
            newProgress = Math.min(
                89,
                Math.max(1, oldProgress)
            );
        }

        if (newStatus === "DANG_REVIEW") {
            newProgress = 90;
        }

        if (newStatus === "HOAN_THANH") {
            newProgress = 100;
        }

        if (newStatus === "QUA_HAN") {
            newProgress = 0;
        }

        // Đổi cột trên giao diện ngay lập tức
        setTasks((previousTasks) =>
            previousTasks.map((item) =>
                Number(item.id) === Number(task.id)
                    ? {
                        ...item,
                        status: newStatus,
                        progress: newProgress
                    }
                    : item
            )
        );

        try {
            const response = await authFetch(
                `${API_URL}/tasks/${task.id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                // API lỗi thì trả card về cột cũ
                setTasks((previousTasks) =>
                    previousTasks.map((item) =>
                        Number(item.id) === Number(task.id)
                            ? {
                                ...item,
                                status: oldStatus,
                                progress: oldProgress
                            }
                            : item
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

            // Đồng bộ lại dữ liệu thật từ server
            await Promise.all([
                loadTasks(),
                loadProject()
            ]);
        } catch (requestError) {
            console.error(
                "Lỗi cập nhật trạng thái:",
                requestError
            );

            // Mất kết nối thì trả lại trạng thái cũ
            setTasks((previousTasks) =>
                previousTasks.map((item) =>
                    Number(item.id) === Number(task.id)
                        ? {
                            ...item,
                            status: oldStatus,
                            progress: oldProgress
                        }
                        : item
                )
            );

            showToast(
                "Không thể kết nối đến server"
            );
        }
    };

    const exportPDF = () => {
        alert("Chức năng Xuất PDF sẽ làm sau");
        setShowExportMenu(false);
    };

    const exportExcel = () => {
        alert("Chức năng Xuất Excel sẽ làm sau");
        setShowExportMenu(false);
    };

    const totalTasks = tasks.length;

    const doneTasks = tasks.filter(
        (task) => task.status === "HOAN_THANH"
    ).length;

    const doingTasks = tasks.filter(
        (task) => task.status === "DANG_LAM"
    ).length;

    const todoTasks = tasks.filter(
        (task) => task.status === "CHUA_LAM"
    ).length;

    const overdueTasks = tasks.filter(
        (task) => task.status === "QUA_HAN"
    ).length;

    const calculatedProgress =
        totalTasks === 0
            ? 0
            : Math.round(
                tasks.reduce(
                    (sum, task) =>
                        sum +
                        Number(task.progress || 0),
                    0
                ) / totalTasks
            );

    const filteredTasks = tasks.filter((task) => {
        const keyword =
            taskSearch.trim().toLowerCase();

        const title =
            task.title?.toLowerCase() || "";

        const assignee =
            task.assignee_name?.toLowerCase() || "";

        const status =
            taskStatusText[
                task.status
            ]?.toLowerCase() || "";

        return (
            title.includes(keyword) ||
            assignee.includes(keyword) ||
            status.includes(keyword)
        );
    });

    const totalPages = Math.ceil(
        filteredTasks.length /
        tasksPerPage
    );

    const paginatedTasks =
        filteredTasks.slice(
            (currentPage - 1) * tasksPerPage,
            currentPage * tasksPerPage
        );

    if (loading) {
        return (
            <div className="detail-layout">
                <Sidebar />

                <div className="detail-page">
                    <h2>Đang tải dữ liệu...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-layout">
                <Sidebar />

                <div className="detail-page">
                    <h2>Không thể mở dự án</h2>

                    <p>{error}</p>

                    <button
                        onClick={() =>
                            navigate("/project")
                        }
                    >
                        Quay lại danh sách dự án
                    </button>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="detail-layout">
                <Sidebar />

                <div className="detail-page">
                    <h2>
                        Không tìm thấy dự án
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-layout">
            <Sidebar />

            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <div className="detail-page">
                <div className="detail-header">
                    <div>
                        <div className="breadcrumb">
                            Dự án &gt; {project.name}
                        </div>

                        <h1>
                            {project.name}

                            <span className="status-badge">
                                {statusText[
                                    project.status
                                ] || project.status}
                            </span>
                        </h1>

                        <p>
                            {project.description ||
                                "Không có mô tả"}
                        </p>

                        <div className="project-meta">
                            <span>
                                <FaCalendarAlt />

                                {formatDate(
                                    project.start_date
                                )}{" "}
                                -{" "}
                                {formatDate(
                                    project.end_date
                                )}
                            </span>

                            <span>
                                <FaUsers />
                                Thành viên dự án
                            </span>
                        </div>
                    </div>

                    <div className="header-actions">
                        {canManageTasks && (
                            <button
                                onClick={
                                    openAddTaskModal
                                }
                            >
                                <FaPlus />
                                Thêm công việc
                            </button>
                        )}

                        <div className="detail-menu-wrapper">
                            <button
                                className="more-btn"
                                onClick={() =>
                                    setShowExportMenu(
                                        !showExportMenu
                                    )
                                }
                            >
                                <FaEllipsisH />
                            </button>

                            {showExportMenu && (
                                <div className="detail-dropdown-menu">
                                    <div
                                        onClick={exportPDF}
                                    >
                                        <FaFilePdf />
                                        Xuất PDF
                                    </div>

                                    <div
                                        onClick={
                                            exportExcel
                                        }
                                    >
                                        <FaFileExcel />
                                        Xuất Excel
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="detail-tabs">
                    {[
                        ["overview", "Tổng quan"],
                        ["tasks", "Công việc"],
                        ["kanban", "Kanban"],
                        ["gantt", "Gantt"],
                        ["documents", "Tài liệu"],
                        ["members", "Thành viên"],
                        ["settings", "Cài đặt"]
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            className={
                                activeTab === value
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab(value)
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && (
                    <>
                        <div className="detail-grid">
                            <div className="detail-card progress-card">
                                <h3>
                                    Tiến độ dự án
                                </h3>

                                <div
                                    className="circle-progress"
                                    style={{
                                        background:
                                            `conic-gradient(
                                                #22c55e 0% ${calculatedProgress}%,
                                                #35516f ${calculatedProgress}% 100%
                                            )`
                                    }}
                                >
                                    <div className="circle-inner">
                                        {calculatedProgress}%
                                    </div>
                                </div>

                                <p className="center-text">
                                    {statusText[
                                        project.status
                                    ] || project.status}
                                </p>

                                <ul className="progress-list">
                                    <li>
                                        <span className="dot gray" />
                                        Tổng công việc
                                        <b>{totalTasks}</b>
                                    </li>

                                    <li>
                                        <span className="dot green" />
                                        Hoàn thành
                                        <b>{doneTasks}</b>
                                    </li>

                                    <li>
                                        <span className="dot blue" />
                                        Đang thực hiện
                                        <b>{doingTasks}</b>
                                    </li>

                                    <li>
                                        <span className="dot orange" />
                                        Chưa làm
                                        <b>{todoTasks}</b>
                                    </li>

                                    <li>
                                        <span className="dot red" />
                                        Quá hạn
                                        <b>{overdueTasks}</b>
                                    </li>
                                </ul>
                            </div>

                            <div className="detail-card info-card">
                                <h3>
                                    Thông tin dự án
                                </h3>

                                <div className="info-row">
                                    <span>
                                        Quản lý dự án
                                    </span>

                                    <b>
                                        {project.manager_name ||
                                            "Chưa có quản lý"}
                                    </b>
                                </div>

                                <div className="info-row">
                                    <span>
                                        Khách hàng
                                    </span>

                                    <b>
                                        {project.customer ||
                                            "Chưa có"}
                                    </b>
                                </div>

                                <div className="info-row">
                                    <span>
                                        Ngày bắt đầu
                                    </span>

                                    <b>
                                        {formatDate(
                                            project.start_date
                                        )}
                                    </b>
                                </div>

                                <div className="info-row">
                                    <span>
                                        Deadline
                                    </span>

                                    <b>
                                        {formatDate(
                                            project.end_date
                                        )}
                                    </b>
                                </div>

                                <div className="info-row">
                                    <span>
                                        Tiến độ
                                    </span>

                                    <b>
                                        {calculatedProgress}%
                                    </b>
                                </div>

                                <div className="info-row desc">
                                    <span>Mô tả</span>

                                    <b>
                                        {project.description ||
                                            "Không có mô tả"}
                                    </b>
                                </div>
                            </div>

                            <div className="detail-card member-card">
                                <h3>Thành viên</h3>

                                <p>
                                    Mở tab Thành viên để xem
                                    danh sách thành viên thực tế.
                                </p>
                            </div>
                        </div>

                        <div className="detail-card recent-task">
                            <table>
                                <thead>
                                    <tr>
                                        <th>
                                            Công việc gần đây
                                        </th>

                                        <th>
                                            Người phụ trách
                                        </th>

                                        <th>
                                            Trạng thái
                                        </th>

                                        <th>
                                            Tiến độ
                                        </th>

                                        <th>
                                            Deadline
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tasks.length === 0 ? (
                                        <tr>
                                            <td colSpan="5">
                                                Chưa có công việc
                                            </td>
                                        </tr>
                                    ) : (
                                        tasks
                                            .slice(0, 3)
                                            .map((task) => (
                                                <tr
                                                    key={
                                                        task.id
                                                    }
                                                >
                                                    <td>
                                                        ›{" "}
                                                        {
                                                            task.title
                                                        }
                                                    </td>

                                                    <td>
                                                        {task.assignee_name ||
                                                            "Chưa phân công"}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`task-status ${getTaskStatusClass(
                                                                task.status
                                                            )}`}
                                                        >
                                                            {taskStatusText[
                                                                task.status
                                                            ] ||
                                                                task.status}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {Number(
                                                            task.progress
                                                        ) || 0}
                                                        %
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            task.end_date
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === "tasks" && (
                    <div className="detail-card recent-task">
                        <div className="task-toolbar">
                            <input
                                type="text"
                                placeholder="Tìm kiếm công việc, người phụ trách, trạng thái..."
                                value={taskSearch}
                                onChange={(event) => {
                                    setTaskSearch(
                                        event.target.value
                                    );

                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Công việc</th>
                                    <th>
                                        Người phụ trách
                                    </th>
                                    <th>Trạng thái</th>
                                    <th>Tiến độ</th>
                                    <th>Deadline</th>

                                    {canManageTasks && (
                                        <th>
                                            Hành động
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedTasks.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                canManageTasks
                                                    ? 6
                                                    : 5
                                            }
                                        >
                                            Chưa có công việc
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTasks.map(
                                        (task) => (
                                            <tr
                                                key={
                                                    task.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        task.title
                                                    }
                                                </td>

                                                <td>
                                                    {task.assignee_name ||
                                                        "Chưa phân công"}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`task-status ${getTaskStatusClass(
                                                            task.status
                                                        )}`}
                                                    >
                                                        {taskStatusText[
                                                            task.status
                                                        ] ||
                                                            task.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {Number(
                                                        task.progress
                                                    ) || 0}
                                                    %
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        task.end_date
                                                    )}
                                                </td>

                                                {canManageTasks && (
                                                    <td>
                                                        <button
                                                            className="btn-edit-task"
                                                            onClick={() =>
                                                                openEditTaskModal(
                                                                    task
                                                                )
                                                            }
                                                        >
                                                            Sửa
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>

                        <div className="task-pagination">
                            <span>
                                Hiển thị{" "}
                                {paginatedTasks.length} /{" "}
                                {filteredTasks.length}{" "}
                                công việc
                            </span>

                            <div>
                                <button
                                    disabled={
                                        currentPage === 1
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            currentPage - 1
                                        )
                                    }
                                >
                                    Trước
                                </button>

                                <span>
                                    Trang {currentPage} /{" "}
                                    {totalPages || 1}
                                </span>

                                <button
                                    disabled={
                                        currentPage ===
                                        totalPages ||
                                        totalPages === 0
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            currentPage + 1
                                        )
                                    }
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "kanban" && (
                    <Kanban
                        tasks={tasks}
                        onTaskClick={openEditTaskModal}
                        onStatusChange={
                            handleChangeTaskStatus
                        }
                    />
                )}

                {activeTab === "gantt" && (
                    <Gantt
                        tasks={tasks}
                        onTaskClick={
                            canManageTasks
                                ? openEditTaskModal
                                : undefined
                        }
                    />
                )}

                {activeTab === "documents" && (
                    <Document
                        projectId={project.id}
                    />
                )}

                {activeTab === "members" && (
                    <Member
                        key={memberRefreshKey}
                        projectId={project.id}
                    />
                )}

                {activeTab === "settings" && (
                    <Setting
                        project={project}
                        onProjectUpdated={
                            loadProject
                        }
                        onProjectDeleted={() =>
                            navigate("/project")
                        }
                    />
                )}
            </div>

            {showTaskModal && (
                <TaskModal
                    open={showTaskModal}
                    task={selectedTask}
                    projectId={project.id}
                    onClose={closeTaskModal}
                    onSuccess={async () => {
                        await handleTaskSuccess();
                        closeTaskModal();
                    }}
                    onDelete={
                        canManageTasks
                            ? openDeleteModal
                            : undefined
                    }
                />
            )}

            {showDeleteModal &&
                canManageTasks && (
                    <div className="task-modal-overlay">
                        <div
                            className="task-modal"
                            style={{
                                width: "380px"
                            }}
                        >
                            <h2>Xóa công việc</h2>

                            <p
                                style={{
                                    marginTop: 20
                                }}
                            >
                                Bạn có chắc muốn xóa
                                công việc này không?
                            </p>

                            <div className="task-modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() =>
                                        setShowDeleteModal(
                                            false
                                        )
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    className="btn-delete"
                                    onClick={
                                        handleDeleteTask
                                    }
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default ProjectDetail;