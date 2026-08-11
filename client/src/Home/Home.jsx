import {
    useEffect,
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";
import "./Home.css";

const API_URL = "http://localhost:5000/api";

/* ── Activity icon by status ── */
function getActivityIcon(status) {
    switch (status) {
        case "HOAN_THANH":  return { emoji: "✅", cls: "done" };
        case "DANG_REVIEW": return { emoji: "👁️", cls: "review" };
        case "DANG_LAM":    return { emoji: "⚡", cls: "doing" };
        case "QUA_HAN":     return { emoji: "⏰", cls: "overdue" };
        default:            return { emoji: "📌", cls: "default" };
    }
}

/* ── Bar color class by status ── */
function getBarClass(key) {
    switch (key) {
        case "HOAN_THANH":  return "bar-done";
        case "DANG_LAM":    return "bar-doing";
        case "DANG_REVIEW": return "bar-review";
        case "CHUA_LAM":    return "bar-todo";
        case "QUA_HAN":     return "bar-overdue";
        default:            return "bar-todo";
    }
}

/* ── Task progress fill color ── */
function getTaskProgressColor(status) {
    switch (status) {
        case "HOAN_THANH":  return "linear-gradient(90deg,#16a34a,#22c55e)";
        case "DANG_LAM":    return "linear-gradient(90deg,#d97706,#f59e0b)";
        case "DANG_REVIEW": return "linear-gradient(90deg,#7c3aed,#a855f7)";
        case "QUA_HAN":     return "linear-gradient(90deg,#dc2626,#ef4444)";
        default:            return "linear-gradient(90deg,#1d4ed8,#3b82f6)";
    }
}

/* ── Donut chart segments (SVG) ── */
function DonutChart({ segments, size = 140 }) {
    const cx = size / 2;
    const cy = size / 2;
    const R  = (size - 24) / 2;
    const circumference = 2 * Math.PI * R;
    const total = segments.reduce((s, seg) => s + seg.value, 0);

    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
                <text x={cx} y={cy + 5} textAnchor="middle" fill="#3d5a78" fontSize="12">Trống</text>
            </svg>
        );
    }

    const arcs = [];
    let currentOffset = 0;
    for (const seg of segments) {
        const pct = seg.value / total;
        const dashLen = circumference * pct;
        const dashOffset = -currentOffset * circumference;
        currentOffset += pct;
        arcs.push({ ...seg, dashLen, dashOffset });
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="20" />
            {arcs.map((arc, i) => (
                <circle
                    key={i}
                    cx={cx} cy={cy} r={R}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="20"
                    strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
                    strokeDashoffset={arc.dashOffset}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
                />
            ))}
        </svg>
    );
}

