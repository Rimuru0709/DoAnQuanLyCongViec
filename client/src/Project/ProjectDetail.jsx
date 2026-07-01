import "./ProjectDetail.css";
import Sidebar from "../Sidebar/Sidebar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    FaPlus,
    FaEllipsisH,
    FaCalendarAlt,
    FaUsers,
    FaCircle,
    FaFilePdf,
    FaFileExcel,
} from "react-icons/fa";

function ProjectDetail() {
    const { id } = useParams();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showTaskForm, setShowTaskForm] = useState(false);

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        assigned_to: "",
        start_date: "",
        end_date: "",
        status: "CHUA_LAM",
        priority: "TRUNG_BINH",
        progress: 0,
    });

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

    const handleTaskChange = (e) => {
        const { name, value } = e.target;

        setNewTask({
            ...newTask,
            [name]: value,
        });
    };

    const handleAddTask = async (e) => {
        e.preventDefault();

        const taskData = {
            ...newTask,
            project_id: id,
            assigned_to: newTask.assigned_to || null,
        };

        const res = await fetch("http://localhost:5000/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskData),
        });

        if (!res.ok) {
            alert("Thêm công việc thất bại");
            return;
        }

        alert("Thêm công việc thành công");

        setShowTaskForm(false);
        setActiveTab("tasks");

        setNewTask({
            title: "",
            description: "",
            assigned_to: "",
            start_date: "",
            end_date: "",
            status: "CHUA_LAM",
            priority: "TRUNG_BINH",
            progress: 0,
        });

        loadTasks();
    };

    const exportPDF = () => {
        alert("Chức năng Xuất PDF sẽ làm sau");
        setShowExportMenu(false);
    };

    const exportExcel = () => {
        alert("Chức năng Xuất Excel sẽ làm sau");
        setShowExportMenu(false);
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
                        <button onClick={() => setShowTaskForm(true)}>
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
                                        background: `conic-gradient(#22c55e 0% ${project.progress}%, #35516f ${project.progress}% 100%)`,
                                    }}
                                >
                                    <div className="circle-inner">{project.progress}%</div>
                                </div>

                                <p className="center-text">{statusText[project.status]}</p>

                                <ul className="progress-list">
                                    <li><span className="dot gray"></span>Tổng công việc <b>{tasks.length}</b></li>
                                    <li><span className="dot green"></span>Hoàn thành <b>{tasks.filter(t => t.status === "HOAN_THANH").length}</b></li>
                                    <li><span className="dot blue"></span>Đang thực hiện <b>{tasks.filter(t => t.status === "DANG_LAM").length}</b></li>
                                    <li><span className="dot orange"></span>Chưa làm <b>{tasks.filter(t => t.status === "CHUA_LAM").length}</b></li>
                                    <li><span className="dot red"></span>Quá hạn <b>{tasks.filter(t => t.status === "QUA_HAN").length}</b></li>
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
                                    <b>{project.progress}%</b>
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
                                        <img
                                            src={`https://i.pravatar.cc/40?img=${index + 10}`}
                                            alt=""
                                        />

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
                                                <span
                                                    className={`task-status ${task.status === "HOAN_THANH" ? "done" : "doing"
                                                        }`}
                                                >
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
                        <table>
                            <thead>
                                <tr>
                                    <th>Công việc</th>
                                    <th>Người phụ trách</th>
                                    <th>Trạng thái</th>
                                    <th>Tiến độ</th>
                                    <th>Deadline</th>
                                </tr>
                            </thead>

                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>{task.title}</td>
                                        <td>{task.assignee_name || "Chưa phân công"}</td>
                                        <td>{taskStatusText[task.status]}</td>
                                        <td>{task.progress}%</td>
                                        <td>{formatDate(task.end_date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "kanban" && (
                    <div className="detail-card tab-content">
                        <h2>Bảng Kanban</h2>
                        <p>Hiển thị các cột: Chưa làm, Đang làm, Review, Hoàn thành.</p>
                    </div>
                )}

                {activeTab === "gantt" && (
                    <div className="detail-card tab-content">
                        <h2>Biểu đồ Gantt</h2>
                        <p>Timeline tiến độ dự án sẽ hiển thị ở đây.</p>
                    </div>
                )}

                {activeTab === "documents" && (
                    <div className="detail-card tab-content">
                        <h2>Tài liệu dự án</h2>
                        <p>Danh sách tài liệu, file đính kèm của dự án.</p>
                    </div>
                )}

                {activeTab === "members" && (
                    <div className="detail-card tab-content">
                        <h2>Thành viên dự án</h2>
                        <p>Quản lý thành viên tham gia dự án.</p>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="detail-card tab-content">
                        <h2>Cài đặt dự án</h2>
                        <p>Chỉnh sửa thông tin và cấu hình dự án.</p>
                    </div>
                )}
            </div>

            {showTaskForm && (
                <div className="task-modal-overlay">
                    <div className="task-modal">
                        <h2>Thêm công việc mới</h2>

                        <form onSubmit={handleAddTask}>
                            <label>Tên công việc</label>
                            <input
                                type="text"
                                name="title"
                                value={newTask.title}
                                onChange={handleTaskChange}
                                required
                            />

                            <label>Mô tả</label>
                            <textarea
                                name="description"
                                value={newTask.description}
                                onChange={handleTaskChange}
                            />

                            <label>ID người phụ trách</label>
                            <input
                                type="number"
                                name="assigned_to"
                                value={newTask.assigned_to}
                                onChange={handleTaskChange}
                                placeholder="Ví dụ: 2"
                            />

                            <div className="task-form-row">
                                <div>
                                    <label>Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={newTask.start_date}
                                        onChange={handleTaskChange}
                                    />
                                </div>

                                <div>
                                    <label>Deadline</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={newTask.end_date}
                                        onChange={handleTaskChange}
                                    />
                                </div>
                            </div>

                            <label>Trạng thái</label>
                            <select
                                name="status"
                                value={newTask.status}
                                onChange={handleTaskChange}
                            >
                                <option value="CHUA_LAM">Chưa làm</option>
                                <option value="DANG_LAM">Đang làm</option>
                                <option value="DANG_REVIEW">Đang review</option>
                                <option value="HOAN_THANH">Hoàn thành</option>
                                <option value="QUA_HAN">Quá hạn</option>
                            </select>

                            <label>Độ ưu tiên</label>
                            <select
                                name="priority"
                                value={newTask.priority}
                                onChange={handleTaskChange}
                            >
                                <option value="THAP">Thấp</option>
                                <option value="TRUNG_BINH">Trung bình</option>
                                <option value="CAO">Cao</option>
                            </select>

                            <label>Tiến độ (%)</label>
                            <input
                                type="number"
                                name="progress"
                                min="0"
                                max="100"
                                value={newTask.progress}
                                onChange={handleTaskChange}
                            />

                            <div className="task-modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowTaskForm(false)}
                                >
                                    Hủy
                                </button>

                                <button type="submit" className="btn-save">
                                    Lưu công việc
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectDetail;