import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBolt, FaPlus, FaToggleOn, FaTrash } from "react-icons/fa";
import { apiFetch } from "../services/api";
import "./Automation.css";

/* ── Mapping hiển thị ── */
const TRIGGER_LABELS = {
    STATUS_CHANGE:   "Khi thay đổi trạng thái",
    DEADLINE_PASSED: "Khi quá hạn deadline",
    TASK_CREATED:    "Khi tạo công việc mới",
    TASK_ASSIGNED:   "Khi giao công việc"
};

const ACTION_LABELS = {
    SET_COMPLETED_AT: "Ghi thời gian hoàn thành",
    NOTIFY_ASSIGNEE:  "Thông báo người được giao",
    NOTIFY_MANAGER:   "Thông báo quản lý",
    SET_PRIORITY:     "Đặt mức ưu tiên"
};

const STATUS_LABELS = {
    CHUA_LAM:   "Chưa làm",
    DANG_LAM:   "Đang làm",
    DANG_REVIEW:"Đang review",
    HOAN_THANH: "Hoàn thành",
    QUA_HAN:    "Quá hạn"
};

const RULE_ICONS = {
    STATUS_CHANGE:   "🔄",
    DEADLINE_PASSED: "⏰",
    TASK_CREATED:    "✨",
    TASK_ASSIGNED:   "👤"
};

const INIT_FORM = {
    name:            "",
    trigger_event:   "STATUS_CHANGE",
    condition_field: "status",
    condition_value: "HOAN_THANH",
    action_type:     "SET_COMPLETED_AT",
    action_value:    "NOW"
};

