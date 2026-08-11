import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./TaskDetailDrawer.css";

const API = "http://localhost:5000/api";

/* ── Helpers ── */
const token = () => localStorage.getItem("token");
const user  = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } };

const authFetch = async (url, opts = {}) => {
    const res = await fetch(url, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
            ...opts.headers
        }
    });
    return res;
};

const STATUS_MAP = {
    CHUA_LAM:    { label: "Chưa làm",   cls: "todo",    icon: "⭕" },
    DANG_LAM:    { label: "Đang làm",   cls: "doing",   icon: "⚡" },
    DANG_REVIEW: { label: "Đang review",cls: "review",  icon: "👁️" },
    HOAN_THANH:  { label: "Hoàn thành", cls: "done",    icon: "✅" },
    QUA_HAN:     { label: "Quá hạn",    cls: "overdue", icon: "⏰" }
};

const PRIORITY_MAP = {
    KHAN_CAP:   { label: "Khẩn cấp",  cls: "urgent", icon: "🔴" },
    CAO:        { label: "Cao",        cls: "high",   icon: "🟠" },
    TRUNG_BINH: { label: "Trung bình", cls: "medium", icon: "🟡" },
    THAP:       { label: "Thấp",       cls: "low",    icon: "🟢" }
};

const ROLE_LABEL = {
    ADMIN: "Quản trị viên", MANAGER: "Trưởng dự án", MEMBER: "Thành viên"
};

function formatDateTime(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}



