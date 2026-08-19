import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TaskModal.css";

const API_URL = "http://localhost:5000/api/tasks";

function TaskModal({
    open,
    task,
    tasks = [],
    projectId,
    onClose,
    onSuccess,
    onDelete
}) {
    const navigate = useNavigate();
    const isEdit = Boolean(task);
    const currentUser = JSON.parse(
        localStorage.getItem("user")
    );

    const isAdmin =
        currentUser?.role === "ADMIN";

    const isManager =
        currentUser?.role === "MANAGER";

    const isMember =
        currentUser?.role === "MEMBER";

    const isTaskAssignee =
        Number(currentUser?.id) ===
        Number(task?.assigned_to);

    const canEditAll =
        isAdmin || isManager;

    const canEditProgress =
        isAdmin ||
        isManager ||
        (isMember && isTaskAssignee);

    const emptyTask = {
        title: "",
        customTitle: "",
        description: "",
        assigned_to: "",
        customAssignee: "",
        start_date: "",
        end_date: "",
        status: "CHUA_LAM",
        priority: "TRUNG_BINH",
        progress: 0
    };

    const [formData, setFormData] = useState(emptyTask);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [members, setMembers] = useState([]);
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [showAssigneeList, setShowAssigneeList] = useState(false);

    const loadProjectMembers = async () => {
        const token = localStorage.getItem("token");

        if (!token || !projectId) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/members/project/${projectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                setMembers([]);
                return;
            }

            setMembers(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.members)
                        ? data.members
                        : []
            );
        } catch (error) {
            console.error(
                "Lỗi tải thành viên dự án:",
                error
            );

            setMembers([]);
        }
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        loadProjectMembers();

        if (task) {
            setFormData({
                title: task.title || "",
                customTitle: "",
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

            setAssigneeSearch(
                task.assignee_name || ""
            );
        } else {
            setFormData(emptyTask);
            setAssigneeSearch("");
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

    const filteredMembers = members.filter(
        (member) =>
            member.full_name
                ?.toLowerCase()
                .includes(
                    assigneeSearch
                        .trim()
                        .toLowerCase()
                )
    );

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

        const title =
            formData.title === "KHAC"
                ? formData.customTitle.trim()
                : formData.title.trim();

        if (!title) {
            showMessage("Vui lòng chọn hoặc nhập tên công việc");
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

        /*
|--------------------------------------------------------------------------
| KIỂM TRA TRÙNG LỊCH CÔNG VIỆC
|--------------------------------------------------------------------------
*/

        if (
            formData.assigned_to &&
            formData.start_date &&
            formData.end_date
        ) {
            const newStart =
                new Date(formData.start_date);

            const newEnd =
                new Date(formData.end_date);

            const assignedUserId =
                Number(formData.assigned_to);

            const conflictTask =
                tasks.find((currentTask) => {

                    /*
                     * Khi sửa công việc:
                     * không so sánh task với chính nó.
                     */

                    if (
                        isEdit &&
                        Number(currentTask.id) ===
                        Number(task.id)
                    ) {
                        return false;
                    }

                    /*
                     * Chỉ kiểm tra công việc
                     * của cùng người phụ trách.
                     */

                    if (
                        Number(currentTask.assigned_to) !==
                        assignedUserId
                    ) {
                        return false;
                    }

                    /*
                     * Bỏ qua công việc không có đủ ngày.
                     */

                    if (
                        !currentTask.start_date ||
                        !currentTask.end_date
                    ) {
                        return false;
                    }

                    /*
                     * Có thể bỏ qua task đã hoàn thành.
                     * Nếu bạn vẫn muốn tính task hoàn thành,
                     * thì xóa đoạn này.
                     */

                    if (
                        currentTask.status === "HOAN_THANH"
                    ) {
                        return false;
                    }

                    const oldStart =
                        new Date(
                            currentTask.start_date
                        );

                    const oldEnd =
                        new Date(
                            currentTask.end_date
                        );

                    /*
                     * Hai khoảng thời gian bị trùng khi:
                     *
                     * newStart <= oldEnd
                     * &&
                     * newEnd >= oldStart
                     */

                    return (
                        newStart <= oldEnd &&
                        newEnd >= oldStart
                    );
                });

            if (conflictTask) {
                showMessage(
                    `Người phụ trách đã có công việc "${conflictTask.title}" trong khoảng thời gian này`
                );

                return;
            }
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

    const taskTitleOptions = [
        "Phân tích yêu cầu",
        "Thiết kế giao diện",
        "Thiết kế cơ sở dữ liệu",
        "Xây dựng Frontend",
        "Xây dựng Backend",
        "Xây dựng API",
        "Kiểm thử chức năng",
        "Sửa lỗi",
        "Viết tài liệu",
        "Triển khai hệ thống"
    ];

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

                    <select
                        id="task-title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        disabled={!canEditAll}
                    >
                        <option value="">
                            -- Chọn công việc --
                        </option>

                        {taskTitleOptions.map((title) => (
                            <option
                                key={title}
                                value={title}
                            >
                                {title}
                            </option>
                        ))}

                        <option value="KHAC">
                            Khác...
                        </option>
                    </select>

                    {formData.title === "KHAC" && (
                        <>
                            <label htmlFor="task-custom-title">
                                Tên công việc khác
                            </label>

                            <input
                                id="task-custom-title"
                                type="text"
                                name="customTitle"
                                value={formData.customTitle}
                                onChange={handleChange}
                                placeholder="Nhập tên công việc..."
                                required
                                disabled={!canEditAll}
                            />
                        </>
                    )}

                    <label htmlFor="task-assignee-search">
                        Người phụ trách
                    </label>

                    <div className="assignee-search-box">

                        <input
                            id="task-assignee-search"
                            type="text"
                            value={assigneeSearch}
                            placeholder="Nhập tên người phụ trách..."
                            disabled={!canEditAll}

                            onFocus={() =>
                                setShowAssigneeList(true)
                            }

                            onChange={(event) => {
                                setAssigneeSearch(
                                    event.target.value
                                );

                                setFormData({
                                    ...formData,
                                    assigned_to: ""
                                });

                                setShowAssigneeList(true);
                            }}
                        />

                        {showAssigneeList &&
                            assigneeSearch.trim() !== "" && (
                                <div className="assignee-dropdown">

                                    {filteredMembers.length === 0 ? (
                                        <div className="assignee-empty">
                                            Không tìm thấy thành viên
                                        </div>
                                    ) : (
                                        filteredMembers.map(
                                            (member) => (
                                                <div
                                                    key={member.id}
                                                    className="assignee-option"

                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            assigned_to:
                                                                member.id
                                                        });

                                                        setAssigneeSearch(
                                                            member.full_name
                                                        );

                                                        setShowAssigneeList(
                                                            false
                                                        );
                                                    }}
                                                >
                                                    <strong>
                                                        {member.full_name}
                                                    </strong>

                                                    {member.email && (
                                                        <small>
                                                            {member.email}
                                                        </small>
                                                    )}
                                                </div>
                                            )
                                        )
                                    )}

                                </div>
                            )}

                    </div>

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
                                disabled={!canEditAll}
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
                                disabled={!canEditAll}
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
                        disabled={!canEditProgress}
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
                        disabled={!canEditAll}
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
                            !canEditProgress ||
                            formData.status === "CHUA_LAM" ||
                            formData.status === "DANG_REVIEW" ||
                            formData.status === "HOAN_THANH" ||
                            formData.status === "QUA_HAN"
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

                        {isEdit && canEditAll && (
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