import { useEffect, useState } from "react";
import "./Setting.css";

function Setting({ project, onProjectUpdated, onProjectDeleted }) {
    const API_URL = "http://localhost:5000";

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        customer: "",
        manager_name: "",
        start_date: "",
        end_date: "",
        status: "DANG_THUC_HIEN",
        progress: 0,
    });

    const [message, setMessage] = useState("");

    const formatDateInput = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || "",
                description: project.description || "",
                customer: project.customer || "",
                manager_name: project.manager_name || "",
                start_date: formatDateInput(project.start_date),
                end_date: formatDateInput(project.end_date),
                status: project.status || "DANG_THUC_HIEN",
                progress: project.progress || 0,
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${API_URL}/api/projects/${project.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                setMessage("Cập nhật dự án thất bại");
                return;
            }

            setMessage("Cập nhật dự án thành công");

            if (onProjectUpdated) {
                onProjectUpdated();
            }

            setTimeout(() => {
                setMessage("");
            }, 1500);
        } catch (err) {
            console.log(err);
            setMessage("Có lỗi xảy ra khi cập nhật dự án");
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`${API_URL}/api/projects/${project.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                setMessage("Xóa dự án thất bại");
                return;
            }

            if (onProjectDeleted) {
                onProjectDeleted();
            }
        } catch (err) {
            console.log(err);
            setMessage("Có lỗi xảy ra khi xóa dự án");
        }
    };

    if (!project) return null;

    return (
        <div className="project-setting-page">
            {message && <div className="setting-toast">{message}</div>}

            <div className="setting-header">
                <div>
                    <h2>Cài đặt dự án</h2>
                    <p>Chỉnh sửa thông tin, trạng thái và quản trị dự án.</p>
                </div>
            </div>

            <div className="setting-grid">
                <form className="setting-card" onSubmit={handleSave}>
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
                        value={formData.description}
                        onChange={handleChange}
                    />

                    <div className="setting-form-row">
                        <div>
                            <label>Khách hàng</label>
                            <input
                                type="text"
                                name="customer"
                                value={formData.customer}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label>Quản lý dự án</label>
                            <input
                                type="text"
                                name="manager_name"
                                value={formData.manager_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="setting-form-row">
                        <div>
                            <label>Ngày bắt đầu</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label>Ngày kết thúc</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
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
                        <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                        <option value="SAP_TOI">Sắp tới</option>
                        <option value="HOAN_THANH">Hoàn thành</option>
                        <option value="TAM_DUNG">Tạm dừng</option>
                        <option value="QUA_HAN">Quá hạn</option>
                    </select>

                    <div className="setting-actions">
                        <button type="submit" className="btn-setting-save">
                            Lưu thay đổi
                        </button>
                    </div>
                </form>

                <div className="setting-side">
                    <div className="setting-card">
                        <h3>Quản lý dự án</h3>

                        <div className="setting-info-row">
                            <span>Chủ dự án</span>
                            <b>{project.manager_name || "Chưa có"}</b>
                        </div>

                        <div className="setting-info-row">
                            <span>Khách hàng</span>
                            <b>{project.customer || "Chưa có"}</b>
                        </div>

                        <div className="setting-info-row">
                            <span>Tiến độ hiện tại</span>
                            <b>{project.progress || 0}%</b>
                        </div>

                        <div className="setting-info-row">
                            <span>ID dự án</span>
                            <b>#{project.id}</b>
                        </div>
                    </div>

                    <div className="setting-card danger-zone">
                        <h3>Danger Zone</h3>

                        <p>
                            Xóa dự án này sẽ xóa toàn bộ dữ liệu liên quan như công việc,
                            tài liệu và thành viên. Hành động này không thể hoàn tác.
                        </p>

                        <button
                            type="button"
                            className="btn-setting-delete"
                            onClick={handleDelete}
                        >
                            Xóa dự án
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Setting;