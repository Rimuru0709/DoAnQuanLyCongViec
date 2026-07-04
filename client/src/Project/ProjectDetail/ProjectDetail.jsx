import "./ProjectDetail.css";
import Sidebar from "../../Sidebar/Sidebar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    FaFileExcel,
} from "react-icons/fa";

function ProjectDetail() {
    const { id } = useParams();

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
    const tasksPerPage = 5;

    const statusText = {
        DANG_THUC_HIEN: "Đang thực hiện",
        SAP_TOI: "Sắp tới",
        HOAN_THANH: "Hoàn thành",
        TAM_DUNG: "Tạm dừng",
        QUA_HAN: "Quá hạn",
    };

    const taskStatusText = {
        CHUA_LAM: "Chưa làm",
        DANG_LAM: "Đang làm",
        DANG_REVIEW: "Đang review",
        HOAN_THANH: "Hoàn thành",
        QUA_HAN: "Quá hạn",
    };

    const getTaskStatusClass = (status) => {
        if (status === "HOAN_THANH") return "done";
        if (status === "DANG_LAM") return "doing";
        if (status === "DANG_REVIEW") return "review";
        if (status === "CHUA_LAM") return "todo";
        return "overdue";
    };

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const loadProject = () => {
        fetch(`http://localhost:5000/api/projects/${id}`)
            .then((res) => res.json())
            .then((data) => setProject(data))
            .catch((err) => console.log(err));
    };

    const loadTasks = () => {
        fetch(`http://localhost:5000/api/tasks/project/${id}`)
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        loadProject();
        loadTasks();
    }, [id]);

    const openAddTaskModal = () => {
        setSelectedTask(null);
        setShowTaskModal(true);
    };

    const openEditTaskModal = (task) => {
        setSelectedTask(task);
        setShowTaskModal(true);
    };

    const closeTaskModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
    };

    const handleTaskSuccess = () => {
        loadTasks();
        loadProject();
    };

    const openDeleteModal = (task) => {
        setDeleteTaskId(task.id);
        setShowDeleteModal(true);
    };

    const handleDeleteTask = async () => {
        try {
            await fetch(`http://localhost:5000/api/tasks/${deleteTaskId}`, {
                method: "DELETE",
            });

            loadTasks();
            loadProject();

            setShowDeleteModal(false);
            setShowTaskModal(false);
            setDeleteTaskId(null);
        } catch (err) {
            console.log(err);
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
    const doneTasks = tasks.filter((task) => task.status === "HOAN_THANH").length;
    const doingTasks = tasks.filter((task) => task.status === "DANG_LAM").length;
    const todoTasks = tasks.filter((task) => task.status === "CHUA_LAM").length;
    const overdueTasks = tasks.filter((task) => task.status === "QUA_HAN").length;

    const calculatedProgress =
        totalTasks === 0
            ? 0
            : Math.round(
                tasks.reduce(
                    (sum, task) => sum + Number(task.progress || 0),
                    0
                ) / totalTasks
            );

    const filteredTasks = tasks.filter((task) => {
        const keyword = taskSearch.toLowerCase();

        return (
            task.title?.toLowerCase().includes(keyword) ||
            task.assignee_name?.toLowerCase().includes(keyword) ||
            taskStatusText[task.status]?.toLowerCase().includes(keyword)
        );
    });

    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * tasksPerPage,
        currentPage * tasksPerPage
    );

    if (!project) {
        return (
            <div className="detail-layout">
                <Sidebar />
                <div className="detail-page">
                    <h2>Đang tải dữ liệu...</h2>
                </div>
            </div>
        );
    }

    const handleChangeTaskStatus = async (task, newStatus) => {
        let progress = task.progress;

        if (newStatus === "CHUA_LAM") progress = 0;
        if (newStatus === "DANG_REVIEW") progress = 90;
        if (newStatus === "HOAN_THANH") progress = 100;

        const updatedTask = {
            ...task,
            status: newStatus,
            progress,
            start_date: task.start_date ? task.start_date.slice(0, 10) : "",
            end_date: task.end_date ? task.end_date.slice(0, 10) : "",
        };

        await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedTask),
        });

        loadTasks();
        loadProject();
    };

    if (!project) {
        return (
            <div className="detail-layout">
                <Sidebar />
                <div className="detail-page">
                    <h2>Đang tải dữ liệu...</h2>
                </div>
            </div>
        );
    }


    return (
        <div className="detail-layout">
            <Sidebar />

            <div className="detail-page">
                <div className="detail-header">
                    <div>
                        <div className="breadcrumb">Dự án &gt; {project.name}</div>

                        <h1>
                            {project.name}
                            <span className="status-badge">
                                {statusText[project.status]}
                            </span>
                        </h1>

                        <p>{project.description}</p>

                        <div className="project-meta">
                            <span>
                                <FaCalendarAlt />
                                {formatDate(project.start_date)} - {formatDate(project.end_date)}
                            </span>

                            <span>
                                <FaUsers /> 5 thành viên
                            </span>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button onClick={openAddTaskModal}>
                            <FaPlus /> Thêm công việc
                        </button>

                        <div className="detail-menu-wrapper">
                            <button
                                className="more-btn"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                            >
                                <FaEllipsisH />
                            </button>

                            {showExportMenu && (
                                <div className="detail-dropdown-menu">
                                    <div onClick={exportPDF}>
                                        <FaFilePdf /> Xuất PDF
                                    </div>

                                    <div onClick={exportExcel}>
                                        <FaFileExcel /> Xuất Excel
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
                        ["settings", "Cài đặt"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            className={activeTab === value ? "active" : ""}
                            onClick={() => setActiveTab(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && (
                    <>
                        <div className="detail-grid">
                            <div className="detail-card progress-card">
                                <h3>Tiến độ dự án</h3>

                                <div
                                    className="circle-progress"
                                    style={{
                                        background: `conic-gradient(#22c55e 0% ${calculatedProgress}%, #35516f ${calculatedProgress}% 100%)`,
                                    }}
                                >
                                    <div className="circle-inner">{calculatedProgress}%</div>
                                </div>

                                <p className="center-text">{statusText[project.status]}</p>

                                <ul className="progress-list">
                                    <li><span className="dot gray"></span>Tổng công việc <b>{totalTasks}</b></li>
                                    <li><span className="dot green"></span>Hoàn thành <b>{doneTasks}</b></li>
                                    <li><span className="dot blue"></span>Đang thực hiện <b>{doingTasks}</b></li>
                                    <li><span className="dot orange"></span>Chưa làm <b>{todoTasks}</b></li>
                                    <li><span className="dot red"></span>Quá hạn <b>{overdueTasks}</b></li>
                                </ul>
                            </div>

                            <div className="detail-card info-card">
                                <h3>Thông tin dự án</h3>

                                <div className="info-row">
                                    <span>Khách hàng</span>
                                    <b>{project.customer || "Chưa có khách hàng"}</b>
                                </div>

                                <div className="info-row">
                                    <span>Quản lý dự án</span>
                                    <b>{project.manager_name || "Chưa có quản lý"}</b>
                                </div>

                                <div className="info-row">
                                    <span>Ngày bắt đầu</span>
                                    <b>{formatDate(project.start_date)}</b>
                                </div>

                                <div className="info-row">
                                    <span>Deadline</span>
                                    <b>{formatDate(project.end_date)}</b>
                                </div>

                                <div className="info-row">
                                    <span>Tiến độ</span>
                                    <b>{calculatedProgress}%</b>
                                </div>

                                <div className="info-row desc">
                                    <span>Mô tả</span>
                                    <b>{project.description}</b>
                                </div>
                            </div>

                            <div className="detail-card member-card">
                                <h3>Thành viên</h3>

                                {[
                                    ["Nguyễn Văn A", "Quản lý dự án"],
                                    ["Trần Thị B", "Developer"],
                                    ["Lê Văn C", "Developer"],
                                    ["Phạm Thị D", "Tester"],
                                    ["Hoàng Văn E", "Designer"],
                                ].map((member, index) => (
                                    <div className="member-item" key={index}>
                                        <img src={`https://i.pravatar.cc/40?img=${index + 10}`} alt="" />

                                        <div>
                                            <h4>{member[0]}</h4>
                                            <p>{member[1]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="detail-card recent-task">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Công việc gần đây</th>
                                        <th>Người phụ trách</th>
                                        <th>Trạng thái</th>
                                        <th>Tiến độ</th>
                                        <th>Deadline</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tasks.slice(0, 3).map((task) => (
                                        <tr key={task.id}>
                                            <td>› {task.title}</td>
                                            <td>{task.assignee_name || "Chưa phân công"}</td>
                                            <td>
                                                <span className={`task-status ${getTaskStatusClass(task.status)}`}>
                                                    {taskStatusText[task.status]}
                                                </span>
                                            </td>
                                            <td>{task.progress}%</td>
                                            <td>{formatDate(task.end_date)}</td>
                                        </tr>
                                    ))}
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
                                onChange={(e) => {
                                    setTaskSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Công việc</th>
                                    <th>Người phụ trách</th>
                                    <th>Trạng thái</th>
                                    <th>Tiến độ</th>
                                    <th>Deadline</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedTasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>{task.title}</td>
                                        <td>{task.assignee_name || "Chưa phân công"}</td>
                                        <td>
                                            <span className={`task-status ${getTaskStatusClass(task.status)}`}>
                                                {taskStatusText[task.status]}
                                            </span>
                                        </td>
                                        <td>{task.progress}%</td>
                                        <td>{formatDate(task.end_date)}</td>
                                        <td>
                                            <button
                                                className="btn-edit-task"
                                                onClick={() => openEditTaskModal(task)}
                                            >
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="task-pagination">
                            <span>
                                Hiển thị {paginatedTasks.length} / {filteredTasks.length} công việc
                            </span>

                            <div>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    Trước
                                </button>

                                <span>Trang {currentPage} / {totalPages || 1}</span>

                                <button
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(currentPage + 1)}
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
                        onStatusChange={handleChangeTaskStatus}
                    />
                )}

                {activeTab === "gantt" && (
                    <Gantt
                        tasks={tasks}
                        onTaskClick={openEditTaskModal}
                    />
                )}

                {activeTab === "documents" && (
                    <Document projectId={project.id} />
                )}

                {activeTab === "members" && (
                    <Member projectId={project.id} />
                )}

                {activeTab === "settings" && (
                    <Setting
                        project={project}
                        onProjectUpdated={loadProject}
                        onProjectDeleted={() => window.location.href = "/project"}
                    />
                )}
            </div>

            <TaskModal
                open={showTaskModal}
                task={selectedTask}
                projectId={project.id}
                onClose={() => setShowTaskModal(false)}
                onSuccess={() => {
                    loadTasks();
                    loadProject();
                }}
                onDelete={openDeleteModal}
            />

            {showDeleteModal && (
                <div className="task-modal-overlay">

                    <div
                        className="task-modal"
                        style={{ width: "380px" }}
                    >

                        <h2>Xóa công việc</h2>

                        <p style={{ marginTop: 20 }}>
                            Bạn có chắc muốn xóa công việc này không?
                        </p>

                        <div className="task-modal-actions">

                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Hủy
                            </button>

                            <button
                                className="btn-delete"
                                onClick={handleDeleteTask}
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