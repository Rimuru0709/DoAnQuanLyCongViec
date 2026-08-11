import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaCheckCircle, FaFolder, FaCalendarDay } from "react-icons/fa";
import { getSocket, disconnectSocket } from "../services/socket";
import "./AppHeader.css";

const NOTIFICATION_API = "http://localhost:5000/api/notifications";

const roleLabel = {
    ADMIN:   "Quản trị viên",
    MANAGER: "Trưởng dự án",
    MEMBER:  "Thành viên",
    GUEST:   "Khách"
};

export default function AppHeader() {
    const navigate = useNavigate();

    const [search,        setSearch]        = useState("");
    const [unreadCount,   setUnreadCount]   = useState(0);
    const [latestNotifs,  setLatestNotifs]  = useState([]);
    const [openQuickAdd,  setOpenQuickAdd]  = useState(false);
    const [openUser,      setOpenUser]      = useState(false);
    const [openNotif,     setOpenNotif]     = useState(false);
    const notifRef = useRef(null);

    const quickAddRef = useRef(null);
    const userRef     = useRef(null);
    const searchRef   = useRef(null);

    /* ── User info ── */
    let user = null;
    try { user = JSON.parse(localStorage.getItem("user")); } catch { /* ignore */ }

    const token    = localStorage.getItem("token");
    const name     = user?.full_name || "Khách";
    const role     = user?.role      || "GUEST";
    const initial  = name.charAt(0).toUpperCase();

    /* ── Load notifications ── */
    const loadUnread = async () => {
        if (!token) return;
        try {
            const [countRes, latestRes] = await Promise.all([
                fetch(`${NOTIFICATION_API}/unread-count`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${NOTIFICATION_API}/latest?limit=5`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (countRes.ok) {
                const d = await countRes.json();
                setUnreadCount(d.count || 0);
            }
            if (latestRes.ok) {
                const d = await latestRes.json();
                setLatestNotifs(d.notifications || []);
            }
        } catch { /* ignore */ }
    };

    /* ── Mark one notification as read ── */
    const markRead = async (id) => {
        if (!token) return;
        try {
            await fetch(`${NOTIFICATION_API}/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            setLatestNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            window.dispatchEvent(new Event('notification-updated'));
        } catch { /* ignore */ }
    };

    useEffect(() => {
        loadUnread();
        // Polling fallback mỗi 60s
        const iv = setInterval(loadUnread, 60000);
        const handler = () => loadUnread();
        window.addEventListener("notification-updated", handler);

        // Socket.io real-time
        const socket = getSocket();
        if (socket) {
            socket.on("notification:new", (notif) => {
                setUnreadCount(prev => prev + 1);
                setLatestNotifs(prev => [notif, ...prev].slice(0, 5));
            });
        }

        return () => {
            clearInterval(iv);
            window.removeEventListener("notification-updated", handler);
            socket?.off("notification:new");
        };
    }, []);

    /* ── Ctrl+K shortcut ── */
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* ── Logout ── */
    const handleLogout = () => {
        disconnectSocket();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    /* ── Search submit ── */
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter" && search.trim()) {
            setSearch("");
            searchRef.current?.blur();
        }
    };

    return (
        <header className="app-header">
            {/* ── Global Search ── */}
            <div className="header-search">
                <span className="header-search-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                        <circle cx="8.5" cy="8.5" r="5.5" />
                        <line x1="13" y1="13" x2="18" y2="18" />
                    </svg>
                </span>
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Tìm kiếm công việc, dự án, nhân sự..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                />
                <div className="search-shortcut">
                    <kbd>Ctrl</kbd>
                    <kbd>K</kbd>
                </div>
            </div>

            <div className="header-spacer" />

            <div className="header-actions">
                {/* ── Quick Add ── */}
                <div className="quick-add-wrapper" ref={quickAddRef}>
                    <button
                        className="btn-quick-add"
                        onClick={() => { setOpenQuickAdd(v => !v); setOpenUser(false); }}
                    >
                        <FaPlus className="add-icon" />
                        <span>Tạo mới</span>
                    </button>

                    {openQuickAdd && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setOpenQuickAdd(false)} />
                            <div className="header-dropdown quick-add-dropdown">
                                <div className="dropdown-title">Tạo nhanh</div>
                                <button className="dropdown-item" onClick={() => { navigate("/project?action=create-task"); setOpenQuickAdd(false); }}>
                                    <FaCheckCircle className="dropdown-item-icon blue" />
                                    Công việc mới
                                </button>
                                <button className="dropdown-item" onClick={() => { navigate("/project?create=true"); setOpenQuickAdd(false); }}>
                                    <FaFolder className="dropdown-item-icon purple" />
                                    Dự án mới
                                </button>
                                <button className="dropdown-item" onClick={() => { navigate("/calendar"); setOpenQuickAdd(false); }}>
                                    <FaCalendarDay className="dropdown-item-icon green" />
                                    Nhắc nhở / Lịch
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Notification Bell with Dropdown ── */}
                <div className="notif-wrapper" ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        className="header-icon-btn"
                        title="Thông báo"
                        onClick={() => { setOpenNotif(v => !v); setOpenUser(false); setOpenQuickAdd(false); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                        )}
                    </button>

                    {openNotif && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setOpenNotif(false)} />
                            <div className="header-dropdown" style={{
                                width: 340, right: 0, top: 'calc(100% + 10px)',
                                maxHeight: 420, overflowY: 'auto'
                            }}>
                                <div className="dropdown-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <span>Thông báo</span>
                                    {unreadCount > 0 && (
                                        <span style={{ fontSize:11, color:'#3b82f6', fontWeight:500 }}>
                                            {unreadCount} chưa đọc
                                        </span>
                                    )}
                                </div>

                                {latestNotifs.length === 0 ? (
                                    <div style={{ padding:'20px 16px', textAlign:'center', color:'#475569', fontSize:13 }}>
                                        Không có thông báo mới
                                    </div>
                                ) : (
                                    latestNotifs.map(n => (
                                        <div
                                            key={n.id}
                                            className="dropdown-item"
                                            style={{
                                                flexDirection:'column', alignItems:'flex-start',
                                                gap:3, cursor:'pointer',
                                                background: n.is_read ? 'transparent' : 'rgba(37,99,235,0.08)',
                                                borderLeft: n.is_read ? 'none' : '3px solid #2563eb',
                                                paddingLeft: n.is_read ? 16 : 13
                                            }}
                                            onClick={() => { markRead(n.id); }}
                                        >
                                            <div style={{ fontSize:13, fontWeight: n.is_read ? 400 : 600, color:'#cbd5e1', lineHeight:1.4 }}>
                                                {n.title}
                                            </div>
                                            <div style={{ fontSize:11, color:'#475569', lineHeight:1.4 }}>
                                                {n.content?.slice(0,80)}{n.content?.length > 80 ? '...' : ''}
                                            </div>
                                            <div style={{ fontSize:10, color:'#334155', marginTop:2 }}>
                                                {new Date(n.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                                            </div>
                                        </div>
                                    ))
                                )}

                                <div className="dropdown-divider" />
                                <button
                                    className="dropdown-item"
                                    style={{ justifyContent:'center', color:'#3b82f6', fontSize:13 }}
                                    onClick={() => { navigate('/notification'); setOpenNotif(false); }}
                                >
                                    Xem tất cả thông báo →
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Settings shortcut ── */}
                <button
                    className="header-icon-btn"
                    title="Cài đặt"
                    onClick={() => navigate("/setting")}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>

                <div className="header-divider" />

                {/* ── User Profile ── */}
                <div className="user-wrapper" ref={userRef}>
                    <div
                        className={`header-user${openUser ? " open" : ""}`}
                        onClick={() => { setOpenUser(v => !v); setOpenQuickAdd(false); }}
                    >
                        <div className="header-avatar">{initial}</div>
                        <div className="header-user-info">
                            <span className="header-user-name">{name}</span>
                            <span className="header-user-role">{roleLabel[role] || role}</span>
                        </div>
                        <svg className="header-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>

                    {openUser && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setOpenUser(false)} />
                            <div className="header-dropdown">
                                <div className="dropdown-title">Tài khoản</div>
                                <div className="dropdown-item" style={{ cursor: "default", gap: "10px", paddingBottom: "10px" }}>
                                    <div className="header-avatar" style={{ width: 36, height: 36, fontSize: 15, borderRadius: 10 }}>{initial}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#c8ddf7" }}>{name}</div>
                                        <div style={{ fontSize: 11, color: "#5d7fa0", marginTop: 1 }}>{roleLabel[role]}</div>
                                    </div>
                                </div>
                                <div className="dropdown-divider" />
                                <button className="dropdown-item" onClick={() => { navigate("/setting"); setOpenUser(false); }}>
                                    <span className="dropdown-item-icon gray">⚙️</span>
                                    Cài đặt tài khoản
                                </button>
                                <div className="dropdown-divider" />
                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <span className="dropdown-item-icon red">🚪</span>
                                    Đăng xuất
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
