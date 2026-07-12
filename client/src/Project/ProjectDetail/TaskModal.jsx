import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TaskModal.css";

const API_URL = "http://localhost:5000/api/tasks";

function TaskModal({
    open,
    task,
    projectId,
    onClose,
    onSuccess,
    onDelete
}) {
    const navigate = useNavigate();
    const isEdit = Boolean(task);

    const emptyTask = {
        title: "",
        description: "",
        assigned_to: "",
        start_date: "",
        end_date: "",
        status: "CHUA_LAM",
        priority: "TRUNG_BINH",
        progress: 0
    };

    const [formData, setFormData] = useState(emptyTask);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (task) {
            setFormData({
                title: task.title || "",
                description: task.description || "",
                assigned_to: task.assigned_to || "",
                start_date: task.start_date
                    ? task.start_date.slice(0, 10)
                    : "",
                end_date: task.end_date
                    ? task.end_date.slice(0, 10)
                    : "",
                status: task.status || "CHUA_LAM",
                priority: task.priority || "TRUNG_BINH",
                progress: Number(task.progress) || 0
            });
        } else {
            setFormData(emptyTask);
        }

        setMessage("");
    }, [task, open]);

    if (!open) {
        return null;
    }

    const showMessage = (text) => {
        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 2500);
    };

    const handleUnauthorized = () => {
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

    const handleChange = (event) => {
        const { name, value } = event.target;

        const newData = {
            ...formData,
            [name]: value
        };

        if (name === "status") {
            if (value === "CHUA_LAM") {
                newData.progress = 0;
            }

            if (value === "DANG_LAM") {
                const currentProgress =
                    Number(formData.progress) || 0;

                newData.progress = Math.min(
                    89,
                    Math.max(1, currentProgress)
                );
            }

            if (value === "DANG_REVIEW") {
                newData.progress = 90;
            }

            if (value === "HOAN_THANH") {
                newData.progress = 100;
            }

            if (value === "QUA_HAN") {
                newData.progress = 0;
            }
        }

        setFormData(newData);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        const title = formData.title.trim();

        if (!title) {
            showMessage("Vui lòng nhập tên công việc");
            return;
        }

        if (
            formData.start_date &&
            formData.end_date &&
            new Date(formData.end_date) <
                new Date(formData.start_date)
        ) {
            showMessage(
                "Deadline không được trước ngày bắt đầu"
            );
            return;
        }

        const assignedTo = formData.assigned_to
            ? Number(formData.assigned_to)
            : null;

        if (
            assignedTo !== null &&
            (
                !Number.isInteger(assignedTo) ||
                assignedTo <= 0
            )
        ) {
            showMessage(
                "ID người phụ trách không hợp lệ"
            );
            return;
        }

        const progress = Math.min(
            100,
            Math.max(
                0,
                Number(formData.progress) || 0
            )
        );

        const data = {
            project_id: Number(projectId),
            title,
            description:
                formData.description.trim(),
            assigned_to: assignedTo,
            start_date:
                formData.start_date || null,
            end_date:
                formData.end_date || null,
            status:
                formData.status,
            priority:
                formData.priority,
            progress
        };

        const url = isEdit
            ? `${API_URL}/${task.id}`
            : API_URL;

        const method = isEdit
            ? "PUT"
            : "POST";

        setIsSubmitting(true);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const responseData =
                await parseResponse(response);

            if (!response.ok) {
                showMessage(
                    responseData.message ||
                    (isEdit
                        ? "Cập nhật công việc thất bại"
                        : "Thêm công việc thất bại")
                );

                return;
            }

            showMessage(
                responseData.message ||
                (isEdit
                    ? "Cập nhật công việc thành công"
                    : "Thêm công việc thành công")
            );

            setTimeout(async () => {
                setMessage("");

                if (onSuccess) {
                    await onSuccess();
                }

                if (onClose) {
                    onClose();
                }
            }, 700);
        } catch (error) {
            console.error(
                "Lỗi lưu công việc:",
                error
            );

            showMessage(
                "Không thể kết nối đến server"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!isEdit || !onDelete) {
            return;
        }

        onDelete(task);
    };

    return (
        <div className="task-modal-overlay">
            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <div className="task-modal">
                <h2>
                    {isEdit
                        ? "Cập nhật công việc"
                        : "Thêm công việc mới"}
                </h2>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="task-title">
                        Tên công việc
                    </label>

                    <input
                        id="task-title"
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="task-description">
                        Mô tả
                    </label>

                    <textarea
                        id="task-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />

                    <label htmlFor="task-assignee">
                        ID người phụ trách
                    </label>

                    <input
                        id="task-assignee"
                        type="number"
                        name="assigned_to"
                        min="1"
                        value={formData.assigned_to}
                        onChange={handleChange}
                        placeholder="Ví dụ: 2"
                    />

                    <div className="task-form-row">
                        <div>
                            <label htmlFor="task-start-date">
                                Ngày bắt đầu
                            </label>

                            <input
                                id="task-start-date"
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="task-end-date">
                                Deadline
                            </label>

                            <input
                                id="task-end-date"
                                type="date"
                                name="end_date"
                                min={
                                    formData.start_date ||
                                    undefined
                                }
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <label htmlFor="task-status">
                        Trạng thái
                    </label>

                    <select
                        id="task-status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
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

                    <label htmlFor="task-priority">
                        Độ ưu tiên
                    </label>

                    <select
                        id="task-priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
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

                    <label htmlFor="task-progress">
                        Tiến độ (%)
                    </label>

                    <input
                        id="task-progress"
                        type="number"
                        name="progress"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={handleChange}
                        disabled={
                            formData.status ===
                                "CHUA_LAM" ||
                            formData.status ===
                                "DANG_REVIEW" ||
                            formData.status ===
                                "HOAN_THANH" ||
                            formData.status ===
                                "QUA_HAN"
                        }
                    />

                    <div className="task-modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>

                        {isEdit && (
                            <button
                                type="button"
                                className="btn-delete"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                Xóa
                            </button>
                        )}

                        <button
                            type="submit"
                            className="btn-save"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Đang lưu..."
                                : isEdit
                                    ? "Cập nhật"
                                    : "Lưu công việc"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TaskModal;