function renderContent(text) {
    if (!text) return null;
    // Highlight @mentions
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
        part.startsWith("@")
            ? <span key={i} className="mention">{part}</span>
            : part
    );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function TaskDetailDrawer({ taskId, projectId, onClose, onSaved, onDeleted, members: propMembers }) {
    const currentUser = user();
    const role = currentUser?.role || "MEMBER";
    const canEdit = role === "ADMIN" || role === "MANAGER";

    /* ── State ── */
    const [detail,      setDetail]      = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [saving,      setSaving]      = useState(false);

    // Editable fields
    const [title,       setTitle]       = useState("");
    const [description, setDescription] = useState("");
    const [status,      setStatus]      = useState("CHUA_LAM");
    const [priority,    setPriority]    = useState("TRUNG_BINH");
    const [startDate,   setStartDate]   = useState("");
    const [endDate,     setEndDate]     = useState("");
    const [progress,    setProgress]    = useState(0);
    const [assignedTo,  setAssignedTo]  = useState("");
    const [estimatedH,  setEstimatedH]  = useState("");

    // Comments
    const [comments,    setComments]    = useState([]);
    const [commentText, setCommentText] = useState("");
    const [sendingCmt,  setSendingCmt]  = useState(false);

    // @Mention
    const [members,     setMembers]     = useState(propMembers || []);
    const [showMention, setShowMention] = useState(false);
    const [mentionQ,    setMentionQ]    = useState("");
    const [mentionIdx,  setMentionIdx]  = useState(0);

    // Checklist
    const [checklist,   setChecklist]   = useState([]);
    const [newItemText, setNewItemText] = useState("");

    // Time tracking
    const [timeLogs,    setTimeLogs]    = useState([]);
    const [logH,        setLogH]        = useState("");
    const [logNote,     setLogNote]     = useState("");

    // Activity log
    const [activities,       setActivities]       = useState([]);
    const [activitiesLoading,setActivitiesLoading]= useState(false);

    // Dependencies
    const [deps,         setDeps]         = useState([]);   // tasks task này phụ thuộc vào
    const [allTasks,     setAllTasks]     = useState([]);   // tasks cùng project (dropdown)
    const [addDepId,     setAddDepId]     = useState("");   // selected id trong dropdown
    const [depsLoading,  setDepsLoading]  = useState(false);

    const loadDeps = useCallback(async () => {
        if (!taskId) return;
        setDepsLoading(true);
        try {
            const res  = await authFetch(`${API}/automation/task/${taskId}/dependencies`);
            const data = await res.json();
            if (data.success) setDeps(data.dependencies || []);
        } catch { /* ignore */ } finally {
            setDepsLoading(false);
        }
    }, [taskId]);

    const loadAllTasks = useCallback(async () => {
        if (!taskId || !projectId) return;
        try {
            const res  = await authFetch(`${API}/automation/task/${taskId}/project-tasks?projectId=${projectId}`);
            const data = await res.json();
            if (data.success) setAllTasks(data.tasks || []);
        } catch { /* ignore */ }
    }, [taskId, projectId]);

    const handleAddDep = async () => {
        if (!addDepId) return;
        try {
            const res  = await authFetch(`${API}/automation/task/dependency`, {
                method: "POST",
                body:   JSON.stringify({ task_id: taskId, depends_on_task_id: addDepId })
            });
            if (res.ok) { setAddDepId(""); await loadDeps(); }
        } catch { /* ignore */ }
    };

    const handleRemoveDep = async (dependsOnId) => {
        try {
            const res = await authFetch(`${API}/automation/task/dependency`, {
                method: "DELETE",
                body:   JSON.stringify({ task_id: taskId, depends_on_task_id: dependsOnId })
            });
            if (res.ok) await loadDeps();
        } catch { /* ignore */ }
    };

    const loadActivities = useCallback(async () => {
        if (!taskId) return;
        setActivitiesLoading(true);
        try {
            const res  = await authFetch(`${API}/activities/task/${taskId}`);
            const data = await res.json();
            if (data.success) setActivities(data.activities || []);
        } catch { /* ignore */ } finally {
            setActivitiesLoading(false);
        }
    }, [taskId]);

    const commentTextareaRef = useRef(null);

    /* ── Load Detail ── */
    const loadDetail = useCallback(async () => {
        if (!taskId) return;
        setLoading(true);
        try {
            const res  = await authFetch(`${API}/task-detail/${taskId}`);
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message);

            const t = data.task;
            setDetail(data);
            setTitle(t.title || "");
            setDescription(t.description || "");
            setStatus(t.status || "CHUA_LAM");
            setPriority(t.priority || "TRUNG_BINH");
            setStartDate(t.start_date ? t.start_date.slice(0,10) : "");
            setEndDate(t.end_date   ? t.end_date.slice(0,10)   : "");
            setProgress(Number(t.progress) || 0);
            setAssignedTo(t.assigned_to || "");
            setEstimatedH(t.estimated_hours != null ? String(t.estimated_hours) : "");
            setComments(data.comments || []);
            setChecklist(data.checklist || []);
            setTimeLogs(data.time_logs || []);
        } catch (err) {
            console.error("Lỗi tải task detail:", err);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    /* ── Load members for @mention ── */
    const loadMembers = useCallback(async () => {
        if (!projectId || members.length > 0) return;
        try {
            const res  = await authFetch(`${API}/task-detail/project/${projectId}/members`);
            const data = await res.json();
            if (data.success) setMembers(data.members || []);
        } catch { /* ignore */ }
    }, [projectId, members.length]);

    useEffect(() => {
        loadDetail();
        loadMembers();
        loadActivities();
        loadDeps();
        loadAllTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    /* ── Handle status auto-progress ── */
    const handleStatusChange = (v) => {
        setStatus(v);
        if (v === "CHUA_LAM") setProgress(0);
        if (v === "DANG_REVIEW") setProgress(90);
        if (v === "HOAN_THANH") setProgress(100);
    };

    /* ── Save task ── */
    const handleSave = async () => {
        if (!canEdit) return;
        setSaving(true);
        try {
            const res = await authFetch(`${API}/tasks/${taskId}`, {
                method: "PUT",
                body: JSON.stringify({
                    project_id:  detail.task.project_id,
                    title:       title.trim(),
                    description: description.trim(),
                    assigned_to: assignedTo || null,
                    start_date:  startDate || null,
                    end_date:    endDate   || null,
                    status, priority, progress
                })
            });
            if (res.ok) {
                // Update estimated hours separately (graceful)
                if (estimatedH !== "") {
                    await authFetch(`${API}/task-detail/${taskId}/estimated-hours`, {
                        method: "PATCH",
                        body: JSON.stringify({ estimated_hours: Number(estimatedH) })
                    });
                }
                onSaved?.();
            }
        } catch (err) {
            console.error("Lỗi lưu task:", err);
        } finally {
            setSaving(false);
        }
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!canEdit || !window.confirm("Bạn có chắc muốn xóa công việc này không?")) return;
        try {
            const res = await authFetch(`${API}/tasks/${taskId}`, { method: "DELETE" });
            if (res.ok) { onDeleted?.(); onClose(); }
        } catch { /* ignore */ }
    };

    /* ── Comment: @Mention logic ── */
    const handleCommentChange = (e) => {
        const val = e.target.value;
        setCommentText(val);

        // Detect @ trigger
        const cursor = e.target.selectionStart;
        const beforeCursor = val.slice(0, cursor);
        const match = beforeCursor.match(/@(\w*)$/);
        if (match) {
            setMentionQ(match[1].toLowerCase());
            setShowMention(true);
            setMentionIdx(0);
        } else {
            setShowMention(false);
            setMentionQ("");
        }
    };

    const filteredMentions = members.filter(m =>
        m.full_name.toLowerCase().includes(mentionQ)
    ).slice(0, 6);

    const insertMention = (member) => {
        const cursor = commentTextareaRef.current?.selectionStart || commentText.length;
        const before = commentText.slice(0, cursor).replace(/@\w*$/, "");
        const after  = commentText.slice(cursor);
        const newText = `${before}@${member.full_name.replace(/\s+/g, "_")} ${after}`;
        setCommentText(newText);
        setShowMention(false);
        commentTextareaRef.current?.focus();
    };

    const handleCommentKeyDown = (e) => {
        if (showMention && filteredMentions.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setMentionIdx(i => Math.min(i+1, filteredMentions.length-1)); return; }
            if (e.key === "ArrowUp")   { e.preventDefault(); setMentionIdx(i => Math.max(i-1, 0)); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredMentions[mentionIdx]); return; }
            if (e.key === "Escape")    { setShowMention(false); return; }
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSendComment(); }
    };

    /* ── Send Comment ── */
    const handleSendComment = async () => {
        if (!commentText.trim() || sendingCmt) return;
        setSendingCmt(true);
        try {
            // Extract @mention user IDs
            const mentionNames = [...commentText.matchAll(/@(\S+)/g)].map(m => m[1].replace(/_/g, " "));
            const mentionIds = members
                .filter(m => mentionNames.some(n => m.full_name.toLowerCase() === n.toLowerCase()))
                .map(m => m.id);

            const res  = await authFetch(`${API}/task-detail/${taskId}/comments`, {
                method: "POST",
                body: JSON.stringify({ content: commentText.trim(), mentions: mentionIds.length ? mentionIds : null })
            });
            const data = await res.json();
            if (data.success) {
                setComments(prev => [...prev, data.comment]);
                setCommentText("");
                setShowMention(false);
            }
        } catch { /* ignore */ }
        setSendingCmt(false);
    };

    /* ── Delete Comment ── */
    const handleDeleteComment = async (cid) => {
        try {
            const res = await authFetch(`${API}/task-detail/comments/${cid}`, { method: "DELETE" });
            if ((await res.json()).success) {
                setComments(prev => prev.filter(c => c.id !== cid));
            }
        } catch { /* ignore */ }
    };

    /* ── Checklist ── */
    const handleAddChecklist = async () => {
        if (!newItemText.trim()) return;
        try {
            const res  = await authFetch(`${API}/task-detail/${taskId}/checklist`, {
                method: "POST",
                body: JSON.stringify({ title: newItemText.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setChecklist(prev => [...prev, data.item]);
                setNewItemText("");
            }
        } catch { /* ignore */ }
    };

    const handleToggleChecklist = async (item) => {
        try {
            const newDone = !item.is_done;
            const res = await authFetch(`${API}/task-detail/checklist/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify({ is_done: newDone })
            });
            if ((await res.json()).success) {
                setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, is_done: newDone } : c));
            }
        } catch { /* ignore */ }
    };

    const handleDeleteChecklist = async (id) => {
        try {
            const res = await authFetch(`${API}/task-detail/checklist/${id}`, { method: "DELETE" });
            if ((await res.json()).success) {
                setChecklist(prev => prev.filter(c => c.id !== id));
            }
        } catch { /* ignore */ }
    };

    /* ── Log Time ── */
    const handleLogTime = async () => {
        if (!logH || isNaN(logH) || Number(logH) <= 0) return;
        try {
            const res  = await authFetch(`${API}/task-detail/${taskId}/log-time`, {
                method: "POST",
                body: JSON.stringify({ hours: Number(logH), note: logNote.trim() || null })
            });
            const data = await res.json();
            if (data.success) {
                setTimeLogs(prev => [data.log, ...prev]);
                setLogH("");
                setLogNote("");
                // Refresh to get updated logged_hours
                loadDetail();
            }
        } catch { /* ignore */ }
    };

    /* ── Keyboard: close on Escape ── */
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    /* ── Computed ── */
    const doneItems     = checklist.filter(c => c.is_done).length;
    const totalItems    = checklist.length;
    const checkPct      = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);
    const totalLogged   = timeLogs.reduce((s, l) => s + Number(l.hours || 0), 0);
    const estH          = parseFloat(estimatedH) || 0;
    const logPct        = estH > 0 ? Math.min(100, Math.round((totalLogged / estH) * 100)) : 0;

    const statusInfo   = STATUS_MAP[status]   || STATUS_MAP.CHUA_LAM;
    const priorityInfo = PRIORITY_MAP[priority] || PRIORITY_MAP.TRUNG_BINH;

    const task = detail?.task;
    const isMine = task?.assigned_to === currentUser?.id;
    const canProgress = canEdit || isMine;

    /* ─────────── RENDER ─────────── */
    return createPortal(
        <>
            <div className="tdd-overlay" onClick={onClose} />
            <div className="tdd-panel">
                {/* ── Header ── */}
                <div className="tdd-header">
                    <div className="tdd-project-breadcrumb">
                        📁 <span>{task?.project_name || "Dự án"}</span>
                        {" / "}
                        <span style={{ color: "#7a9cbc" }}>Chi tiết công việc</span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div className="tdd-header-actions">
                        {canEdit && (
                            <>
                                <button className="tdd-btn-icon" onClick={handleSave} title="Lưu" disabled={saving}>
                                    {saving ? "⏳" : "💾"}
                                </button>
                                <button className="tdd-btn-icon danger" onClick={handleDelete} title="Xóa">🗑️</button>
                            </>
                        )}
                        <button className="tdd-btn-close" onClick={onClose} title="Đóng">✕</button>
                    </div>
                </div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="tdd-loading">
                        <div className="spinner" />
                        <span>Đang tải...</span>
                    </div>
                )}

                {/* ── Body: 65 / 35 ── */}
                {!loading && task && (
                    <div className="tdd-body">
                        {/* ══ LEFT PANEL ══ */}
                        <div className="tdd-left">
                            {/* Title */}
                            <textarea
                                className="tdd-task-title-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                disabled={!canEdit}
                                rows={2}
                                placeholder="Tên công việc..."
                            />

                            {/* Description */}
                            <div>
                                <div className="tdd-section-title">📝 Mô tả</div>
                                <div className="tdd-description-area">
                                    <textarea
                                        className="tdd-description-textarea"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        disabled={!canEdit}
                                        rows={4}
                                        placeholder="Thêm mô tả chi tiết cho công việc..."
                                    />
                                </div>
                            </div>

                            {/* Checklist */}
                            <div>
                                <div className="tdd-section-title">
                                    ☑️ Checklist
                                    {totalItems > 0 && (
                                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#5d7fa0" }}>
                                            {doneItems}/{totalItems}
                                        </span>
                                    )}
                                </div>

                                {totalItems > 0 && (
                                    <div className="tdd-checklist-progress">
                                        <span className="tdd-checklist-pct">{checkPct}%</span>
                                        <div className="tdd-checklist-track">
                                            <div className="tdd-checklist-fill" style={{ width: `${checkPct}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="tdd-checklist">
                                    {checklist.map(item => (
                                        <div key={item.id} className={`tdd-checklist-item${item.is_done ? " done" : ""}`}>
                                            <input
                                                type="checkbox"
                                                checked={!!item.is_done}
                                                onChange={() => handleToggleChecklist(item)}
                                            />
                                            <span className="tdd-checklist-item-text">{item.title}</span>
                                            <button className="tdd-checklist-item-del" onClick={() => handleDeleteChecklist(item.id)}>✕</button>
                                        </div>
                                    ))}

                                    <div className="tdd-add-checklist">
                                        <input
                                            type="text"
                                            placeholder="Thêm mục checklist..."
                                            value={newItemText}
                                            onChange={e => setNewItemText(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleAddChecklist()}
                                        />
                                        <button onClick={handleAddChecklist}>+ Thêm</button>
                                    </div>
                                </div>
                            </div>

                            {/* Time Tracking */}
                            <div>
                                <div className="tdd-section-title">⏱️ Theo dõi thời gian</div>
                                <div className="tdd-time-section">
                                    <div className="tdd-time-bars">
                                        <div className="tdd-time-row">
                                            <span className="tdd-time-label">Ước tính</span>
                                            <div className="tdd-time-track">
                                                <div className="tdd-time-fill estimated" style={{ width: estH > 0 ? "100%" : "0%" }} />
                                            </div>
                                            <span className="tdd-time-val">{estH > 0 ? `${estH}h` : "—"}</span>
                                        </div>
                                        <div className="tdd-time-row">
                                            <span className="tdd-time-label">Đã log</span>
                                            <div className="tdd-time-track">
                                                <div className="tdd-time-fill logged" style={{ width: estH > 0 ? `${logPct}%` : "0%" }} />
                                            </div>
                                            <span className="tdd-time-val">{totalLogged > 0 ? `${totalLogged.toFixed(1)}h` : "0h"}</span>
                                        </div>
                                    </div>

                                    <div className="tdd-log-form">
                                        <input
                                            type="number"
                                            min="0.5"
                                            step="0.5"
                                            placeholder="Giờ"
                                            value={logH}
                                            onChange={e => setLogH(e.target.value)}
                                        />
                                        <span>h</span>
                                        <input
                                            type="text"
                                            className="tdd-log-note"
                                            placeholder="Ghi chú (tùy chọn)"
                                            value={logNote}
                                            onChange={e => setLogNote(e.target.value)}
                                        />
                                        <button className="tdd-log-btn" onClick={handleLogTime}>Ghi nhận</button>
                                    </div>

                                    {timeLogs.length > 0 && (
                                        <div style={{ marginTop: 4 }}>
                                            {timeLogs.slice(0, 3).map(log => (
                                                <div key={log.id} style={{ fontSize: 11, color: "#5d7fa0", padding: "3px 4px", display:"flex", gap:6 }}>
                                                    <span style={{ color:"#22c55e", fontWeight:700 }}>+{log.hours}h</span>
                                                    <span>{log.logged_by_name || "—"}</span>
                                                    {log.note && <span>· {log.note}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="tdd-divider" />

                            {/* Activity Log */}
                            <div>
                                <div className="tdd-section-title">
                                    📝 Nhật ký hoạt động
                                    <button
                                        onClick={loadActivities}
                                        style={{ marginLeft:'auto', fontSize:11, background:'none', border:'none',
                                                 color:'#5d7fa0', cursor:'pointer', padding:'2px 6px' }}
                                    >
                                        ↻ Tải lại
                                    </button>
                                </div>

                                {activitiesLoading ? (
                                    <div style={{ color:'#5d7fa0', fontSize:12, padding:'8px 0' }}>Đang tải...</div>
                                ) : activities.length === 0 ? (
                                    <p className="tdd-empty">Chưa có hoạt động nào được ghi nhận.</p>
                                ) : (
                                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                                        {activities.map(act => (
                                            <div key={act.id} style={{
                                                display:'flex', gap:10, alignItems:'flex-start',
                                                fontSize:12, color:'#94a3b8'
                                            }}>
                                                <div style={{
                                                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                                                    background:'rgba(37,99,235,0.15)', display:'flex',
                                                    alignItems:'center', justifyContent:'center',
                                                    fontSize:11, fontWeight:700, color:'#3b82f6'
                                                }}>
                                                    {(act.user_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ color:'#cbd5e1', lineHeight:1.4 }}>
                                                        <strong style={{ color:'#94a3b8' }}>{act.user_name || 'Hệ thống'}</strong>
                                                        {' '}{act.content}
                                                    </div>
                                                    <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>
                                                        {formatDateTime(act.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Dependencies */}
                            <div className="tdd-divider" />
                            <div>
                                <div className="tdd-section-title">
                                    🔗 Phụ thuộc công việc
                                    {depsLoading && <span style={{ marginLeft:8, fontSize:11, color:'#5d7fa0' }}>Đang tải...</span>}
                                </div>

                                {deps.length === 0 ? (
                                    <p className="tdd-empty">Chưa có phụ thuộc. Công việc này không đợi task nào.</p>
                                ) : (
                                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:6 }}>
                                        {deps.map(dep => (
                                            <div key={dep.id} style={{
                                                display:'flex', alignItems:'center', gap:8,
                                                background:'rgba(99,102,241,0.06)', borderRadius:8,
                                                padding:'6px 10px', fontSize:13
                                            }}>
                                                <span style={{ fontSize:10, background:'rgba(99,102,241,0.15)', color:'#6366f1',
                                                               padding:'2px 8px', borderRadius:20, fontWeight:600, whiteSpace:'nowrap' }}>
                                                    {dep.status === 'HOAN_THANH' ? '✅ Xong' : '⏳ Chờ'}
                                                </span>
                                                <span style={{ flex:1, color:'#cbd5e1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                    {dep.title}
                                                </span>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleRemoveDep(dep.id)}
                                                        style={{ background:'none', border:'none', color:'#ef4444',
                                                                 cursor:'pointer', fontSize:14, padding:'0 4px' }}
                                                        title="Xóa phụ thuộc"
                                                    >✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {canEdit && allTasks.length > 0 && (
                                    <div style={{ display:'flex', gap:6, marginTop:10 }}>
                                        <select
                                            value={addDepId}
                                            onChange={e => setAddDepId(e.target.value)}
                                            style={{
                                                flex:1, padding:'6px 10px', borderRadius:8,
                                                border:'1.5px solid rgba(99,102,241,0.3)',
                                                background:'rgba(30,41,59,0.8)', color:'#cbd5e1',
                                                fontSize:13
                                            }}
                                        >
                                            <option value="">— Chọn task phụ thuộc —</option>
                                            {allTasks
                                                .filter(t => !deps.find(d => d.id === t.id))
                                                .map(t => (
                                                    <option key={t.id} value={t.id}>{t.title}</option>
                                                ))
                                            }
                                        </select>
                                        <button
                                            onClick={handleAddDep}
                                            disabled={!addDepId}
                                            style={{
                                                padding:'6px 14px', borderRadius:8, border:'none',
                                                background: addDepId ? '#6366f1' : '#334155',
                                                color:'#fff', fontSize:13, fontWeight:600, cursor: addDepId ? 'pointer' : 'not-allowed'
                                            }}
                                        >+ Thêm</button>
                                    </div>
                                )}
                            </div>

                            {/* Comments */}
                            <div>
                                <div className="tdd-section-title">
                                    💬 Thảo luận
                                    {comments.length > 0 && (
                                        <span style={{ marginLeft:"auto", fontSize:11, color:"#5d7fa0" }}>
                                            {comments.length} bình luận
                                        </span>
                                    )}
                                </div>

                                <div className="tdd-comments-list">
                                    {comments.length === 0 && (
                                        <p className="tdd-empty">Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</p>
                                    )}
                                    {comments.map(c => {
                                        const isOwn = c.user_id === currentUser?.id;
                                        return (
                                            <div key={c.id} className="tdd-comment">
                                                <div className="tdd-comment-avatar">
                                                    {(c.user_name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="tdd-comment-body">
                                                    <div className="tdd-comment-meta">
                                                        <span className="tdd-comment-author">{c.user_name || "Ẩn danh"}</span>
                                                        <span className="tdd-comment-time">{formatDateTime(c.created_at)}</span>
                                                        {(isOwn || role === "ADMIN") && (
                                                            <button className="tdd-comment-del-btn" onClick={() => handleDeleteComment(c.id)}>✕</button>
                                                        )}
                                                    </div>
                                                    <div className="tdd-comment-content">{renderContent(c.content)}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Comment input */}
                                <div className="tdd-comment-input-area">
                                    <div className="tdd-comment-avatar" style={{ marginTop: 4 }}>
                                        {(currentUser?.full_name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="tdd-comment-textarea-wrap">
                                        <textarea
                                            ref={commentTextareaRef}
                                            className="tdd-comment-textarea"
                                            placeholder='Thêm bình luận... (dùng @ để tag, Ctrl+Enter để gửi)'
                                            value={commentText}
                                            onChange={handleCommentChange}
                                            onKeyDown={handleCommentKeyDown}
                                            rows={2}
                                        />
                                        {/* @Mention Dropdown */}
                                        {showMention && filteredMentions.length > 0 && (
                                            <div className="tdd-mention-dropdown">
                                                {filteredMentions.map((m, i) => (
                                                    <div
                                                        key={m.id}
                                                        className={`tdd-mention-item${i === mentionIdx ? " active" : ""}`}
                                                        onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                                                    >
                                                        <div className="tdd-mention-avatar">{m.full_name.charAt(0)}</div>
                                                        <span className="tdd-mention-name">{m.full_name}</span>
                                                        <span className="tdd-mention-role">{ROLE_LABEL[m.role] || m.role}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="tdd-comment-send-btn"
                                        onClick={handleSendComment}
                                        disabled={!commentText.trim() || sendingCmt}
                                        title="Gửi bình luận (Ctrl+Enter)"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"/>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ══ RIGHT PANEL ══ */}
                        <div className="tdd-right">
                            {/* Status */}
                            <div className="tdd-field">
                                <span className="tdd-field-label">Trạng thái</span>
                                {canProgress ? (
                                    <select className="tdd-select" value={status} onChange={e => handleStatusChange(e.target.value)}>
                                        {Object.entries(STATUS_MAP).map(([k, v]) => (
                                            <option key={k} value={k}>{v.icon} {v.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className={`tdd-status-badge ${statusInfo.cls}`}>
                                        {statusInfo.icon} {statusInfo.label}
                                    </div>
                                )}
                            </div>

                            {/* Priority */}
                            <div className="tdd-field">
                                <span className="tdd-field-label">Độ ưu tiên</span>
                                {canEdit ? (
                                    <select className="tdd-select" value={priority} onChange={e => setPriority(e.target.value)}>
                                        {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                                            <option key={k} value={k}>{v.icon} {v.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className={`tdd-priority-badge ${priorityInfo.cls}`}>
                                        {priorityInfo.icon} {priorityInfo.label}
                                    </div>
                                )}
                            </div>

                            {/* Assignee */}
                            <div className="tdd-field">
                                <span className="tdd-field-label">Người phụ trách</span>
                                {task.assignee_name ? (
                                    <div className="tdd-assignee">
                                        <div className="tdd-assignee-avatar">{task.assignee_name.charAt(0)}</div>
                                        <div className="tdd-assignee-info">
                                            <div className="tdd-assignee-name">{task.assignee_name}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="tdd-unassigned">Chưa phân công</span>
                                )}
                                {canEdit && (
                                    <select className="tdd-select" style={{ marginTop: 6 }} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                                        <option value="">-- Không phân công --</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.full_name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="tdd-field">
                                <span className="tdd-field-label">Ngày bắt đầu</span>
                                <input type="date" className="tdd-date-input" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={!canEdit} />
                            </div>

                            <div className="tdd-field">
                                <span className="tdd-field-label">Deadline</span>
                                <input type="date" className="tdd-date-input" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!canEdit} min={startDate || undefined} />
                            </div>

                            {/* Progress */}
                            <div className="tdd-field">
                                <span className="tdd-field-label">Tiến độ</span>
                                <div className="tdd-progress-section">
                                    <div className="tdd-progress-header">
                                        <span className="tdd-progress-pct">{progress}%</span>
                                        <span style={{ fontSize:11, color:"#5d7fa0" }}>hoàn thành</span>
                                    </div>
                                    <div className="tdd-progress-track">
                                        <div className="tdd-progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                    {canProgress && (
                                        <input
                                            type="range"
                                            className="tdd-progress-input"
                                            min="0" max="100" step="5"
                                            value={progress}
                                            onChange={e => setProgress(Number(e.target.value))}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Estimated Hours */}
                            {canEdit && (
                                <div className="tdd-field">
                                    <span className="tdd-field-label">Giờ ước tính</span>
                                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                        <input
                                            type="number"
                                            className="tdd-date-input"
                                            style={{ width: 80 }}
                                            min="0" step="0.5"
                                            placeholder="0"
                                            value={estimatedH}
                                            onChange={e => setEstimatedH(e.target.value)}
                                        />
                                        <span style={{ fontSize:12, color:"#5d7fa0" }}>giờ</span>
                                    </div>
                                </div>
                            )}

                            <div className="tdd-divider" />

                            {/* Meta */}
                            <div className="tdd-field">
                                <span className="tdd-field-label">Dự án</span>
                                <span className="tdd-field-value">{task.project_name || "—"}</span>
                            </div>

                            <div className="tdd-field">
                                <span className="tdd-field-label">Tạo lúc</span>
                                <span className="tdd-field-value">{formatDateTime(task.created_at)}</span>
                            </div>

                            {canProgress && (
                                <button className="tdd-save-btn" onClick={handleSave} disabled={saving}>
                                    {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
                                </button>
                            )}

                            {canEdit && (
                                <button className="tdd-delete-btn" onClick={handleDelete}>🗑️ Xóa công việc</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}
