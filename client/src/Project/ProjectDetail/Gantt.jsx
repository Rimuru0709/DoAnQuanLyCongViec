import React, { useMemo, useRef, useState } from "react";
import "./Gantt.css";

const getMonthKey = (date) => {
    const value = new Date(date);
    return `${value.getFullYear()}-${value.getMonth()}`;
};

const ONE_DAY = 1000 * 60 * 60 * 24;

function Gantt({ tasks = [], onTaskClick }) {
    const ganttRef = useRef(null);

    // 1. SẮP XẾP DANH SÁCH CÔNG VIỆC THEO NGÀY BẮT ĐẦU TĂNG DẦN (TỪ SỚM NHẤT ĐẾN MUỘN NHẤT)
    const sortedAllTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            if (!a.start_date) return 1;
            if (!b.start_date) return -1;
            return new Date(a.start_date) - new Date(b.start_date);
        });
    }, [tasks]);

    // Hàm trả về Class màu dựa theo Trạng thái (được gom về một nơi để tái sử dụng)
    const getBarClass = (status) => {
        switch (status) {
            case "HOAN_THANH": return "gantt-green";
            case "DANG_LAM": return "gantt-blue";
            case "DANG_REVIEW": return "gantt-purple";
            case "QUA_HAN": return "gantt-red";
            default: return "gantt-orange";
        }
    };

    // Tính toán danh sách tháng từ sortedAllTasks
    const monthOptions = useMemo(() => {
        const values = sortedAllTasks
            .filter((task) => task.start_date && task.end_date)
            .flatMap((task) => [
                getMonthKey(task.start_date),
                getMonthKey(task.end_date)
            ]);

        return [...new Set(values)].sort((first, second) => {
            const [fYear, fMonth] = first.split("-").map(Number);
            const [sYear, sMonth] = second.split("-").map(Number);
            return new Date(fYear, fMonth) - new Date(sYear, sMonth);
        });
    }, [sortedAllTasks]);

    const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);

    const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
    const [viewMode, setViewMode] = useState("MONTH");
    const [weekStartDay, setWeekStartDay] = useState(1);

    // Xác định monthKey thực tế dựa trên việc check monthOptions có hợp lệ không
    const actualMonthKey = useMemo(() => {
        if (monthOptions.length === 0) return currentMonthKey;
        if (!monthOptions.includes(selectedMonthKey)) return monthOptions[0];
        return selectedMonthKey;
    }, [monthOptions, selectedMonthKey, currentMonthKey]);

    const [selectedYear, selectedMonth] = actualMonthKey.split("-").map(Number);

    const dayWidth = viewMode === "WEEK" ? 90 : 36;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const safeWeekStartDay = Math.min(Math.max(1, weekStartDay), daysInMonth);

    // Bọc timelineStart và timelineEnd vào useMemo độc lập
    const timelineStart = useMemo(() => {
        return viewMode === "WEEK"
            ? new Date(selectedYear, selectedMonth, safeWeekStartDay)
            : new Date(selectedYear, selectedMonth, 1);
    }, [viewMode, selectedYear, selectedMonth, safeWeekStartDay]);

    const timelineEnd = useMemo(() => {
        return viewMode === "WEEK"
            ? new Date(selectedYear, selectedMonth, Math.min(safeWeekStartDay + 6, daysInMonth))
            : new Date(selectedYear, selectedMonth, daysInMonth);
    }, [viewMode, selectedYear, selectedMonth, safeWeekStartDay, daysInMonth]);

    const totalDays = Math.round((timelineEnd - timelineStart) / ONE_DAY) + 1;

    const days = useMemo(() => {
        return Array.from({ length: totalDays }, (_, index) => {
            const day = new Date(timelineStart);
            day.setDate(timelineStart.getDate() + index);
            return day;
        });
    }, [timelineStart, totalDays]);

    // 2. LỌC CÁC CÔNG VIỆC TRONG KHUNG NHÌN (Sử dụng sortedAllTasks đã sắp xếp đúng thứ tự)
    const validTasks = useMemo(() => {
        return sortedAllTasks.filter((task) => {
            if (!task.start_date || !task.end_date) return false;

            const start = new Date(task.start_date);
            const end = new Date(task.end_date);

            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                return false;
            }

            return start <= timelineEnd && end >= timelineStart;
        });
    }, [sortedAllTasks, timelineStart, timelineEnd]);

    // TÍNH TOÁN ĐƯỜNG KẺ "TODAY LINE" (ĐÚNG THEO NGÀY HIỆN TẠI)
    const todayLineOffset = useMemo(() => {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfTimeline = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());

        if (startOfToday >= startOfTimeline && startOfToday <= timelineEnd) {
            return Math.round((startOfToday - startOfTimeline) / ONE_DAY);
        }
        return -1;
    }, [timelineStart, timelineEnd]);

    // 3. TỰ ĐỘNG LỌC VÀ CHUẨN HÓA CÁC MỐC TIẾN ĐỘ (ĐỒNG BỘ MÀU TASK)
    const milestones = useMemo(() => {
        if (sortedAllTasks.length === 0) return [];

        const validMilestones = sortedAllTasks.filter((t) => t.start_date && t.end_date);
        if (validMilestones.length === 0) return [];

        const list = [];

        // Mốc 1: Bắt đầu dự án (Lấy theo ngày bắt đầu của task đầu tiên)
        // Đồng bộ màu sắc bằng class của chính task đầu tiên này
        list.push({
            date: validMilestones[0].start_date,
            label: "Bắt đầu dự án",
            icon: "▶",
            className: `gantt-ms-start ${getBarClass(validMilestones[0].status)}`
        });

        // Mốc 2: Hoàn thành từng task thành phần
        const seenDates = new Set();
        validMilestones.forEach((task, index) => {
            const isLast = index === validMilestones.length - 1;
            const dateStr = new Date(task.end_date).toDateString();

            if (!isLast && !seenDates.has(dateStr)) {
                seenDates.add(dateStr);
                list.push({
                    date: task.end_date,
                    label: `Hoàn thành ${task.title}`,
                    icon: "✓",
                    className: getBarClass(task.status) // Đồng bộ class màu động từ task.status
                });
            }
        });

        // Mốc 3: Triển khai dự án (Ngày kết thúc của task cuối cùng)
        const lastTask = validMilestones[validMilestones.length - 1];
        list.push({
            date: lastTask.end_date,
            label: "Triển khai dự án",
            icon: "⚑",
            className: `gantt-ms-end ${getBarClass(lastTask.status)}` // Đồng bộ class màu của task cuối
        });

        return list;
    }, [sortedAllTasks]);

    const formatDate = (date) => {
        if (!date) return "Chưa có";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const getDayLabel = (date) => String(new Date(date).getDate()).padStart(2, "0");

    const getDuration = (start, end) => {
        return Math.max(1, Math.round((new Date(end) - new Date(start)) / ONE_DAY) + 1);
    };

    const handleToday = () => {
        const now = new Date();
        setSelectedMonthKey(getMonthKey(now));
        if (viewMode === "WEEK") {
            setWeekStartDay(now.getDate() - ((now.getDate() - 1) % 7));
        }
        setTimeout(() => {
            if (ganttRef.current && todayLineOffset !== -1) {
                ganttRef.current.scrollLeft = (todayLineOffset * dayWidth) - 150;
            }
        }, 100);
    };

    return (
        <div className="gantt-page">
            {/* Top Filter Panel */}
            <div className="gantt-top">
                <div>
                    <div className="breadcrumb">Dự án &gt; Website bán hàng &gt; Gantt</div>
                    <h2>Gantt Chart</h2>
                </div>
                <div className="gantt-filters">
                    <select
                        value={actualMonthKey}
                        onChange={(e) => {
                            setSelectedMonthKey(e.target.value);
                            setWeekStartDay(1);
                        }}
                    >
                        {monthOptions.length === 0 ? (
                            <option value={currentMonthKey}>
                                Tháng {selectedMonth + 1}, {selectedYear}
                            </option>
                        ) : (
                            monthOptions.map((item) => {
                                const [year, month] = item.split("-").map(Number);
                                return (
                                    <option key={item} value={item}>
                                        Tháng {month + 1}, {year}
                                    </option>
                                );
                            })
                        )}
                    </select>
                    {viewMode === "WEEK" && (
                        <select
                            value={safeWeekStartDay}
                            onChange={(e) => setWeekStartDay(Number(e.target.value))}
                        >
                            {Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, i) => ({
                                start: i * 7 + 1,
                                end: Math.min(i * 7 + 7, daysInMonth)
                            })).map((w) => (
                                <option key={w.start} value={w.start}>
                                    {`Tuần: ${w.start} - ${w.end}`}
                                </option>
                            ))}
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

            {/* Main Gantt Chart */}
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
                                <div className="gantt-left-cell" onClick={() => onTaskClick?.(task)}>
                                    {index + 1}. {task.title}
                                </div>
                                <div className="gantt-left-cell gantt-center">
                                    {formatDate(task.start_date).substring(0, 5)}
                                </div>
                                <div className="gantt-left-cell gantt-center">
                                    {formatDate(task.end_date).substring(0, 5)}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="gantt-right-scroll" ref={ganttRef}>
                        <div className="gantt-right-grid" style={{ width: `${totalDays * dayWidth}px` }}>
                            {/* ĐƯỜNG KẺ ĐỨT TODAY LINE ĐỎ XUYÊN GRID */}
                            {todayLineOffset !== -1 && (
                                <div
                                    className="gantt-today-line-dotted"
                                    style={{ left: `${todayLineOffset * dayWidth + dayWidth / 2}px` }}
                                />
                            )}

                            <div
                                className="gantt-days-row"
                                style={{ gridTemplateColumns: `repeat(${totalDays}, ${dayWidth}px)` }}
                            >
                                {days.map((day, index) => (
                                    <div className="gantt-day-cell" key={`${day.toISOString()}-${index}`}>
                                        {getDayLabel(day)}
                                    </div>
                                ))}
                            </div>

                            {validTasks.map((task) => {
                                const taskStart = new Date(task.start_date);
                                const taskEnd = new Date(task.end_date);
                                const displayStart = taskStart < timelineStart ? timelineStart : taskStart;
                                const displayEnd = taskEnd > timelineEnd ? timelineEnd : taskEnd;
                                const offset = Math.round((displayStart - timelineStart) / ONE_DAY);
                                const duration = getDuration(displayStart, displayEnd);
                                const progress = Math.min(100, Math.max(0, Number(task.progress) || 0));

                                return (
                                    <div
                                        className="gantt-task-row"
                                        key={task.id}
                                        style={{ gridTemplateColumns: `repeat(${totalDays}, ${dayWidth}px)` }}
                                    >
                                        <div
                                            className={`gantt-bar-new ${getBarClass(task.status)}`}
                                            style={{ gridColumn: `${offset + 1} / span ${duration}` }}
                                            onClick={() => onTaskClick?.(task)}
                                        >
                                            {progress}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* BLOCK TIMELINE TIẾN ĐỘ PHÍA DƯỚI */}
            {milestones.length > 0 && (
                <div className="gantt-milestones-panel">
                    <h3 className="milestones-title">Timeline tiến độ</h3>
                    <div className="milestones-track-container">
                        <div className="milestones-line-bg" />
                        <div className="milestones-list">
                            {milestones.map((ms, index) => (
                                <div className="milestone-node" key={index}>
                                    {/* ms.className ở đây đã chứa cả "gantt-green", "gantt-blue" tương thích CSS với Gantt Chart */}
                                    <div className={`milestone-circle ${ms.className}`}>
                                        {ms.icon}
                                    </div>
                                    <div className="milestone-date">{formatDate(ms.date)}</div>
                                    <div className="milestone-label">{ms.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Gantt;