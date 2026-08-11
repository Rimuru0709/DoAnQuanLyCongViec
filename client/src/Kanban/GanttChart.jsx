import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./GanttChart.css";

/* ─────────────────────────────────────────────────────────
   Constants & Helpers
───────────────────────────────────────────────────────── */

const STATUS_COLORS = {
    CHUA_LAM:    "#475569",
    DANG_LAM:    "#2563eb",
    DANG_REVIEW: "#d97706",
    HOAN_THANH:  "#16a34a",
    QUA_HAN:     "#dc2626"
};

const PRIORITY_BORDER = {
    THAP:       "#22c55e",
    TRUNG_BINH: "#eab308",
    CAO:        "#f97316",
    KHAN_CAP:   "#ef4444"
};

const STATUS_LABEL = {
    CHUA_LAM:    "Chưa làm",
    DANG_LAM:    "Đang làm",
    DANG_REVIEW: "Review",
    HOAN_THANH:  "Hoàn thành",
    QUA_HAN:     "Quá hạn"
};

const DAY_PX = { day: 28, week: 14, month: 5 };
const ROW_H   = 42;
const HEADER_H = 48;

function parseDate(d) {
    if (!d) return null;
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
}

function addDays(dt, n) {
    const d = new Date(dt);
    d.setDate(d.getDate() + n);
    return d;
}

function diffDays(a, b) {
    return Math.round((b - a) / 86400000);
}