function Home() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [tasks,    setTasks]    = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [message,  setMessage]  = useState("");

    const token = localStorage.getItem("token");

    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem("user")); } catch { /* ignore */ }

    const logoutAndRedirect = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const parseResponse = async (res) => {
        try { return await res.json(); } catch { return {}; }
    };

    const authFetch = async (url, opts = {}) => {
        const res = await fetch(url, {
            ...opts,
            headers: { Authorization: `Bearer ${token}`, ...opts.headers }
        });
        if (res.status === 401) { logoutAndRedirect(); throw new Error("Phiên đăng nhập đã hết hạn"); }
        return res;
    };

    const loadDashboard = async () => {
        if (!token) { navigate("/login", { replace: true }); return; }
        setLoading(true);
        setMessage("");
        try {
            const res  = await authFetch(`${API_URL}/home`);
            const data = await parseResponse(res);
            if (!res.ok) throw new Error(data.message || "Không thể tải dữ liệu");
            setProjects(Array.isArray(data.projects) ? data.projects : []);
            setTasks(Array.isArray(data.tasks)       ? data.tasks    : []);
        } catch (err) {
            if (err.message !== "Phiên đăng nhập đã hết hạn") setMessage(err.message || "Không thể kết nối");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboard(); }, []);

    /* ── Counts ── */

    /* ── Counts ── */
    const totalProjects  = projects.length;
    const totalTasks     = tasks.length;
    const doingTasks     = tasks.filter(t => t.status === "DANG_LAM").length;
    const reviewTasks    = tasks.filter(t => t.status === "DANG_REVIEW").length;
    const completedTasks = tasks.filter(t => t.status === "HOAN_THANH").length;
    const todoTasks      = tasks.filter(t => t.status === "CHUA_LAM").length;
    const overdueTasks   = tasks.filter(t => t.status === "QUA_HAN").length;
    const progressPct    = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    /* ── Average project progress ── */
    const averageProjectProgress = (() => {
        if (currentUser?.role === "MEMBER") {
            if (tasks.length === 0) return 0;
            return Math.round(tasks.reduce((s, t) => s + Number(t.progress || 0), 0) / tasks.length);
        }
        if (projects.length === 0) return 0;
        return Math.round(projects.reduce((s, p) => s + Number(p.progress || 0), 0) / projects.length);
    })();

    /* ── Donut segments ── */
    const donutSegments = [
        { label: "Hoàn thành", value: completedTasks, color: "#22c55e" },
        { label: "Đang làm",   value: doingTasks,     color: "#f59e0b" },
        { label: "Review",     value: reviewTasks,    color: "#a855f7" },
        { label: "Chưa làm",   value: todoTasks,      color: "#3b82f6" },
        { label: "Quá hạn",    value: overdueTasks,   color: "#ef4444" },
    ].filter(s => s.value > 0);

    /* ── Bar chart data ── */
    const statusCounts = [
        { key: "HOAN_THANH",  label: "Hoàn thành", value: completedTasks },
        { key: "DANG_LAM",    label: "Đang làm",   value: doingTasks },
        { key: "DANG_REVIEW", label: "Review",      value: reviewTasks },
        { key: "CHUA_LAM",    label: "Chưa làm",   value: todoTasks },
        { key: "QUA_HAN",     label: "Quá hạn",    value: overdueTasks }
    ];
    const largestStatusCount = Math.max(...statusCounts.map(i => i.value), 1);

    /* ── Kanban columns ── */
    const taskColumns = [
        { key: "CHUA_LAM",    title: "Cần làm" },
        { key: "DANG_LAM",    title: "Đang làm" },
        { key: "DANG_REVIEW", title: "Review" },
        { key: "HOAN_THANH",  title: "Hoàn thành" }
    ];
    const colColors = {
        CHUA_LAM:    "#3b82f6",
        DANG_LAM:    "#f59e0b",
        DANG_REVIEW: "#a855f7",
        HOAN_THANH:  "#22c55e"
    };

    /* ── Upcoming ── */
    const upcomingProjects = useMemo(() => {
        const now = new Date(); now.setHours(0,0,0,0);
        return [...projects]
            .filter(p => p.end_date && p.status !== "HOAN_THANH" && new Date(p.end_date) >= now)
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .slice(0, 5);
    }, [projects]);

    /* ── Overdue / bottleneck tasks (for attention list) ── */
    const attentionTasks = useMemo(() =>
        tasks.filter(t => t.status === "QUA_HAN" || t.status === "CHUA_LAM")
            .sort((a, b) => Number(a.id) - Number(b.id))
            .slice(0, 5),
        [tasks]
    );

    /* ── Recent activity ── */
    const recentTasks = useMemo(() =>
        [...tasks].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 6),
        [tasks]
    );

    const getActivityText = (task) => {
        const u = task.assignee_name || "Thành viên";
        if (task.status === "HOAN_THANH")  return <><strong>{u}</strong> đã hoàn thành <em>"{task.title}"</em></>;
        if (task.status === "DANG_REVIEW") return <><strong>{u}</strong> gửi review <em>"{task.title}"</em></>;
        if (task.status === "DANG_LAM")    return <><strong>{u}</strong> đang thực hiện <em>"{task.title}"</em></>;
        if (task.status === "QUA_HAN")     return <><em>"{task.title}"</em> đã <strong style={{color:"#f87171"}}>quá hạn</strong></>;
        return <><strong>{u}</strong> được giao <em>"{task.title}"</em></>;
    };

    const formatDate = d => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    const openProject = id => navigate(`/project/${id}`);

    /* ── Progress ring SVG ── */
    const R_ring = 72;
    const C_ring = 2 * Math.PI * R_ring;
    const ringFilled = C_ring * (averageProjectProgress / 100);

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" />
                <p>Đang tải tổng quan...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {message && <div className="toast-error">⚠️ {message}</div>}

            {/* ── Page Header ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tổng quan</h1>
                    {currentUser && (
                        <p className="page-subtitle">
                            Xin chào, <strong>{currentUser.full_name}</strong> 👋 — Đây là bức tranh toàn cảnh dự án của bạn.
                        </p>
                    )}
                </div>
                <button className="btn-refresh" onClick={loadDashboard} title="Làm mới dữ liệu">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    Làm mới
                </button>
            </div>

            {/* ── KPI Cards ── */}
            <section className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-icon">📁</div>
                    <div className="kpi-body">
                        <p>Tổng dự án</p>
                        <h2>{totalProjects}</h2>
                        <span className="kpi-trend neutral">Được phép xem</span>
                    </div>
                </div>

                <div className="kpi-card purple">
                    <div className="kpi-icon">✅</div>
                    <div className="kpi-body">
                        <p>Tổng công việc</p>
                        <h2>{totalTasks}</h2>
                        <span className="kpi-trend neutral">Hiện tại</span>
                    </div>
                </div>

                <div className="kpi-card yellow">
                    <div className="kpi-icon">⚡</div>
                    <div className="kpi-body">
                        <p>Đang thực hiện</p>
                        <h2>{doingTasks}</h2>
                        <span className="kpi-trend up">↑ {reviewTasks} review</span>
                    </div>
                </div>

                <div className="kpi-card green">
                    <div className="kpi-icon">🎯</div>
                    <div className="kpi-body">
                        <p>Hoàn thành</p>
                        <h2>{completedTasks}</h2>
                        <span className="kpi-trend up">{progressPct}% tổng tiến độ</span>
                    </div>
                </div>

                <div className="kpi-card red">
                    <div className="kpi-icon">⚠️</div>
                    <div className="kpi-body">
                        <p>Quá hạn</p>
                        <h2>{overdueTasks}</h2>
                        <span className={`kpi-trend ${overdueTasks > 0 ? "down" : "up"}`}>
                            {overdueTasks > 0 ? "↓ Cần xử lý ngay" : "✓ Tốt lắm!"}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Row 2: Donut + Bar + Activity ── */}
            <section className="analytics-grid">
                {/* Donut Chart */}
                <div className="card donut-card">
                    <h3 className="card-title">
                        <span>🍩</span> Phân bổ trạng thái
                    </h3>
                    <div className="donut-wrap">
                        <div className="donut-chart-area">
                            <DonutChart segments={donutSegments} size={140} />
                            <div className="donut-center">
                                <span className="donut-total">{totalTasks}</span>
                                <span className="donut-label">công việc</span>
                            </div>
                        </div>
                        <div className="donut-legend">
                            {[
                                { label: "Hoàn thành", value: completedTasks, color: "#22c55e" },
                                { label: "Đang làm",   value: doingTasks,     color: "#f59e0b" },
                                { label: "Review",     value: reviewTasks,    color: "#a855f7" },
                                { label: "Chưa làm",   value: todoTasks,      color: "#3b82f6" },
                                { label: "Quá hạn",    value: overdueTasks,   color: "#ef4444" },
                            ].map(item => (
                                <div key={item.label} className="legend-item">
                                    <span className="legend-dot" style={{ background: item.color }} />
                                    <span className="legend-label">{item.label}</span>
                                    <span className="legend-val">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="card bar-chart-card">
                    <h3 className="card-title">
                        <span>📊</span> Công việc theo trạng thái
                    </h3>
                    <div className="bars">
                        {statusCounts.map(item => {
                            const height = item.value === 0
                                ? 5
                                : Math.max(10, Math.round((item.value / largestStatusCount) * 100));
                            return (
                                <div key={item.key} className="bar-col-wrap">
                                    <b>{item.value}</b>
                                    <div className={`bar-column ${getBarClass(item.key)}`} style={{ height: `${height}%` }} />
                                    <p>{item.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="card activity-card">
                    <div className="card-header-row">
                        <h3 className="card-title" style={{ marginBottom: 0 }}>
                            <span>⚡</span> Hoạt động gần đây
                        </h3>
                        <span className="card-badge">{recentTasks.length}</span>
                    </div>
                    {recentTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: "24px 0" }}><p>Chưa có hoạt động nào</p></div>
                    ) : (
                        <ul className="activity-list">
                            {recentTasks.map(task => {
                                const icon = getActivityIcon(task.status);
                                return (
                                    <li key={task.id} onClick={() => openProject(task.project_id)}>
                                        <div className={`act-icon ${icon.cls}`}>{icon.emoji}</div>
                                        <div className="act-text">{getActivityText(task)}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </section>

            {/* ── Row 3: Progress Ring + Kanban Mini + Right panel ── */}
            <section className="bottom-grid">
                {/* Progress Ring */}
                <div className="card progress-ring-card">
                    <h3 className="card-title"><span>🔵</span> Tiến độ tổng thể</h3>
                    <div className="ring-wrap">
                        <div className="ring-container">
                            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                                <defs>
                                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#22c55e" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                                <circle cx="80" cy="80" r={R_ring} fill="none" stroke="rgba(37,99,235,0.08)" strokeWidth="14" />
                                <circle
                                    cx="80" cy="80" r={R_ring}
                                    fill="none"
                                    stroke="url(#ringGrad)"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                    strokeDasharray={`${ringFilled} ${C_ring - ringFilled}`}
                                    style={{ filter: "drop-shadow(0 0 12px rgba(37,99,235,0.45))", transition: "stroke-dasharray 1s ease" }}
                                />
                            </svg>
                            <div className="ring-inner">
                                <span className="ring-pct">{averageProjectProgress}%</span>
                                <span className="ring-sub">hoàn thành</span>
                            </div>
                        </div>
                        <p className="ring-desc">
                            {currentUser?.role === "MEMBER" ? "Tiến độ công việc của bạn" : "Tiến độ trung bình dự án"}
                        </p>
                    </div>
                </div>

                {/* Kanban Mini */}
                <div className="card kanban-mini-card">
                    <div className="card-header-row">
                        <h3 className="card-title" style={{ marginBottom: 0 }}>
                            <span>📋</span> Bảng Kanban
                        </h3>
                        <span className="card-badge">{tasks.length} task</span>
                    </div>
                    <div className="kanban-mini-board">
                        {taskColumns.map(col => {
                            const colTasks = tasks.filter(t => t.status === col.key).slice(0, 3);
                            return (
                                <div className="km-column" key={col.key}>
                                    <div className="km-col-header">
                                        <span className="km-dot" style={{ background: colColors[col.key] }} />
                                        <span className="km-title">{col.title}</span>
                                        <span className="km-count">{tasks.filter(t => t.status === col.key).length}</span>
                                    </div>
                                    {colTasks.length === 0 ? (
                                        <p className="km-empty">Trống</p>
                                    ) : (
                                        colTasks.map(task => (
                                            <div className="km-task" key={task.id} onClick={() => openProject(task.project_id)}>
                                                <b>{task.title}</b>
                                                <small>{task.project_name || "—"}</small>
                                                <div className="km-progress-bar">
                                                    <div className="km-progress-fill" style={{
                                                        width: `${Number(task.progress) || 0}%`,
                                                        background: getTaskProgressColor(task.status)
                                                    }} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="right-side-panel">
                    {/* Cần chú ý */}
                    <div className="card">
                        <h3 className="card-title"><span>🚨</span> Cần chú ý</h3>
                        {attentionTasks.length === 0 ? (
                            <p className="panel-empty">✓ Không có việc tắc nghẽn</p>
                        ) : (
                            attentionTasks.map(task => (
                                <div className="attention-item" key={task.id} onClick={() => openProject(task.project_id)}>
                                    <div className={`att-badge ${task.status === "QUA_HAN" ? "overdue" : "todo"}`}>
                                        {task.status === "QUA_HAN" ? "Quá hạn" : "Chưa làm"}
                                    </div>
                                    <div className="att-info">
                                        <b>{task.title}</b>
                                        <small>{task.project_name || "—"}</small>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sắp đến hạn */}
                    <div className="card">
                        <h3 className="card-title"><span>🗓️</span> Sắp đến hạn</h3>
                        {upcomingProjects.length === 0 ? (
                            <p className="panel-empty">Chưa có dự án sắp đến hạn</p>
                        ) : (
                            upcomingProjects.map((project, idx) => (
                                <div className="upcoming-row" key={project.id} onClick={() => openProject(project.id)}>
                                    <span className="up-dot" style={{ background: ["#3b82f6","#a855f7","#10b981","#f59e0b","#ef4444"][idx % 5] }} />
                                    <div className="up-info">
                                        <b>{project.name}</b>
                                        <small>📅 {formatDate(project.end_date)}</small>
                                    </div>
                                    <span className="up-pct">{Number(project.progress) || 0}%</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Tiến độ dự án */}
                    <div className="card">
                        <h3 className="card-title"><span>📈</span> Tiến độ dự án</h3>
                        {projects.length === 0 ? (
                            <p className="panel-empty">Chưa có dự án</p>
                        ) : (
                            projects.slice(0, 5).map(project => {
                                const pct = Math.min(100, Math.max(0, Number(project.progress) || 0));
                                return (
                                    <div className="proj-progress-row" key={project.id} onClick={() => openProject(project.id)}>
                                        <div className="proj-prog-top">
                                            <span>{project.name}</span>
                                            <b>{pct}%</b>
                                        </div>
                                        <div className="proj-prog-track">
                                            <div className="proj-prog-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;