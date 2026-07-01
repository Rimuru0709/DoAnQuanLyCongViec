import "./Project.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaEdit,
    FaEllipsisH,
    FaPlus,
    FaTrash,
    FaCopy,
    FaArchive,
} from "react-icons/fa";
import Sidebar from "../Sidebar/Sidebar";

function Project() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [menuProject, setMenuProject] = useState(null);
    const [deleteProjectId, setDeleteProjectId] = useState(null);
    const [message, setMessage] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 5;

    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        customer: "",
        manager_name: "",
        start_date: "",
        end_date: "",
        status: "SAP_TOI",
        progress: 0,
        created_by: 1,
    });

    const showToast = (text) => {
        setMessage(text);
        setTimeout(() => setMessage(""), 2500);
    };

    const loadProjects = () => {
        fetch("http://localhost:5000/api/projects")
            .then((res) => res.json())
            .then((data) => setProjects(data))
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const statusText = {
        DANG_THUC_HIEN: "Đang thực hiện",
        SAP_TOI: "Sắp tới",
        HOAN_THANH: "Hoàn thành",
        TAM_DUNG: "Tạm dừng",
        QUA_HAN: "Quá hạn",
    };

    const handleOpenAdd = () => {
        setEditProject(null);
        setNewProject({
            name: "",
            description: "",
            customer: "",
            manager_name: "",
            start_date: "",
            end_date: "",
            status: "SAP_TOI",
            progress: 0,
            created_by: 1,
        });
        setShowForm(true);
    };

    const handleOpenEdit = (project) => {
        setEditProject({
            ...project,
            start_date: project.start_date ? project.start_date.slice(0, 10) : "",
            end_date: project.end_date ? project.end_date.slice(0, 10) : "",
        });
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditProject(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (editProject) {
            setEditProject({
                ...editProject,
                [name]: value,
            });
        } else {
            setNewProject({
                ...newProject,
                [name]: value,
            });
        }
    };

    const handleSubmitProject = async (e) => {
        e.preventDefault();

        const isEdit = editProject !== null;
        const data = isEdit ? editProject : newProject;

        const url = isEdit
            ? `http://localhost:5000/api/projects/${editProject.id}`
            : "http://localhost:5000/api/projects";

        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            showToast(isEdit ? "Cập nhật dự án thất bại" : "Thêm dự án thất bại");
            return;
        }

        showToast(isEdit ? "Cập nhật dự án thành công" : "Thêm dự án thành công");

        setShowForm(false);
        setEditProject(null);
        setCurrentPage(1);

        setNewProject({
            name: "",
            description: "",
            customer: "",
            manager_name: "",
            start_date: "",
            end_date: "",
            status: "SAP_TOI",
            progress: 0,
            created_by: 1,
        });

        loadProjects();
    };

    const handleDeleteProject = async (id) => {
        const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            showToast("Xóa dự án thất bại");
            return;
        }

        showToast("Xóa dự án thành công");
        setMenuProject(null);
        setDeleteProjectId(null);
        loadProjects();
    };

    const handleArchiveProject = async (id) => {
        const res = await fetch(`http://localhost:5000/api/projects/${id}/archive`, {
            method: "PUT",
        });

        if (!res.ok) {
            showToast("Lưu trữ dự án thất bại");
            return;
        }

        showToast("Đã lưu trữ dự án");
        setMenuProject(null);
        loadProjects();
    };

    const handleDuplicateProject = async (id) => {
        const res = await fetch(`http://localhost:5000/api/projects/${id}/duplicate`, {
            method: "POST",
        });

        if (!res.ok) {
            showToast("Nhân bản dự án thất bại");
            return;
        }

        showToast("Nhân bản dự án thành công");
        setMenuProject(null);
        loadProjects();
    };

    const filteredProjects = projects.filter((project) => {
        const matchStatus =
            filterStatus === "ALL" || project.status === filterStatus;

        const matchSearch =
            project.name.toLowerCase().includes(search.toLowerCase()) ||
            project.description.toLowerCase().includes(search.toLowerCase());

        return matchStatus && matchSearch;
    });

    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    const lastIndex = currentPage * projectsPerPage;
    const firstIndex = lastIndex - projectsPerPage;
    const currentProjects = filteredProjects.slice(firstIndex, lastIndex);

    const formData = editProject || newProject;

    return (
        <div className="layout">
            <Sidebar />

            {message && <div className="toast-success">{message}</div>}

            <div className="project-page">
                <div className="project-header">
                    <div>
                        <h1>Dự án</h1>
                        <p>Quản lý tất cả dự án của bạn.</p>
                    </div>

                    <div className="project-actions">
                        <input
                            type="text"
                            placeholder="Tìm kiếm dự án..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />

                        <button onClick={handleOpenAdd}>
                            <FaPlus /> Thêm dự án
                        </button>
                    </div>
                </div>

                <div className="project-tabs">
                    {[
                        ["ALL", "Tất cả"],
                        ["DANG_THUC_HIEN", "Đang thực hiện"],
                        ["SAP_TOI", "Sắp tới"],
                        ["HOAN_THANH", "Hoàn thành"],
                        ["TAM_DUNG", "Tạm dừng"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => {
                                setFilterStatus(value);
                                setCurrentPage(1);
                            }}
                            className={filterStatus === value ? "active" : ""}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="project-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Dự án</th>
                                <th>Trạng thái</th>
                                <th>Tiến độ</th>
                                <th>Thành viên</th>
                                <th>Deadline</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentProjects.map((project, index) => (
                                <tr key={project.id}>
                                    <td>
                                        <div
                                            className="project-info"
                                            onClick={() => navigate(`/project/${project.id}`)}
                                        >
                                            <div className={`project-icon icon-${index % 6}`}>
                                                {project.name.charAt(0)}
                                            </div>

                                            <div>
                                                <h4>{project.name}</h4>
                                                <p>{project.description}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <span className={`status ${project.status}`}>
                                            {statusText[project.status]}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="progress-box">
                                            <span>{project.progress}%</span>

                                            <div className="progress-line">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="avatars">
                                            <img src="https://i.pravatar.cc/40?img=1" alt="" />
                                            <img src="https://i.pravatar.cc/40?img=2" alt="" />
                                            <img src="https://i.pravatar.cc/40?img=3" alt="" />
                                            <span>+{index + 1}</span>
                                        </div>
                                    </td>

                                    <td>
                                        {project.end_date
                                            ? new Date(project.end_date).toLocaleDateString("vi-VN")
                                            : ""}
                                    </td>

                                    <td>
                                        <div className="table-actions">
                                            <FaEdit
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenEdit(project);
                                                }}
                                            />

                                            <div className="menu-wrapper">
                                                <FaEllipsisH
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuProject(
                                                            menuProject === project.id ? null : project.id
                                                        );
                                                    }}
                                                />

                                                {menuProject === project.id && (
                                                    <div className="dropdown-menu">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDuplicateProject(project.id);
                                                            }}
                                                        >
                                                            <FaCopy /> Nhân bản dự án
                                                        </div>

                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleArchiveProject(project.id);
                                                            }}
                                                        >
                                                            <FaArchive /> Lưu trữ dự án
                                                        </div>

                                                        <div
                                                            className="delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteProjectId(project.id);
                                                            }}
                                                        >
                                                            <FaTrash /> Xóa dự án
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="table-footer">
                        <p>
                            Hiển thị {filteredProjects.length === 0 ? 0 : firstIndex + 1} đến{" "}
                            {Math.min(lastIndex, filteredProjects.length)} của tổng số{" "}
                            {filteredProjects.length} dự án
                        </p>

                        <div className="pagination">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={currentPage === i + 1 ? "active" : ""}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{editProject ? "Cập nhật dự án" : "Thêm dự án mới"}</h2>

                        <form onSubmit={handleSubmitProject}>
                            <label>Tên dự án</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                            <label>Mô tả</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />

                            <label>Khách hàng</label>
                            <input
                                type="text"
                                name="customer"
                                value={formData.customer || ""}
                                onChange={handleChange}
                                placeholder="Ví dụ: Công ty TNHH ABC"
                            />

                            <label>Quản lý dự án</label>
                            <input
                                type="text"
                                name="manager_name"
                                value={formData.manager_name || ""}
                                onChange={handleChange}
                                placeholder="Ví dụ: Nguyễn Văn A"
                            />

                            <div className="form-row">
                                <div>
                                    <label>Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Deadline</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <label>Trạng thái</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="SAP_TOI">Sắp tới</option>
                                <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                                <option value="HOAN_THANH">Hoàn thành</option>
                                <option value="TAM_DUNG">Tạm dừng</option>
                                <option value="QUA_HAN">Quá hạn</option>
                            </select>

                            <label>Tiến độ (%)</label>
                            <input
                                type="number"
                                name="progress"
                                min="0"
                                max="100"
                                value={formData.progress}
                                onChange={handleChange}
                            />

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={handleCloseForm}
                                >
                                    Hủy
                                </button>

                                <button type="submit" className="btn-save">
                                    {editProject ? "Cập nhật" : "Lưu dự án"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteProjectId && (
                <div className="modal-overlay">
                    <div className="modal-box delete-modal">
                        <h2>Xóa dự án</h2>

                        <p className="delete-text">
                            Bạn có chắc chắn muốn xóa dự án này không?
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setDeleteProjectId(null)}
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDeleteProject(deleteProjectId)}
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

export default Project;