export default function Automation() {
    const [projects, setProjects]   = useState([]);
    const [projectId, setProjectId] = useState("all");
    const [rules, setRules]         = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm]           = useState(INIT_FORM);
    const [saving, setSaving]       = useState(false);

    /* ── Lấy danh sách dự án ── */
    useEffect(() => {
        apiFetch("/projects").then(data => {
            const list = Array.isArray(data) ? data : (data?.projects || []);
            setProjects(list);
            if (list.length > 0 && projectId === "all") setProjectId(String(list[0].id));
        }).catch(() => {});
    }, []);

    /* ── Tải rules khi chọn project ── */
    const loadRules = useCallback(async () => {
        if (!projectId || projectId === "all") { setRules([]); return; }
        setLoading(true);
        setError("");
        try {
            const data = await apiFetch(`/automation/${projectId}`);
            setRules(Array.isArray(data?.rules) ? data.rules : []);
        } catch (e) {
            setError(e.message || "Không thể tải quy tắc");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { loadRules(); }, [loadRules]);

    /* ── Stats ── */
    const stats = useMemo(() => ({
        total:    rules.length,
        active:   rules.filter(r => r.is_active).length,
        inactive: rules.filter(r => !r.is_active).length
    }), [rules]);

    /* ── Toggle on/off ── */
    const handleToggle = async (rule) => {
        const next = !rule.is_active;
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: next } : r));
        try {
            await apiFetch(`/automation/${rule.id}/toggle`, {
                method: "PATCH",
                body:   JSON.stringify({ is_active: next })
            });
        } catch {
            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: rule.is_active } : r));
        }
    };

    /* ── Xóa rule ── */
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa quy tắc này?")) return;
        try {
            await apiFetch(`/automation/${id}`, { method: "DELETE" });
            setRules(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            alert(e.message || "Không thể xóa quy tắc");
        }
    };

    /* ── Tạo rule mới ── */
    const handleSave = async () => {
        if (!form.name.trim()) { alert("Vui lòng nhập tên quy tắc"); return; }
        setSaving(true);
        try {
            await apiFetch("/automation", {
                method: "POST",
                body:   JSON.stringify({ ...form, project_id: projectId })
            });
            setShowModal(false);
            setForm(INIT_FORM);
            await loadRules();
        } catch (e) {
            alert(e.message || "Không thể tạo quy tắc");
        } finally {
            setSaving(false);
        }
    };

    const currentUser = (() => {
        try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    })();
    const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

    return (
        <div className="page-content">
            <main className="automation-page">

                {/* ── Header ── */}
                <div className="automation-header">
                    <div>
                        <h1>⚡ Tự động hóa</h1>
                        <p>Cấu hình các quy tắc tự động để tiết kiệm thời gian và tăng hiệu suất.</p>
                    </div>
                    {canEdit && projectId !== "all" && (
                        <button className="btn-add-rule" onClick={() => setShowModal(true)}>
                            <FaPlus /> Thêm quy tắc
                        </button>
                    )}
                </div>

                {/* ── Toolbar ── */}
                <div className="automation-toolbar">
                    <select value={projectId} onChange={e => setProjectId(e.target.value)}>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* ── Stats ── */}
                <div className="automation-stats">
                    <div className="auto-stat-card">
                        <div className="auto-stat-icon total"><FaBolt /></div>
                        <div className="auto-stat-info"><span>Tổng quy tắc</span><b>{stats.total}</b></div>
                    </div>
                    <div className="auto-stat-card">
                        <div className="auto-stat-icon active"><FaToggleOn /></div>
                        <div className="auto-stat-info"><span>Đang bật</span><b>{stats.active}</b></div>
                    </div>
                    <div className="auto-stat-card">
                        <div className="auto-stat-icon inactive"><FaToggleOn /></div>
                        <div className="auto-stat-info"><span>Đang tắt</span><b>{stats.inactive}</b></div>
                    </div>
                </div>

                {/* ── Rules ── */}
                {loading ? (
                    <div className="automation-loading">Đang tải quy tắc...</div>
                ) : error ? (
                    <div className="automation-error">{error}</div>
                ) : rules.length === 0 ? (
                    <div className="automation-empty">
                        <div className="empty-icon">⚡</div>
                        <h3>Chưa có quy tắc tự động hóa</h3>
                        <p>Thêm quy tắc đầu tiên để bắt đầu tự động hóa công việc của bạn.</p>
                    </div>
                ) : (
                    <div className="automation-grid">
                        {rules.map(rule => (
                            <div key={rule.id} className={`rule-card${rule.is_active ? "" : " inactive"}`}>
                                <div className="rule-icon">
                                    {RULE_ICONS[rule.trigger_event] || "⚙️"}
                                </div>

                                <div className="rule-body">
                                    <div className="rule-name">{rule.name}</div>
                                    <div className="rule-flow">
                                        <span className="rule-chip trigger">
                                            {TRIGGER_LABELS[rule.trigger_event] || rule.trigger_event}
                                        </span>
                                        <span className="rule-chip arrow">→</span>
                                        <span className="rule-chip condition">
                                            {rule.condition_field} = {STATUS_LABELS[rule.condition_value] || rule.condition_value}
                                        </span>
                                        <span className="rule-chip arrow">→</span>
                                        <span className="rule-chip action">
                                            {ACTION_LABELS[rule.action_type] || rule.action_type}
                                        </span>
                                    </div>
                                    <div className="rule-meta">
                                        {rule.created_by_name && `Tạo bởi ${rule.created_by_name} · `}
                                        {new Date(rule.created_at).toLocaleDateString("vi-VN")}
                                    </div>
                                </div>

                                <div className="rule-actions">
                                    {canEdit && (
                                        <>
                                            <label className="toggle-switch" title={rule.is_active ? "Tắt quy tắc" : "Bật quy tắc"}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!rule.is_active}
                                                    onChange={() => handleToggle(rule)}
                                                />
                                                <span className="toggle-slider" />
                                            </label>
                                            <button
                                                className="rule-btn delete"
                                                title="Xóa quy tắc"
                                                onClick={() => handleDelete(rule.id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ── Modal thêm rule ── */}
            {showModal && (
                <div className="automation-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="automation-modal">
                        <h2>⚡ Thêm quy tắc tự động hóa</h2>

                        <div className="form-group">
                            <label>Tên quy tắc *</label>
                            <input
                                type="text"
                                placeholder="VD: Tự động hoàn thành khi đạt 100%"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Khi nào kích hoạt (Trigger)</label>
                            <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))}>
                                <option value="STATUS_CHANGE">Khi thay đổi trạng thái</option>
                                <option value="DEADLINE_PASSED">Khi quá hạn deadline</option>
                                <option value="TASK_CREATED">Khi tạo công việc mới</option>
                                <option value="TASK_ASSIGNED">Khi giao công việc</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Điều kiện — Trạng thái bằng</label>
                            <select value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))}>
                                <option value="CHUA_LAM">Chưa làm</option>
                                <option value="DANG_LAM">Đang làm</option>
                                <option value="DANG_REVIEW">Đang review</option>
                                <option value="HOAN_THANH">Hoàn thành</option>
                                <option value="QUA_HAN">Quá hạn</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Hành động (Action)</label>
                            <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}>
                                <option value="SET_COMPLETED_AT">Ghi thời gian hoàn thành</option>
                                <option value="NOTIFY_ASSIGNEE">Thông báo người được giao</option>
                                <option value="NOTIFY_MANAGER">Thông báo quản lý</option>
                                <option value="SET_PRIORITY">Đặt mức ưu tiên</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => { setShowModal(false); setForm(INIT_FORM); }}>
                                Hủy
                            </button>
                            <button className="btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? "Đang lưu..." : "Lưu quy tắc"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
