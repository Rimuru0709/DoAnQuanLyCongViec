import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Setting.css";

const API_URL = "http://localhost:5000";

function Setting({
    project,
    onProjectUpdated,
    onProjectDeleted
}) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        customer: "",
        manager_name: "",
        start_date: "",
        end_date: "",
        status: "DANG_THUC_HIEN",
        color: "#2563EB"
    });

    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    const formatDateInput = (date) => {
        if (!date) {
            return "";
        }

        return String(date).slice(0, 10);
    };

    useEffect(() => {
        if (!project) {
            return;
        }

        setFormData({
            name: project.name || "",
            description: project.description || "",
            customer: project.customer || "",
            manager_name: project.manager_name || "",
            start_date: formatDateInput(
                project.start_date
            ),
            end_date: formatDateInput(
                project.end_date
            ),
            status:
                project.status ||
                "DANG_THUC_HIEN",
            color:
                project.color ||
                "#2563EB"
        });
    }, [project]);

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

    const handleChange = (event) => {
        const { name, value } =
            event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!canManageProject) {
            showToast(
                "Bạn không có quyền cập nhật dự án"
            );

            return;
        }

        if (!formData.name.trim()) {
            showToast(
                "Vui lòng nhập tên dự án"
            );

            return;
        }

        if (
            formData.start_date &&
            formData.end_date &&
            new Date(formData.end_date) <
                new Date(formData.start_date)
        ) {
            showToast(
                "Ngày kết thúc không được trước ngày bắt đầu"
            );

            return;
        }

        setIsSaving(true);

        try {
            const response = await authFetch(
                `${API_URL}/api/projects/${project.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        name:
                            formData.name.trim(),
                        description:
                            formData.description.trim(),
                        customer:
                            formData.customer.trim(),
                        manager_name:
                            formData.manager_name.trim(),
                        start_date:
                            formData.start_date ||
                            null,
                        end_date:
                            formData.end_date ||
                            null,
                        status:
                            formData.status,
                        color:
                            formData.color
                    })
                }
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Cập nhật dự án thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Cập nhật dự án thành công"
            );

            if (onProjectUpdated) {
                await onProjectUpdated();
            }
        } catch (error) {
            console.error(
                "Lỗi cập nhật dự án:",
                error
            );

            if (
                error.message !==
                "Phiên đăng nhập đã hết hạn"
            ) {
                showToast(
                    "Không thể kết nối đến server"
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!canManageProject) {
            showToast(
                "Bạn không có quyền xóa dự án"
            );

            return;
        }

        setIsDeleting(true);

        try {
            const response = await authFetch(
                `${API_URL}/api/projects/${project.id}`,
                {
                    method: "DELETE"
                }
            );

            const data =
                await parseResponse(response);

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

            setShowDeleteConfirm(false);

            if (onProjectDeleted) {
                onProjectDeleted();
            }
        } catch (error) {
            console.error(
                "Lỗi xóa dự án:",
                error
            );

            if (
                error.message !==
                "Phiên đăng nhập đã hết hạn"
            ) {
                showToast(
                    "Không thể kết nối đến server"
                );
            }
        } finally {
            setIsDeleting(false);
        }
    };

    if (!project) {
        return null;
    }

    if (!canManageProject) {
        return (
            <div className="project-setting-page">
                <div className="setting-header">
                    <div>
                        <h2>Cài đặt dự án</h2>

                        <p>
                            Bạn không có quyền chỉnh sửa
                            hoặc xóa dự án này.
                        </p>
                    </div>
                </div>

                <div className="setting-card">
                    <h3>Thông tin dự án</h3>

                    <div className="setting-info-row">
                        <span>Tên dự án</span>
                        <b>{project.name}</b>
                    </div>

                    <div className="setting-info-row">
                        <span>Quản lý dự án</span>
                        <b>
                            {project.manager_name ||
                                "Chưa có"}
                        </b>
                    </div>

                    <div className="setting-info-row">
                        <span>Tiến độ</span>
                        <b>
                            {Number(
                                project.progress
                            ) || 0}
                            %
                        </b>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="project-setting-page">
            {message && (
                <div className="setting-toast">
                    {message}
                </div>
            )}

            <div className="setting-header">
                <div>
                    <h2>Cài đặt dự án</h2>

                    <p>
                        Chỉnh sửa thông tin, trạng thái
                        và quản trị dự án.
                    </p>
                </div>
            </div>

            <div className="setting-grid">
                <form
                    className="setting-card"
                    onSubmit={handleSave}
                >
                    <h3>Thông tin dự án</h3>

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
                    />

                    <label>Khách hàng</label>

                    <input
                        type="text"
                        name="customer"
                        value={
                            formData.customer
                        }
                        onChange={handleChange}
                        placeholder="Ví dụ: Công ty ABC"
                    />

                    <label>
                        Quản lý dự án
                    </label>

                    <input
                        type="text"
                        name="manager_name"
                        value={
                            formData.manager_name
                        }
                        onChange={handleChange}
                    />

                    <div className="setting-form-row">
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
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label>
                                Ngày kết thúc
                            </label>

                            <input
                                type="date"
                                name="end_date"
                                min={
                                    formData.start_date ||
                                    undefined
                                }
                                value={
                                    formData.end_date
                                }
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <label>Trạng thái</label>

                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="DANG_THUC_HIEN">
                            Đang thực hiện
                        </option>

                        <option value="SAP_TOI">
                            Sắp tới
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
                                onClick={() =>
                                    setFormData(
                                        (previous) => ({
                                            ...previous,
                                            color
                                        })
                                    )
                                }
                            />
                        ))}
                    </div>

                    <div className="setting-actions">
                        <button
                            type="submit"
                            className="btn-setting-save"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? "Đang lưu..."
                                : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>

                <div className="setting-side">
                    <div className="setting-card">
                        <h3>Quản lý dự án</h3>

                        <div className="setting-info-row">
                            <span>Chủ dự án</span>

                            <b>
                                {project.manager_name ||
                                    "Chưa có"}
                            </b>
                        </div>

                        <div className="setting-info-row">
                            <span>
                                Tiến độ hiện tại
                            </span>

                            <b>
                                {Number(
                                    project.progress
                                ) || 0}
                                %
                            </b>
                        </div>

                        <div className="setting-info-row">
                            <span>ID dự án</span>

                            <b>#{project.id}</b>
                        </div>
                    </div>

                    <div className="setting-card danger-zone">
                        <h3>Danger Zone</h3>

                        <p>
                            Xóa dự án này sẽ xóa toàn bộ
                            công việc, tài liệu và thành viên
                            liên quan. Hành động này không
                            thể hoàn tác.
                        </p>

                        <button
                            type="button"
                            className="btn-setting-delete"
                            onClick={() =>
                                setShowDeleteConfirm(
                                    true
                                )
                            }
                        >
                            Xóa dự án
                        </button>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="member-modal-overlay">
                    <div className="member-modal">
                        <h2>Xóa dự án</h2>

                        <p>
                            Bạn có chắc chắn muốn xóa
                            dự án này không?
                        </p>

                        <div className="member-modal-actions">
                            <button
                                type="button"
                                className="btn-member-cancel"
                                onClick={() =>
                                    setShowDeleteConfirm(
                                        false
                                    )
                                }
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                className="btn-setting-delete"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting
                                    ? "Đang xóa..."
                                    : "Xóa dự án"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Setting;