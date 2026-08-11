import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Task.css";

const API_URL = "http://localhost:5000/api/tasks";

function Task() {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [projectFilter, setProjectFilter] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const showMessage = (text) => {
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

    useEffect(() => {
        const loadTasks = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login", {
                    replace: true
                });

                return;
            }

            setLoading(true);

            try {
                const response = await fetch(API_URL, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    logoutAndRedirect();
                    return;
                }

                const data = await parseResponse(response);

                if (!response.ok) {
                    showMessage(
                        data.message ||
                        "Không thể tải danh sách công việc"
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
            } catch (error) {
                console.error(
                    "Lỗi tải công việc:",
                    error
                );

                showMessage(
                    "Không thể kết nối đến server"
                );
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const statusText = {
        CHUA_LAM: "Chưa làm",
        DANG_LAM: "Đang làm",
        DANG_REVIEW: "Đang review",
        HOAN_THANH: "Hoàn thành",
        QUA_HAN: "Quá hạn"
    };

    const formatDate = (date) => {
        if (!date) {
            return "Chưa có";
        }

        return new Date(date).toLocaleDateString(
            "vi-VN"
        );
    };

    const projects = [
        ...new Set(
            tasks
                .map((task) => task.project_name)
                .filter(Boolean)
        )
    ];

    const filteredTasks = tasks.filter((task) => {
        const keyword = search
            .trim()
            .toLowerCase();

        const title =
            task.title?.toLowerCase() || "";

        const projectName =
            task.project_name?.toLowerCase() || "";

        const assigneeName =
            task.assignee_name?.toLowerCase() || "";

        const matchSearch =
            title.includes(keyword) ||
            projectName.includes(keyword) ||
            assigneeName.includes(keyword);

        const matchStatus =
            statusFilter === "ALL" ||
            task.status === statusFilter;

        const matchProject =
            projectFilter === "ALL" ||
            task.project_name === projectFilter;

        return (
            matchSearch &&
            matchStatus &&
            matchProject
        );
    });

    const handleOpenProject = (task) => {
        if (!task.project_id) {
            return;
        }

        navigate(`/project/${task.project_id}`);
    };

    return (
        <div className="page-content">

            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <main className="main">
                <div className="task-main-header">
                    <div>
                        <h1>Công việc</h1>

                        <p>
                            Tổng hợp các công việc thuộc
                            tài khoản của bạn.
                        </p>
                    </div>
                </div>

                <div className="task-filter-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm công việc..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />

                    <select
                        value={projectFilter}
                        onChange={(event) =>
                            setProjectFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            Tất cả dự án
                        </option>

                        {projects.map((project) => (
                            <option
                                key={project}
                                value={project}
                            >
                                {project}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            Tất cả trạng thái
                        </option>

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
                </div>

                <div className="task-global-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Tên công việc</th>
                                <th>Dự án</th>
                                <th>Người làm</th>
                                <th>Deadline</th>
                                <th>Trạng thái</th>
                                <th>Tiến độ</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="task-empty"
                                    >
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="task-empty"
                                    >
                                        Chưa có công việc nào
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => {
                                    const progress = Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            Number(
                                                task.progress
                                            ) || 0
                                        )
                                    );

                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() =>
                                                handleOpenProject(
                                                    task
                                                )
                                            }
                                            style={{
                                                cursor:
                                                    task.project_id
                                                        ? "pointer"
                                                        : "default"
                                            }}
                                        >
                                            <td>
                                                {task.title}
                                            </td>

                                            <td>
                                                {task.project_name ||
                                                    "Không xác định"}
                                            </td>

                                            <td>
                                                {task.assignee_name ||
                                                    "Chưa phân công"}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    task.end_date
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`task-status ${task.status}`}
                                                >
                                                    {statusText[
                                                        task.status
                                                    ] ||
                                                        task.status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="task-progress">
                                                    <span>
                                                        {progress}%
                                                    </span>

                                                    <div>
                                                        <b
                                                            style={{
                                                                width: `${progress}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

export default Task;