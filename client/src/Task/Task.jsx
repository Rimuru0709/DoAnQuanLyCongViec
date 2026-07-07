import { useEffect, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./Task.css";

function Task() {
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [projectFilter, setProjectFilter] = useState("ALL");

    useEffect(() => {
        fetch("http://localhost:5000/api/tasks")
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => console.log(err));
    }, []);

    const statusText = {
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

    const projects = [...new Set(tasks.map((task) => task.project_name))];

    const filteredTasks = tasks.filter((task) => {
        const keyword = search.toLowerCase();

        const matchSearch =
            task.title?.toLowerCase().includes(keyword) ||
            task.project_name?.toLowerCase().includes(keyword) ||
            task.assignee_name?.toLowerCase().includes(keyword);

        const matchStatus =
            statusFilter === "ALL" || task.status === statusFilter;

        const matchProject =
            projectFilter === "ALL" || task.project_name === projectFilter;

        return matchSearch && matchStatus && matchProject;
    });

    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <div className="task-main-header">
                    <div>
                        <h1>Công việc</h1>
                        <p>Tổng hợp tất cả công việc của các dự án.</p>
                    </div>
                </div>

                <div className="task-filter-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm công việc..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả dự án</option>
                        {projects.map((project) => (
                            <option key={project} value={project}>
                                {project}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="CHUA_LAM">Chưa làm</option>
                        <option value="DANG_LAM">Đang làm</option>
                        <option value="DANG_REVIEW">Đang review</option>
                        <option value="HOAN_THANH">Hoàn thành</option>
                        <option value="QUA_HAN">Quá hạn</option>
                    </select>
                </div>

                <div className="task-global-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Tên công việc</th>
                                <th>Dự án</th>
                                <th>Khách hàng</th>
                                <th>Người làm</th>
                                <th>Deadline</th>
                                <th>Trạng thái</th>
                                <th>Tiến độ</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="task-empty">
                                        Chưa có công việc nào
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>{task.title}</td>
                                        <td>{task.project_name}</td>
                                        <td>{task.customer || "Không có"}</td>
                                        <td>{task.assignee_name || "Chưa phân công"}</td>
                                        <td>{formatDate(task.end_date)}</td>
                                        <td>
                                            <span className={`task-status ${task.status}`}>
                                                {statusText[task.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="task-progress">
                                                <span>{task.progress || 0}%</span>
                                                <div>
                                                    <b
                                                        style={{
                                                            width: `${task.progress || 0}%`,
                                                        }}
                                                    ></b>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

export default Task;