function fmtDay(dt) {
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function fmtMonth(dt) {
    return dt.toLocaleDateString("vi-VN", { month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function GanttChart({ projectId, onTaskClick }) {
    const [tasks, setTasks]       = useState([]);
    const [deps, setDeps]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [zoom, setZoom]         = useState("week"); // day | week | month
    const scrollRef               = useRef(null);

    const dayPx = DAY_PX[zoom];

    /* ── Fetch data ── */
    useEffect(() => {
        if (!projectId) { setLoading(false); return; }
        setLoading(true);
        const token = localStorage.getItem("token");

        fetch(`http://localhost:5000/api/tasks/project/${projectId}/gantt`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                setTasks(data.tasks || []);
                setDeps(data.dependencies || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [projectId]);

    /* ── Compute date range ── */
    const { startDt, totalDays } = useMemo(() => {
        const dates = tasks
            .flatMap(t => [parseDate(t.start_date), parseDate(t.end_date)])
            .filter(Boolean);

        if (!dates.length) {
            const now = new Date(); now.setHours(0,0,0,0);
            return { startDt: addDays(now, -7), totalDays: 60 };
        }

        const min = new Date(Math.min(...dates));
        const max = new Date(Math.max(...dates));
        min.setDate(min.getDate() - 7);
        max.setDate(max.getDate() + 14);
        return { startDt: min, totalDays: diffDays(min, max) + 1 };
    }, [tasks]);

    const svgWidth  = totalDays * dayPx;
    const svgHeight = HEADER_H + tasks.length * ROW_H + 20;

    const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

    /* ── Scroll to today on mount ── */
    useEffect(() => {
        if (!scrollRef.current || !startDt) return;
        const todayOffset = diffDays(startDt, today) * dayPx;
        scrollRef.current.scrollLeft = Math.max(0, todayOffset - 200);
    }, [startDt, dayPx, today]);

    /* ── Build header columns ── */
    const headerCols = useMemo(() => {
        const cols = [];
        let cur = new Date(startDt);
        let prevMonth = -1;

        for (let i = 0; i < totalDays; i++) {
            const isMonthStart = cur.getMonth() !== prevMonth;
            cols.push({
                x: i * dayPx,
                date: new Date(cur),
                isMonthStart,
                label: zoom === "day"
                    ? cur.getDate().toString()
                    : zoom === "week"
                        ? (i % 7 === 0 ? fmtDay(cur) : "")
                        : (isMonthStart ? fmtMonth(cur) : "")
            });
            prevMonth = cur.getMonth();
            cur = addDays(cur, 1);
        }
        return cols;
    }, [startDt, totalDays, dayPx, zoom]);

    /* ── Task position helpers ── */
    const taskPos = useCallback((task, idx) => {
        const sd = parseDate(task.start_date);
        const ed = parseDate(task.end_date);
        if (!sd || !ed) return null;

        const x  = diffDays(startDt, sd) * dayPx;
        const w  = Math.max(dayPx, (diffDays(sd, ed) + 1) * dayPx);
        const y  = HEADER_H + idx * ROW_H + (ROW_H - 22) / 2;
        return { x, w, y };
    }, [startDt, dayPx]);

    /* ── Task ID → index map ── */
    const taskIdxMap = useMemo(() => {
        const m = {};
        tasks.forEach((t, i) => { m[t.id] = i; });
        return m;
    }, [tasks]);

    /* ── Build dependency paths ── */
    const depPaths = useMemo(() => {
        return deps.map(dep => {
            const fromIdx = taskIdxMap[dep.depends_on_task_id];
            const toIdx   = taskIdxMap[dep.task_id];
            if (fromIdx === undefined || toIdx === undefined) return null;

            const fromTask = tasks[fromIdx];
            const toTask   = tasks[toIdx];
            const fromPos  = taskPos(fromTask, fromIdx);
            const toPos    = taskPos(toTask, toIdx);
            if (!fromPos || !toPos) return null;

            const x1 = fromPos.x + fromPos.w;
            const y1 = fromPos.y + 11;
            const x2 = toPos.x;
            const y2 = toPos.y + 11;

            const midX = (x1 + x2) / 2;
            return `M ${x1} ${y1} C ${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`;
        }).filter(Boolean);
    }, [deps, tasks, taskPos, taskIdxMap]);

    const todayX = diffDays(startDt, today) * dayPx;

    if (loading) {
        return (
            <div className="gantt-wrapper">
                <div className="gantt-loading">
                    <div className="gantt-spinner" />
                    Đang tải dữ liệu Gantt...
                </div>
            </div>
        );
    }

    if (!tasks.length) {
        return (
            <div className="gantt-wrapper">
                <div className="gantt-empty">
                    <div className="gantt-empty-icon">📅</div>
                    <div className="gantt-empty-text">Không có công việc nào có ngày bắt đầu/kết thúc</div>
                </div>
            </div>
        );
    }

    return (
        <div className="gantt-wrapper">
            {/* ── Toolbar ── */}
            <div className="gantt-toolbar">
                <h3>📊 Gantt Chart</h3>

                <div className="gantt-zoom-btns">
                    {["day","week","month"].map(z => (
                        <button
                            key={z}
                            className={`gantt-zoom-btn ${zoom === z ? "active" : ""}`}
                            onClick={() => setZoom(z)}
                        >
                            {z === "day" ? "Ngày" : z === "week" ? "Tuần" : "Tháng"}
                        </button>
                    ))}
                </div>

                <div className="gantt-legend">
                    {Object.entries(STATUS_COLORS).map(([k, c]) => (
                        <div key={k} className="gantt-legend-item">
                            <div className="gantt-legend-dot" style={{ background: c }} />
                            <span>{STATUS_LABEL[k]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main layout ── */}
            <div className="gantt-container" style={{ height: svgHeight }}>

                {/* Left panel: task labels */}
                <div className="gantt-labels" style={{ height: svgHeight }}>
                    <div className="gantt-label-header">Tên công việc</div>
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="gantt-label-row"
                            onClick={() => onTaskClick?.(task.id)}
                            title={task.title}
                        >
                            <div
                                className="gantt-label-dot"
                                style={{ background: STATUS_COLORS[task.status] || "#475569" }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="gantt-label-text">{task.title}</div>
                                {task.assignee_name && (
                                    <div className="gantt-label-assignee">{task.assignee_name}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right panel: SVG chart */}
                <div className="gantt-chart-scroll" ref={scrollRef}>
                    <svg
                        className="gantt-svg"
                        width={svgWidth}
                        height={svgHeight}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Arrow marker definition */}
                        <defs>
                            <marker id="arrow" markerWidth="8" markerHeight="8"
                                refX="6" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L8,3 z" fill="rgba(148,163,184,0.5)" />
                            </marker>
                        </defs>

                        {/* Grid vertical lines */}
                        {headerCols.map((col, i) => (
                            (zoom === "day" || (zoom === "week" && i % 7 === 0) || col.isMonthStart) && (
                                <line
                                    key={i}
                                    className="gantt-grid-line"
                                    x1={col.x} y1={HEADER_H}
                                    x2={col.x} y2={svgHeight}
                                />
                            )
                        ))}

                        {/* Header background */}
                        <rect x={0} y={0} width={svgWidth} height={HEADER_H}
                            fill="rgba(255,255,255,0.03)" />
                        <line x1={0} y1={HEADER_H} x2={svgWidth} y2={HEADER_H}
                            stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

                        {/* Header date labels */}
                        {headerCols.map((col, i) => col.label && (
                            <text key={i}
                                className={col.isMonthStart ? "gantt-month-text" : "gantt-header-text"}
                                x={col.x + 4} y={col.isMonthStart ? 20 : 38}
                            >
                                {col.label}
                            </text>
                        ))}

                        {/* Row backgrounds + horizontal grid */}
                        {tasks.map((_, i) => (
                            <g key={i}>
                                <rect
                                    className="gantt-row-bg"
                                    x={0} y={HEADER_H + i * ROW_H}
                                    width={svgWidth} height={ROW_H}
                                />
                                <line
                                    x1={0} y1={HEADER_H + (i + 1) * ROW_H}
                                    x2={svgWidth} y2={HEADER_H + (i + 1) * ROW_H}
                                    stroke="rgba(255,255,255,0.04)" strokeWidth={1}
                                />
                            </g>
                        ))}

                        {/* Dependency arrows */}
                        {depPaths.map((path, i) => (
                            <path key={i} className="gantt-dep-arrow" d={path}
                                markerEnd="url(#arrow)" />
                        ))}

                        {/* Task bars */}
                        {tasks.map((task, i) => {
                            const pos = taskPos(task, i);
                            if (!pos) return null;
                            const { x, w, y } = pos;
                            const color  = STATUS_COLORS[task.status] || "#475569";
                            const pct    = Number(task.progress || 0) / 100;
                            const label  = task.title.length > Math.floor(w / 8)
                                ? task.title.slice(0, Math.floor(w / 8) - 1) + "…"
                                : task.title;

                            return (
                                <g key={task.id} onClick={() => onTaskClick?.(task.id)}
                                    style={{ cursor: "pointer" }}>
                                    {/* Background bar */}
                                    <rect
                                        className="gantt-bar"
                                        x={x} y={y} width={w} height={22}
                                        fill={color}
                                        style={{
                                            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
                                            strokeWidth: 1.5,
                                            stroke: PRIORITY_BORDER[task.priority] || "transparent"
                                        }}
                                    />
                                    {/* Progress overlay */}
                                    {pct > 0 && (
                                        <rect
                                            className="gantt-bar-progress"
                                            x={x} y={y}
                                            width={w * pct} height={22}
                                            fill="rgba(255,255,255,0.25)"
                                        />
                                    )}
                                    {/* Label */}
                                    {w > 30 && (
                                        <text
                                            className="gantt-bar-label"
                                            x={x + 6} y={y + 15}
                                        >
                                            {label}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Today vertical line */}
                        {todayX >= 0 && todayX <= svgWidth && (
                            <>
                                <line
                                    className="gantt-grid-line-today"
                                    x1={todayX} y1={0}
                                    x2={todayX} y2={svgHeight}
                                />
                                <text
                                    className="gantt-today-label"
                                    x={todayX + 3} y={12}
                                >
                                    Hôm nay
                                </text>
                            </>
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
}
