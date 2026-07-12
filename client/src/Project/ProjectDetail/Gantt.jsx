import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import "./Gantt.css";

function Gantt({
    tasks = [],
    onTaskClick
}) {
    const ganttRef = useRef(null);

    const getMonthKey = (date) => {
        const value = new Date(date);

        return `${value.getFullYear()}-${value.getMonth()}`;
    };

    const monthOptions = useMemo(() => {
        const values = tasks
            .filter(
                (task) =>
                    task.start_date &&
                    task.end_date
            )
            .flatMap((task) => {
                const start =
                    new Date(task.start_date);

                const end =
                    new Date(task.end_date);

                return [
                    getMonthKey(start),
                    getMonthKey(end)
                ];
            });

        return [...new Set(values)].sort(
            (first, second) => {
                const [firstYear, firstMonth] =
                    first.split("-").map(Number);

                const [secondYear, secondMonth] =
                    second.split("-").map(Number);

                return (
                    new Date(
                        firstYear,
                        firstMonth
                    ) -
                    new Date(
                        secondYear,
                        secondMonth
                    )
                );
            }
        );
    }, [tasks]);

    const currentMonthKey =
        getMonthKey(new Date());

    const [selectedMonthKey, setSelectedMonthKey] =
        useState(currentMonthKey);

    const [viewMode, setViewMode] =
        useState("MONTH");

    const [weekStartDay, setWeekStartDay] =
        useState(1);

    useEffect(() => {
        if (monthOptions.length === 0) {
            setSelectedMonthKey(
                currentMonthKey
            );

            return;
        }

        if (
            !monthOptions.includes(
                selectedMonthKey
            )
        ) {
            setSelectedMonthKey(
                monthOptions[0]
            );
        }
    }, [
        monthOptions,
        selectedMonthKey,
        currentMonthKey
    ]);

    const [
        selectedYear,
        selectedMonth
    ] = selectedMonthKey
        .split("-")
        .map(Number);

    const dayWidth =
        viewMode === "WEEK"
            ? 90
            : 36;

    const daysInMonth =
        new Date(
            selectedYear,
            selectedMonth + 1,
            0
        ).getDate();

    const safeWeekStartDay = Math.min(
        Math.max(1, weekStartDay),
        daysInMonth
    );

    const timelineStart =
        viewMode === "WEEK"
            ? new Date(
                selectedYear,
                selectedMonth,
                safeWeekStartDay
            )
            : new Date(
                selectedYear,
                selectedMonth,
                1
            );

    const timelineEnd =
        viewMode === "WEEK"
            ? new Date(
                selectedYear,
                selectedMonth,
                Math.min(
                    safeWeekStartDay + 6,
                    daysInMonth
                )
            )
            : new Date(
                selectedYear,
                selectedMonth,
                daysInMonth
            );

    const oneDay =
        1000 * 60 * 60 * 24;

    const totalDays =
        Math.floor(
            (timelineEnd - timelineStart) /
            oneDay
        ) + 1;

    const days = Array.from(
        { length: totalDays },
        (_, index) => {
            const day =
                new Date(timelineStart);

            day.setDate(
                timelineStart.getDate() +
                index
            );

            return day;
        }
    );

    const validTasks = tasks.filter(
        (task) => {
            if (
                !task.start_date ||
                !task.end_date
            ) {
                return false;
            }

            const start =
                new Date(task.start_date);

            const end =
                new Date(task.end_date);

            if (
                Number.isNaN(start.getTime()) ||
                Number.isNaN(end.getTime())
            ) {
                return false;
            }

            return (
                start <= timelineEnd &&
                end >= timelineStart
            );
        }
    );

    const formatDate = (date) => {
        if (!date) {
            return "Chưa có";
        }

        return new Date(
            date
        ).toLocaleDateString("vi-VN");
    };

    const getDay = (date) =>
        String(
            new Date(date).getDate()
        ).padStart(2, "0");

    const getDuration = (
        start,
        end
    ) => {
        const startDate =
            new Date(start);

        const endDate =
            new Date(end);

        return Math.max(
            1,
            Math.floor(
                (endDate - startDate) /
                oneDay
            ) + 1
        );
    };

    const getBarClass = (status) => {
        switch (status) {
            case "HOAN_THANH":
                return "gantt-green";

            case "DANG_LAM":
                return "gantt-blue";

            case "DANG_REVIEW":
                return "gantt-purple";

            case "QUA_HAN":
                return "gantt-red";

            default:
                return "gantt-orange";
        }
    };

    const handleToday = () => {
        const now = new Date();

        setSelectedMonthKey(
            getMonthKey(now)
        );

        if (viewMode === "WEEK") {
            const day = now.getDate();

            const start =
                day -
                ((day - 1) % 7);

            setWeekStartDay(start);
        }

        setTimeout(() => {
            if (ganttRef.current) {
                ganttRef.current.scrollLeft =
                    0;
            }
        }, 100);
    };

    const handleTaskClick = (task) => {
        if (
            typeof onTaskClick ===
            "function"
        ) {
            onTaskClick(task);
        }
    };

    const weekOptions = Array.from(
        {
            length: Math.ceil(
                daysInMonth / 7
            )
        },
        (_, index) => {
            const start =
                index * 7 + 1;

            const end =
                Math.min(
                    start + 6,
                    daysInMonth
                );

            return {
                start,
                end,
                label:
                    `Tuần ${index + 1}: ` +
                    `${start} - ${end}`
            };
        }
    );

    return (
        <div className="gantt-page">
            <div className="gantt-top">
                <div>
                    <div className="breadcrumb">
                        Dự án &gt; Gantt
                    </div>

                    <h2>Gantt Chart</h2>
                </div>

                <div className="gantt-filters">
                    <select
                        value={
                            selectedMonthKey
                        }
                        onChange={(event) => {
                            setSelectedMonthKey(
                                event.target.value
                            );

                            setWeekStartDay(1);
                        }}
                    >
                        {monthOptions.length ===
                        0 ? (
                            <option
                                value={
                                    currentMonthKey
                                }
                            >
                                Tháng{" "}
                                {selectedMonth + 1},{" "}
                                {selectedYear}
                            </option>
                        ) : (
                            monthOptions.map(
                                (item) => {
                                    const [
                                        year,
                                        month
                                    ] = item
                                        .split("-")
                                        .map(Number);

                                    return (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            Tháng{" "}
                                            {month + 1},{" "}
                                            {year}
                                        </option>
                                    );
                                }
                            )
                        )}
                    </select>

                    {viewMode === "WEEK" && (
                        <select
                            value={
                                safeWeekStartDay
                            }
                            onChange={(event) =>
                                setWeekStartDay(
                                    Number(
                                        event.target
                                            .value
                                    )
                                )
                            }
                        >
                            {weekOptions.map(
                                (week) => (
                                    <option
                                        key={
                                            week.start
                                        }
                                        value={
                                            week.start
                                        }
                                    >
                                        {
                                            week.label
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    )}

                    <button
                        type="button"
                        onClick={handleToday}
                    >
                        Hôm nay
                    </button>

                    <select
                        value={viewMode}
                        onChange={(event) => {
                            setViewMode(
                                event.target.value
                            );

                            setWeekStartDay(1);
                        }}
                    >
                        <option value="MONTH">
                            Tháng
                        </option>

                        <option value="WEEK">
                            Tuần
                        </option>
                    </select>
                </div>
            </div>

            {validTasks.length === 0 ? (
                <div className="detail-card tab-content">
                    <p>
                        Khoảng thời gian này chưa
                        có công việc nào.
                    </p>
                </div>
            ) : (
                <div className="gantt-box-fixed">
                    <div className="gantt-left-table">
                        <div className="gantt-left-head">
                            Công việc
                        </div>

                        <div className="gantt-left-head">
                            Bắt đầu
                        </div>

                        <div className="gantt-left-head">
                            Kết thúc
                        </div>

                        {validTasks.map(
                            (task, index) => (
                                <React.Fragment
                                    key={task.id}
                                >
                                    <div
                                        className="gantt-left-cell"
                                        onClick={() =>
                                            handleTaskClick(
                                                task
                                            )
                                        }
                                    >
                                        {index + 1}.{" "}
                                        {task.title}
                                    </div>

                                    <div className="gantt-left-cell gantt-center">
                                        {formatDate(
                                            task.start_date
                                        )}
                                    </div>

                                    <div className="gantt-left-cell gantt-center">
                                        {formatDate(
                                            task.end_date
                                        )}
                                    </div>
                                </React.Fragment>
                            )
                        )}
                    </div>

                    <div
                        className="gantt-right-scroll"
                        ref={ganttRef}
                    >
                        <div
                            className="gantt-right-grid"
                            style={{
                                width:
                                    `${totalDays * dayWidth}px`
                            }}
                        >
                            <div
                                className="gantt-days-row"
                                style={{
                                    gridTemplateColumns:
                                        `repeat(${totalDays}, ${dayWidth}px)`
                                }}
                            >
                                {days.map(
                                    (day, index) => (
                                        <div
                                            className="gantt-day-cell"
                                            key={
                                                `${day.toISOString()}-${index}`
                                            }
                                        >
                                            {getDay(day)}
                                        </div>
                                    )
                                )}
                            </div>

                            {validTasks.map(
                                (task) => {
                                    const taskStart =
                                        new Date(
                                            task.start_date
                                        );

                                    const taskEnd =
                                        new Date(
                                            task.end_date
                                        );

                                    const displayStart =
                                        taskStart <
                                        timelineStart
                                            ? timelineStart
                                            : taskStart;

                                    const displayEnd =
                                        taskEnd >
                                        timelineEnd
                                            ? timelineEnd
                                            : taskEnd;

                                    const offset =
                                        Math.floor(
                                            (
                                                displayStart -
                                                timelineStart
                                            ) / oneDay
                                        );

                                    const duration =
                                        getDuration(
                                            displayStart,
                                            displayEnd
                                        );

                                    const progress =
                                        Math.min(
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
                                            className="gantt-task-row"
                                            key={
                                                task.id
                                            }
                                            style={{
                                                gridTemplateColumns:
                                                    `repeat(${totalDays}, ${dayWidth}px)`
                                            }}
                                        >
                                            <div
                                                className={
                                                    `gantt-bar-new ` +
                                                    getBarClass(
                                                        task.status
                                                    )
                                                }
                                                style={{
                                                    gridColumn:
                                                        `${offset + 1} / span ${duration}`
                                                }}
                                                onClick={() =>
                                                    handleTaskClick(
                                                        task
                                                    )
                                                }
                                                title={
                                                    `${task.title} - ${progress}%`
                                                }
                                            >
                                                {progress}%
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Gantt;