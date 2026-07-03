import { useEffect, useState } from "react";
import "./TaskModal.css";

function TaskModal({ open, task, projectId, onClose, onSuccess, onDelete }) {
    const isEdit = !!task;

    const emptyTask = {
        title: "",
        description: "",
        assigned_to: "",
        start_date: "",
        end_date: "",
        status: "CHUA_LAM",
        priority: "TRUNG_BINH",
        progress: 0,
    };

    const [formData, setFormData] = useState(emptyTask);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || "",
                description: task.description || "",
                assigned_to: task.assigned_to || "",
                start_date: task.start_date ? task.start_date.slice(0, 10) : "",
                end_date: task.end_date ? task.end_date.slice(0, 10) : "",
                status: task.status || "CHUA_LAM",
                priority: task.priority || "TRUNG_BINH",
                progress: task.progress || 0,
            });
        } else {
            setFormData(emptyTask);
        }
    }, [task, open]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        const newData = {
            ...formData,
            [name]: value,
        };

        if (name === "status") {
            if (value === "CHUA_LAM") newData.progress = 0;
            if (value === "DANG_REVIEW") newData.progress = 90;
            if (value === "HOAN_THANH") newData.progress = 100;
        }

        setFormData(newData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            ...formData,
            project_id: projectId,
            assigned_to: formData.assigned_to || null,
            progress: Number(formData.progress),
        };

        const url = isEdit
            ? `http://localhost:5000/api/tasks/${task.id}`
            : "http://localhost:5000/api/tasks";

        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            setMessage(isEdit ? "Cập nhật công việc thất bại" : "Thêm công việc thất bại");
            return;
        }

        setMessage(isEdit ? "Cập nhật công việc thành công" : "Thêm công việc thành công");

        setTimeout(() => {
            setMessage("");
            onSuccess();
            onClose();
        }, 700);
    };

    return (
        <div className="task-modal-overlay">
            {message && <div className="toast-success">{message}</div>}

            <div className="task-modal">
                <h2>{isEdit ? "Cập nhật công việc" : "Thêm công việc mới"}</h2>

                <form onSubmit={handleSubmit}>
                    <label>Tên công việc</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <label>Mô tả</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />

                    <label>ID người phụ trách</label>
                    <input
                        type="number"
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleChange}
                        placeholder="Ví dụ: 2"
                    />

                    <div className="task-form-row">
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
                            <label>Deadline</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <label>Trạng thái</label>
                    <select name="status" value={formData.status} onChange={handleChange}>
                        <option value="CHUA_LAM">Chưa làm</option>
                        <option value="DANG_LAM">Đang làm</option>
                        <option value="DANG_REVIEW">Đang review</option>
                        <option value="HOAN_THANH">Hoàn thành</option>
                        <option value="QUA_HAN">Quá hạn</option>
                    </select>

                    <label>Độ ưu tiên</label>
                    <select name="priority" value={formData.priority} onChange={handleChange}>
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
                        value={formData.progress}
                        onChange={handleChange}
                        disabled={
                            formData.status === "CHUA_LAM" ||
                            formData.status === "DANG_REVIEW" ||
                            formData.status === "HOAN_THANH"
                        }
                    />

                    <div className="task-modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Hủy
                        </button>

                        {isEdit && (
                            <button
                                type="button"
                                className="btn-delete"
                                onClick={() => onDelete(task)}
                            >
                                Xóa
                            </button>
                        )}

                        <button type="submit" className="btn-save">
                            {isEdit ? "Cập nhật" : "Lưu công việc"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TaskModal;