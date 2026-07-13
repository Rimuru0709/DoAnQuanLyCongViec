import "./Kanban.css";

function Kanban({
    tasks = [],
    onTaskClick,
    onStatusChange
}) {
    const columns = [
        {
            key: "CHUA_LAM",
            title: "Chưa làm"
        },
        {
            key: "DANG_LAM",
            title: "Đang làm"
        },
        {
            key: "DANG_REVIEW",
            title: "Đang review"
        },
        {
            key: "HOAN_THANH",
            title: "Hoàn thành"
        },
        {
            key: "QUA_HAN",
            title: "Quá hạn"
        }
    ];

    const priorityText = {
        THAP: "Thấp",
        TRUNG_BINH: "Trung bình",
        CAO: "Cao"
    };

    const handleDragStart = (event, taskId) => {
        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData(
            "text/plain",
            String(taskId)
        );
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (event, newStatus) => {
        event.preventDefault();

        const taskId =
            event.dataTransfer.getData("text/plain");

        const task = tasks.find(
            (item) =>
                String(item.id) === String(taskId)
        );

        if (!task) {
            return;
        }

        if (task.status === newStatus) {
            return;
        }

        if (typeof onStatusChange !== "function") {
            return;
        }

        onStatusChange(task, newStatus);
    };

    const handleTaskClick = (task) => {
        if (typeof onTaskClick === "function") {
            onTaskClick(task);
        }
    };

    return (
        <div className="kanban-board">
            {columns.map((column) => {
                const columnTasks = tasks.filter(
                    (task) =>
                        task.status === column.key
                );

                return (
                    <div
                        className="kanban-column"
                        key={column.key}
                        onDragOver={handleDragOver}
                        onDrop={(event) =>
                            handleDrop(
                                event,
                                column.key
                            )
                        }
                    >
                        <div className="kanban-column-header">
                            <h3>{column.title}</h3>

                            <span>
                                {columnTasks.length}
                            </span>
                        </div>

                        <div className="kanban-column-content">
                            {columnTasks.length === 0 ? (
                                <div className="kanban-empty">
                                    Chưa có công việc
                                </div>
                            ) : (
                                columnTasks.map((task) => {
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
                                        <div
                                            key={task.id}
                                            className="kanban-card"
                                            draggable={
                                                typeof onStatusChange ===
                                                "function"
                                            }
                                            onDragStart={(event) =>
                                                handleDragStart(
                                                    event,
                                                    task.id
                                                )
                                            }
                                            onClick={() =>
                                                handleTaskClick(
                                                    task
                                                )
                                            }
                                        >
                                            <div className="kanban-card-top">
                                                <h4>
                                                    {task.title}
                                                </h4>
                                            </div>

                                            <p className="kanban-assignee">
                                                👤{" "}
                                                {task.assignee_name ||
                                                    "Chưa phân công"}
                                            </p>

                                            <div
                                                className={`priority-badge ${task.priority ||
                                                    "TRUNG_BINH"
                                                    }`}
                                            >
                                                {priorityText[
                                                    task.priority
                                                ] ||
                                                    "Trung bình"}
                                            </div>

                                            <div className="kanban-progress">
                                                <div className="kanban-progress-text">
                                                    <span>
                                                        Tiến độ
                                                    </span>

                                                    <b>
                                                        {progress}%
                                                    </b>
                                                </div>

                                                <div className="kanban-progress-line">
                                                    <div
                                                        style={{
                                                            width: `${progress}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="kanban-card-bottom">
                                                <span>
                                                    📅{" "}
                                                    {task.end_date
                                                        ? new Date(
                                                            task.end_date
                                                        ).toLocaleDateString(
                                                            "vi-VN"
                                                        )
                                                        : "Chưa có deadline"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default Kanban;