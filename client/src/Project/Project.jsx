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
    FaUndo
} from "react-icons/fa";
import Sidebar from "../Sidebar/Sidebar";

const API_URL = "http://localhost:5000/api/projects";

function Project() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [menuProject, setMenuProject] = useState(null);
    const [deleteProjectId, setDeleteProjectId] = useState(null);
    const [archiveProjectId, setArchiveProjectId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const projectsPerPage = 5;

    const token = localStorage.getItem("token");

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user")
        );
    } catch {
        currentUser = null;
    }

    const canManageProject =
        currentUser?.role === "ADMIN" ||
        currentUser?.role === "MANAGER";

    const isAdmin =
        currentUser?.role === "ADMIN";

    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        customer: "",
        manager_name: "",
        start_date: "",
        end_date: "",
        status: "SAP_TOI",
        color: "#2563EB"
    });

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

    const getResponseData = async (response) => {
        try {
            return await response.json();
        } catch {
            return {};
        }
    };

    const loadProjects = async () => {
        if (!token) {
            navigate("/login", {
                replace: true
            });

            return;
        }

        setLoading(true);

        const url =
            filterStatus === "ARCHIVED"
                ? `${API_URL}/archived`
                : API_URL;

        try {
            const response = await authFetch(url);
            const data = await getResponseData(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Không thể tải danh sách dự án"
                );

                setProjects([]);
                return;
            }

            setProjects(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.projects)
                        ? data.projects
                        : []
            );
        } catch (error) {
            console.error(
                "Lỗi tải dự án:",
                error
            );

            if (error.message !== "Phiên đăng nhập đã hết hạn") {
                showToast(
                    "Không thể kết nối đến server"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, [filterStatus]);

    const statusText = {
        DANG_THUC_HIEN: "Đang thực hiện",
        SAP_TOI: "Sắp tới",
        HOAN_THANH: "Hoàn thành",
        TAM_DUNG: "Tạm dừng",
        QUA_HAN: "Quá hạn"
    };

    const resetProjectForm = () => {
        setNewProject({
            name: "",
            description: "",
            customer: "",
            manager_name: "",
            start_date: "",
            end_date: "",
            status: "SAP_TOI",
            color: "#2563EB"
        });
    };

    const handleOpenAdd = () => {
        if (!canManageProject) {
            showToast(
                "Bạn không có quyền thêm dự án"
            );

            return;
        }

        setEditProject(null);
        resetProjectForm();
        setShowForm(true);
    };

    const handleOpenEdit = (project) => {
        if (!canManageProject) {
            showToast(
                "Bạn không có quyền sửa dự án"
            );

            return;
        }

        setEditProject({
            ...project,
            description:
                project.description || "",
            customer:
                project.customer || "",
            manager_name:
                project.manager_name || "",
            start_date:
                project.start_date
                    ? project.start_date.slice(0, 10)
                    : "",
            end_date:
                project.end_date
                    ? project.end_date.slice(0, 10)
                    : ""
        });

        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditProject(null);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        if (editProject) {
            setEditProject((previous) => ({
                ...previous,
                [name]: value
            }));
        } else {
            setNewProject((previous) => ({
                ...previous,
                [name]: value
            }));
        }
    };

    const handleSubmitProject = async (event) => {
        event.preventDefault();

        if (!canManageProject) {
            showToast(
                "Bạn không có quyền thực hiện chức năng này"
            );

            return;
        }

        const isEdit = editProject !== null;
        const formData = isEdit
            ? editProject
            : newProject;

        if (
            new Date(formData.end_date) <
            new Date(formData.start_date)
        ) {
            showToast(
                "Deadline không được trước ngày bắt đầu"
            );

            return;
        }

        const url = isEdit
            ? `${API_URL}/${editProject.id}`
            : API_URL;

        const method = isEdit
            ? "PUT"
            : "POST";

        const projectData = {
            name: formData.name.trim(),
            description:
                formData.description.trim(),
            customer:
                formData.customer?.trim() || "",
            manager_name:
                formData.manager_name?.trim() || "",
            start_date:
                formData.start_date,
            end_date:
                formData.end_date,
            status:
                formData.status,
            color:
                formData.color
        };

        try {
            const response = await authFetch(url, {
                method,
                body: JSON.stringify(projectData)
            });

            const data = await getResponseData(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    (isEdit
                        ? "Cập nhật dự án thất bại"
                        : "Thêm dự án thất bại")
                );

                return;
            }

            showToast(
                data.message ||
                (isEdit
                    ? "Cập nhật dự án thành công"
                    : "Thêm dự án thành công")
            );

            setShowForm(false);
            setEditProject(null);
            setCurrentPage(1);
            resetProjectForm();

            loadProjects();
        } catch (error) {
            console.error(
                "Lỗi lưu dự án:",
                error
            );
        }
    };

    const handleDeleteProject = async (id) => {
        if (!canManageProject) {
            showToast(
                "Bạn không có quyền xóa dự án"
            );

            return;
        }

        try {
            const response = await authFetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Xóa dự án thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Xóa dự án thành công"
            );

            setMenuProject(null);
            setDeleteProjectId(null);

            loadProjects();
        } catch (error) {
            console.error(
                "Lỗi xóa dự án:",
                error
            );
        }
    };

    const handleArchiveProject = async (id) => {
        if (!canManageProject) {
            showToast(
                "Bạn không có quyền lưu trữ dự án"
            );

            return;
        }

        try {
            const response = await authFetch(
                `${API_URL}/${id}/archive`,
                {
                    method: "PUT"
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Lưu trữ dự án thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Đã lưu trữ dự án"
            );

            setMenuProject(null);
            setArchiveProjectId(null);
            setCurrentPage(1);

            loadProjects();
        } catch (error) {
            console.error(
                "Lỗi lưu trữ dự án:",
                error
            );
        }
    };

    const handleDuplicateProject = async (id) => {
        if (!canManageProject) {
            showToast(
                "Bạn không có quyền nhân bản dự án"
            );

            return;
        }

        try {
            const response = await authFetch(
                `${API_URL}/${id}/duplicate`,
                {
                    method: "POST"
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Nhân bản dự án thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Nhân bản dự án thành công"
            );

            setMenuProject(null);

            loadProjects();
        } catch (error) {
            console.error(
                "Lỗi nhân bản dự án:",
                error
            );
        }
    };

    const handleRestoreProject = async (id) => {
        if (!canManageProject) {
            showToast(
                "Bạn không có quyền khôi phục dự án"
            );

            return;
        }

        try {
            const response = await authFetch(
                `${API_URL}/${id}/restore`,
                {
                    method: "PUT"
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Khôi phục dự án thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Khôi phục dự án thành công"
            );

            setMenuProject(null);
            setCurrentPage(1);

            loadProjects();
        } catch (error) {
            console.error(
                "Lỗi khôi phục dự án:",
                error
            );
        }
    };

    const filteredProjects = projects.filter(
        (project) => {
            const matchStatus =
                filterStatus === "ALL" ||
                filterStatus === "ARCHIVED" ||
                project.status === filterStatus;

            const searchText =
                search.trim().toLowerCase();

            const projectName =
                project.name?.toLowerCase() || "";

            const projectDescription =
                project.description?.toLowerCase() || "";

            const matchSearch =
                projectName.includes(searchText) ||
                projectDescription.includes(searchText);

            return matchStatus && matchSearch;
        }
    );

    const totalPages = Math.ceil(
        filteredProjects.length /
        projectsPerPage
    );

    const lastIndex =
        currentPage * projectsPerPage;

    const firstIndex =
        lastIndex - projectsPerPage;

    const currentProjects =
        filteredProjects.slice(
            firstIndex,
            lastIndex
        );

    const formData =
        editProject || newProject;

    return (
        <div className="layout">
            <Sidebar />

            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <div className="project-page">
                <div className="project-header">
                    <div>
                        <h1>Dự án</h1>

                        <p>
                            Quản lý các dự án thuộc tài khoản của bạn.
                        </p>
                    </div>

                    <div className="project-actions">
                        <input
                            type="text"
                            placeholder="Tìm kiếm dự án..."
                            value={search}
                            onChange={(event) => {
                                setSearch(
                                    event.target.value
                                );

                                setCurrentPage(1);
                            }}
                        />

                        {isAdmin && (
                            <button
                                onClick={handleOpenAdd}
                            >
                                <FaPlus />
                                Thêm dự án
                            </button>
                        )}
                    </div>
                </div>

                <div className="project-tabs">
                    {[
                        ["ALL", "Tất cả"],
                        [
                            "DANG_THUC_HIEN",
                            "Đang thực hiện"
                        ],
                        ["SAP_TOI", "Sắp tới"],
                        [
                            "HOAN_THANH",
                            "Hoàn thành"
                        ],
                        [
                            "TAM_DUNG",
                            "Tạm dừng"
                        ],
                        [
                            "ARCHIVED",
                            "Đã lưu trữ"
                        ]
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => {
                                setFilterStatus(value);
                                setCurrentPage(1);
                            }}
                            className={
                                filterStatus === value
                                    ? "active"
                                    : ""
                            }
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

                                {canManageProject && (
                                    <th>Hành động</th>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            canManageProject
                                                ? 6
                                                : 5
                                        }
                                    >
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : currentProjects.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            canManageProject
                                                ? 6
                                                : 5
                                        }
                                    >
                                        Không có dự án nào.
                                    </td>
                                </tr>
                            ) : (
                                currentProjects.map(
                                    (project, index) => (
                                        <tr key={project.id}>
                                            <td>
                                                <div
                                                    className="project-info"
                                                    onClick={() =>
                                                        navigate(
                                                            `/project/${project.id}`
                                                        )
                                                    }
                                                >
                                                    <div
                                                        className={`project-icon icon-${index % 6}`}
                                                        style={{
                                                            backgroundColor:
                                                                project.color ||
                                                                "#2563EB"
                                                        }}
                                                    >
                                                        {project.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <h4>
                                                            {project.name}
                                                        </h4>

                                                        <p>
                                                            {project.description ||
                                                                "Không có mô tả"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status ${project.status}`}
                                                >
                                                    {statusText[
                                                        project.status
                                                    ] ||
                                                        project.status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="progress-box">
                                                    <span>
                                                        {Number(
                                                            project.progress
                                                        ) || 0}
                                                        %
                                                    </span>

                                                    <div className="progress-line">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    Math.max(
                                                                        0,
                                                                        Number(
                                                                            project.progress
                                                                        ) ||
                                                                        0
                                                                    )
                                                                )}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="avatars">
                                                    <img
                                                        src="https://i.pravatar.cc/40?img=1"
                                                        alt="Thành viên"
                                                    />

                                                    <img
                                                        src="https://i.pravatar.cc/40?img=2"
                                                        alt="Thành viên"
                                                    />

                                                    <img
                                                        src="https://i.pravatar.cc/40?img=3"
                                                        alt="Thành viên"
                                                    />

                                                    <span>
                                                        +{index + 1}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {project.end_date
                                                    ? new Date(
                                                        project.end_date
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )
                                                    : "Chưa có"}
                                            </td>

                                            {canManageProject && (
                                                <td>
                                                    <div className="table-actions">
                                                        <FaEdit
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();

                                                                handleOpenEdit(
                                                                    project
                                                                );
                                                            }}
                                                        />

                                                        <div className="menu-wrapper">
                                                            <FaEllipsisH
                                                                onClick={(
                                                                    event
                                                                ) => {
                                                                    event.stopPropagation();

                                                                    setMenuProject(
                                                                        menuProject ===
                                                                            project.id
                                                                            ? null
                                                                            : project.id
                                                                    );
                                                                }}
                                                            />

                                                            {menuProject ===
                                                                project.id && (
                                                                    <div className="dropdown-menu">
                                                                        {filterStatus ===
                                                                            "ARCHIVED" ? (
                                                                            <div
                                                                                onClick={(
                                                                                    event
                                                                                ) => {
                                                                                    event.stopPropagation();

                                                                                    handleRestoreProject(
                                                                                        project.id
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <FaUndo />
                                                                                Khôi phục dự án
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <div
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.stopPropagation();

                                                                                        handleDuplicateProject(
                                                                                            project.id
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <FaCopy />
                                                                                    Nhân bản dự án
                                                                                </div>

                                                                                <div
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.stopPropagation();

                                                                                        setArchiveProjectId(
                                                                                            project.id
                                                                                        );

                                                                                        setMenuProject(
                                                                                            null
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <FaArchive />
                                                                                    Lưu trữ dự án
                                                                                </div>
                                                                            </>
                                                                        )}

                                                                        <div
                                                                            className="delete"
                                                                            onClick={(
                                                                                event
                                                                            ) => {
                                                                                event.stopPropagation();

                                                                                setDeleteProjectId(
                                                                                    project.id
                                                                                );

                                                                                setMenuProject(
                                                                                    null
                                                                                );
                                                                            }}
                                                                        >
                                                                            <FaTrash />
                                                                            Xóa dự án
                                                                        </div>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>

                    <div className="table-footer">
                        <p>
                            Hiển thị{" "}
                            {filteredProjects.length === 0
                                ? 0
                                : firstIndex + 1}{" "}
                            đến{" "}
                            {Math.min(
                                lastIndex,
                                filteredProjects.length
                            )}{" "}
                            của tổng số{" "}
                            {filteredProjects.length} dự án
                        </p>

                        <div className="pagination">
                            {Array.from(
                                {
                                    length: totalPages
                                },
                                (_, index) => (
                                    <button
                                        key={index + 1}
                                        className={
                                            currentPage ===
                                                index + 1
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                index + 1
                                            )
                                        }
                                    >
                                        {index + 1}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showForm && canManageProject && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>
                            {editProject
                                ? "Cập nhật dự án"
                                : "Thêm dự án mới"}
                        </h2>

                        <form
                            onSubmit={handleSubmitProject}
                        >
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
                                value={
                                    formData.description
                                }
                                onChange={handleChange}
                                required
                            />

                            <label>Khách hàng</label>

                            <input
                                type="text"
                                name="customer"
                                value={
                                    formData.customer || ""
                                }
                                onChange={handleChange}
                                placeholder="Ví dụ: Công ty ABC"
                            />

                            <label>
                                Chủ dự án (Owner)
                            </label>

                            <input
                                type="text"
                                name="manager_name"
                                value={
                                    formData.manager_name ||
                                    ""
                                }
                                onChange={handleChange}
                                placeholder="Ví dụ: Nguyễn Văn A"
                            />

                            <div className="form-row">
                                <div>
                                    <label>
                                        Ngày bắt đầu
                                    </label>

                                    <input
                                        type="date"
                                        name="start_date"
                                        value={
                                            formData.start_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label>
                                        Deadline
                                    </label>

                                    <input
                                        type="date"
                                        name="end_date"
                                        value={
                                            formData.end_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <label>
                                Trạng thái
                            </label>

                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="SAP_TOI">
                                    Sắp tới
                                </option>

                                <option value="DANG_THUC_HIEN">
                                    Đang thực hiện
                                </option>

                                <option value="HOAN_THANH">
                                    Hoàn thành
                                </option>

                                <option value="TAM_DUNG">
                                    Tạm dừng
                                </option>

                                <option value="QUA_HAN">
                                    Quá hạn
                                </option>
                            </select>

                            <label>Màu dự án</label>

                            <div className="color-options">
                                {[
                                    "#2563EB",
                                    "#22C55E",
                                    "#A855F7",
                                    "#F97316",
                                    "#EF4444",
                                    "#EAB308",
                                    "#06B6D4",
                                    "#64748B"
                                ].map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={
                                            formData.color ===
                                                color
                                                ? "color-circle active"
                                                : "color-circle"
                                        }
                                        style={{
                                            backgroundColor:
                                                color
                                        }}
                                        onClick={() => {
                                            if (editProject) {
                                                setEditProject(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        color
                                                    })
                                                );
                                            } else {
                                                setNewProject(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        color
                                                    })
                                                );
                                            }
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={
                                        handleCloseForm
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="btn-save"
                                >
                                    {editProject
                                        ? "Cập nhật"
                                        : "Lưu dự án"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteProjectId &&
                canManageProject && (
                    <div className="modal-overlay">
                        <div className="modal-box delete-modal">
                            <h2>Xóa dự án</h2>

                            <p className="delete-text">
                                Bạn có chắc chắn muốn
                                xóa dự án này không?
                            </p>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() =>
                                        setDeleteProjectId(
                                            null
                                        )
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    className="btn-delete"
                                    onClick={() =>
                                        handleDeleteProject(
                                            deleteProjectId
                                        )
                                    }
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {archiveProjectId &&
                canManageProject && (
                    <div className="modal-overlay">
                        <div className="modal-box delete-modal">
                            <h2>
                                Lưu trữ dự án
                            </h2>

                            <p className="delete-text">
                                Bạn có chắc chắn muốn
                                lưu trữ dự án này không?
                            </p>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() =>
                                        setArchiveProjectId(
                                            null
                                        )
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    className="btn-save"
                                    onClick={() =>
                                        handleArchiveProject(
                                            archiveProjectId
                                        )
                                    }
                                >
                                    Lưu trữ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default Project;