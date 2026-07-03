import React, { useRef, useState } from "react";
import "./Gantt.css";

function Gantt({ tasks, onTaskClick }) {
    const today = new Date();
    const ganttRef = useRef(null);

    const getMonthKey = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${d.getMonth()}`;
    };

    const monthOptions = [
        ...new Set(
            tasks
                .filter((task) => task.start_date && task.end_date)
                .flatMap((task) => {
                    const start = new Date(task.start_date);
                    const end = new Date(task.end_date);

                    return [
                        `${start.getFullYear()}-${start.getMonth()}`,
                        `${end.getFullYear()}-${end.getMonth()}`
                    ];
                })
        ),
    ].sort((a, b) => {
        const [yearA, monthA] = a.split("-").map(Number);
        const [yearB, monthB] = b.split("-").map(Number);
        return new Date(yearA, monthA) - new Date(yearB, monthB);
    });

    const defaultMonthKey = monthOptions[0] || getMonthKey(today);

    const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);
    const [viewMode, setViewMode] = useState("MONTH");
    const [weekStartDay, setWeekStartDay] = useState(1);

    const [selectedYear, selectedMonth] = selectedMonthKey
        .split("-")
        .map(Number);

    const dayWidth = viewMode === "WEEK" ? 90 : 36;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const timelineStart =
        viewMode === "WEEK"
            ? new Date(selectedYear, selectedMonth, weekStartDay)
            : new Date(selectedYear, selectedMonth, 1);

    const timelineEnd =
        viewMode === "WEEK"
            ? new Date(
                  selectedYear,
                  selectedMonth,
                  Math.min(weekStartDay + 6, daysInMonth)
              )
            : new Date(selectedYear, selectedMonth, daysInMonth);

    const totalDays =
        Math.ceil((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24)) + 1;

    const days = Array.from({ length: totalDays }).map((_, index) => {
        const d = new Date(timelineStart);
        d.setDate(timelineStart.getDate() + index);
        return d;
    });

    const validTasks = tasks.filter((task) => {
        if (!task.start_date || !task.end_date) return false;

        const start = new Date(task.start_date);
        const end = new Date(task.end_date);

        return start <= timelineEnd && end >= timelineStart;
    });

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const getDay = (date) => {
        return new Date(date).getDate().toString().padStart(2, "0");
    };

    const getDuration = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
    };

    const getBarClass = (status) => {
        if (status === "HOAN_THANH") return "gantt-green";
        if (status === "DANG_LAM") return "gantt-blue";
        if (status === "DANG_REVIEW") return "gantt-purple";
        if (status === "QUA_HAN") return "gantt-red";
        return "gantt-orange";
    };

    const handleToday = () => {
        const now = new Date();
        setSelectedMonthKey(getMonthKey(now));

        if (viewMode === "WEEK") {
            const day = now.getDate();
            const start = day - ((day - 1) % 7);
            setWeekStartDay(start);
        }

        setTimeout(() => {
            if (ganttRef.current) {
                ganttRef.current.scrollLeft = 0;
            }
        }, 100);
    };

    return (
        <div className="gantt-page">
            <div className="gantt-top">
                <div>
                    <div className="breadcrumb">Dự án &gt; Gantt</div>
                    <h2>Gantt Chart</h2>
                </div>

                <div className="gantt-filters">
                    <select
                        value={selectedMonthKey}
                        onChange={(e) => {
                            setSelectedMonthKey(e.target.value);
                            setWeekStartDay(1);
                        }}
                    >
                        {monthOptions.map((item) => {
                            const [year, month] = item.split("-").map(Number);
                            return (
                                <option key={item} value={item}>
                                    Tháng {month + 1}, {year}
                                </option>
                            );
                        })}
                    </select>

                    {viewMode === "WEEK" && (
                        <select
                            value={weekStartDay}
                            onChange={(e) => setWeekStartDay(Number(e.target.value))}
                        >
                            {Array.from({
                                length: Math.ceil(daysInMonth / 7),
                            }).map((_, index) => {
                                const start = index * 7 + 1;
                                const end = Math.min(start + 6, daysInMonth);

                                return (
                                    <option key={start} value={start}>
                                        Tuần {index + 1}: {start} - {end}
                                    </option>
                                );
                            })}
                        </select>
                    )}

                    <button type="button" onClick={handleToday}>
                        Hôm nay
                    </button>

                    <select
                        value={viewMode}
                        onChange={(e) => {
                            setViewMode(e.target.value);
                            setWeekStartDay(1);
                        }}
                    >
                        <option value="MONTH">Tháng</option>
                        <option value="WEEK">Tuần</option>
                    </select>
                </div>
            </div>

            {validTasks.length === 0 ? (
                <div className="detail-card tab-content">
                    <p>Khoảng thời gian này chưa có công việc nào.</p>
                </div>
            ) : (
                <div className="gantt-box-fixed">
                    <div className="gantt-left-table">
                        <div className="gantt-left-head">Công việc</div>
                        <div className="gantt-left-head">Bắt đầu</div>
                        <div className="gantt-left-head">Kết thúc</div>

                        {validTasks.map((task, index) => (
                            <React.Fragment key={task.id}>
                                <div className="gantt-left-cell">
                                    {index + 1}. {task.title}
                                </div>

                                <div className="gantt-left-cell gantt-center">
                                    {formatDate(task.start_date)}
                                </div>

                                <div className="gantt-left-cell gantt-center">
                                    {formatDate(task.end_date)}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="gantt-right-scroll" ref={ganttRef}>
                        <div
                            className="gantt-right-grid"
                            style={{
                                width: `${totalDays * dayWidth}px`,
                            }}
                        >
                            <div
                                className="gantt-days-row"
                                style={{
                                    gridTemplateColumns: `repeat(${totalDays}, ${dayWidth}px)`,
                                }}
                            >
                                {days.map((day, index) => (
                                    <div className="gantt-day-cell" key={index}>
                                        {getDay(day)}
                                    </div>
                                ))}
                            </div>

                            {validTasks.map((task) => {
                                const taskStart = new Date(task.start_date);
                                const taskEnd = new Date(task.end_date);

                                const displayStart =
                                    taskStart < timelineStart
                                        ? timelineStart
                                        : taskStart;

                                const displayEnd =
                                    taskEnd > timelineEnd
                                        ? timelineEnd
                                        : taskEnd;

                                const offset =
                                    Math.ceil(
                                        (displayStart - timelineStart) /
                                            (1000 * 60 * 60 * 24)
                                    );

                                const duration = getDuration(displayStart, displayEnd);

                                return (
                                    <div
                                        className="gantt-task-row"
                                        key={task.id}
                                        style={{
                                            gridTemplateColumns: `repeat(${totalDays}, ${dayWidth}px)`,
                                        }}
                                    >
                                        <div
                                            className={`gantt-bar-new ${getBarClass(
                                                task.status
                                            )}`}
                                            style={{
                                                gridColumn: `${offset + 1} / span ${duration}`,
                                            }}
                                            onClick={() => onTaskClick(task)}
                                        >
                                            {task.progress}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Gantt;