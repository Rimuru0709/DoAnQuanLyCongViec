function Kanban({ tasks, onTaskClick, onStatusChange }) {
    const columns = [
        { key: "CHUA_LAM", title: "Chưa làm" },
        { key: "DANG_LAM", title: "Đang làm" },
        { key: "DANG_REVIEW", title: "Đang review" },
        { key: "HOAN_THANH", title: "Hoàn thành" },
    ];

    const priorityText = {
        THAP: "Thấp",
        TRUNG_BINH: "Trung bình",
        CAO: "Cao",
    };

    const handleDrop = (e, status) => {
        const taskId = e.dataTransfer.getData("taskId");
        const task = tasks.find((t) => String(t.id) === taskId);

        if (task && task.status !== status) {
            onStatusChange(task, status);
        }
    };

    return (
        <div className="kanban-board">
            {columns.map((column) => {
                const columnTasks = tasks.filter(
                    (task) => task.status === column.key
                );

                return (
                    <div
                        className="kanban-column"
                        key={column.key}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, column.key)}
                    >
                        <div className="kanban-column-header">
                            <h3>{column.title}</h3>
                            <span>{columnTasks.length}</span>
                        </div>

                        {columnTasks.map((task) => (
                            <div
                                key={task.id}
                                className="kanban-card"
                                draggable
                                onDragStart={(e) =>
                                    e.dataTransfer.setData("taskId", task.id)
                                }
                                onClick={() => onTaskClick(task)}
                            >
                                <div className="kanban-card-top">
                                    <h4>{task.title}</h4>
                                    <button type="button"></button>
                                </div>

                                <p className="kanban-assignee">
                                    👤 {task.assignee_name || "Chưa phân công"}
                                </p>

                                <div className={`priority-badge ${task.priority}`}>
                                    {priorityText[task.priority] || "Trung bình"}
                                </div>

                                <div className="kanban-progress">
                                    <div className="kanban-progress-text">
                                        <span>Tiến độ</span>
                                        <b>{task.progress}%</b>
                                    </div>

                                    <div className="kanban-progress-line">
                                        <div
                                            style={{
                                                width: `${task.progress}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="kanban-card-bottom">
                                    <span>
                                        📅{" "}
                                        {task.end_date
                                            ? new Date(task.end_date).toLocaleDateString("vi-VN")
                                            : "Chưa có deadline"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default Kanban;