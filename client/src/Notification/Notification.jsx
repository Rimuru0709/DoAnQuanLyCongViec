import { useState, useEffect, useMemo } from "react";
import { FaBell, FaCheck, FaTrash, FaInfoCircle, FaExclamationTriangle, FaCog, FaCheckCircle, FaTrashAlt } from "react-icons/fa";
import Sidebar from "../Sidebar/Sidebar";
import "./Notification.css";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all"); 
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    
    // Quản lý phân trang thực tế
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 10;

    // 1. Tải trang đầu tiên (Page 1) khi thay đổi Bộ lọc (Filter)
    useEffect(() => {
        let isMounted = true;
        
        const loadFirstPage = async () => {
            try {
                setLoading(true);
                // Đảm bảo luôn reset page về 1 khi đổi bộ lọc
                setPage(1); 

                const res = await fetch(`http://localhost:5000/api/notifications?page=1&limit=${LIMIT}&filter=${filter}`, { 
                    headers: getAuthHeaders() 
                });
                
                if (!res.ok) throw new Error("Không thể tải danh sách thông báo");
                
                const data = await res.json();
                
                if (isMounted) {
                    const newNotifs = data.results && Array.isArray(data.results) ? data.results : data;
                    setNotifications(newNotifs);
                    setHasMore(newNotifs.length >= LIMIT);
                    setError("");
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError("Lỗi kết nối API hệ thống. Đang hiển thị dữ liệu kiểm thử.");
                    setNotifications([
                        { id: 1, title: "Dự án Website quá hạn", content: "Dự án 'E-Commerce Website' đã quá hạn hoàn thành 2 ngày.", type: "warning", is_read: false, created_at: new Date().toISOString() },
                        { id: 2, title: "Hệ thống bảo trì", content: "Hệ thống sẽ bảo trì định kỳ vào lúc 23:00 đêm nay.", type: "system", is_read: false, created_at: new Date().toISOString() },
                        { id: 3, title: "Phân công công việc mới", content: "Bạn đã được gán vào công việc 'Thiết kế giao diện Dashboard'.", type: "info", is_read: true, created_at: new Date().toISOString() }
                    ]);
                    setHasMore(false);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadFirstPage();

        return () => { isMounted = false; };
    }, [filter]); // Chỉ chạy lại khi thay đổi filter

    // 2. Real-time Polling cập nhật tự động (Sửa lỗi rò rỉ bộ nhớ)
    useEffect(() => {
        // Chỉ chạy polling tự động nếu đang ở trang 1
        if (page !== 1) return; 

        const interval = setInterval(() => {
            fetch(`http://localhost:5000/api/notifications?page=1&limit=${LIMIT}&filter=${filter}`, { headers: getAuthHeaders() })
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(data => {
                    const newNotifs = data.results && Array.isArray(data.results) ? data.results : data;
                    setNotifications(newNotifs);
                })
                .catch(err => console.error("Realtime polling error:", err));
        }, 30000); 

        // QUAN TRỌNG: Phải dọn dẹp interval khi filter hoặc page thay đổi để tránh chạy ngầm chồng chéo
        return () => clearInterval(interval);
    }, [filter, page]);

    // 3. Đếm số thông báo chưa đọc
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.is_read).length;
    }, [notifications]);

    // 4. Luồng xử lý tải trang tiếp theo (Tối ưu ghép mảng không trùng lặp ID)
    const fetchNextPage = async (nextPage) => {
        try {
            setLoadingMore(true);
            const res = await fetch(`http://localhost:5000/api/notifications?page=${nextPage}&limit=${LIMIT}&filter=${filter}`, { 
                headers: getAuthHeaders() 
            });
            if (!res.ok) throw new Error("Không thể tải thêm thông báo");
            const data = await res.json();
            
            const newNotifs = data.results && Array.isArray(data.results) ? data.results : data;
            
            // Lọc loại bỏ trùng lặp id trước khi nối mảng (đề phòng dữ liệu real-time đổ về bị trùng)
            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id));
                const uniqueNewNotifs = newNotifs.filter(n => !existingIds.has(n.id));
                return [...prev, ...uniqueNewNotifs];
            });
            setHasMore(newNotifs.length >= LIMIT);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);      
        fetchNextPage(nextPage); 
    };

    // 5. Đánh dấu một mục đã đọc
    const markAsRead = async (id) => {
        try {
            // Optimistic UI Update (Cập nhật giao diện lập tức trước khi gọi API)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: "PUT",
                headers: getAuthHeaders()
            });
        } catch (err) {
            console.error(err);
        }
    };

    // 6. Đánh dấu tất cả mục đã đọc
    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await fetch(`http://localhost:5000/api/notifications/read-all`, {
                method: "PUT",
                headers: getAuthHeaders()
            });
        } catch (err) {
            console.error(err);
        }
    };

    // 7. Xóa một hàng thông báo
    const deleteNotification = async (id) => {
        try {
            setNotifications(prev => prev.filter(n => n.id !== id));
            await fetch(`http://localhost:5000/api/notifications/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
        } catch (err) {
            console.error(err);
        }
    };

    // 8. Dọn sạch hòm thư thông báo
    const clearAllNotifications = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ thông báo không? Hành động này không thể hoàn tác.")) return;
        try {
            setNotifications([]);
            await fetch(`http://localhost:5000/api/notifications/clear-all`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
        } catch (err) {
            console.error(err);
        }
    };

    const renderIcon = (type) => {
        switch (type) {
            case "warning": return <FaExclamationTriangle className="notif-icon icon-warning" />;
            case "system": return <FaCog className="notif-icon icon-system" />;
            default: return <FaInfoCircle className="notif-icon icon-info" />;
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " - " + date.toLocaleDateString("vi-VN");
    };

    // Hàm chuyển đổi tab mượt mà không bị lỗi dính trang
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPage(1); // Reset page về 1
    };

    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <header className="topbar">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <h1>Thông báo</h1>
                        {unreadCount > 0 && <span className="unread-badge-count">{unreadCount} mới</span>}
                    </div>
                    <div className="hero-actions">
                        {/* Chỉ hiện nút "Đọc tất cả" khi có ít nhất một thông báo CHƯA đọc */}
                        {unreadCount > 0 && (
                            <button className="btn-secondary btn-sm" onClick={markAllAsRead}>
                                <FaCheckCircle style={{ marginRight: 6 }} /> Đọc tất cả
                            </button>
                        )}
                        {/* Chỉ hiện nút "Xóa sạch" khi danh sách thực sự có thông báo */}
                        {notifications.length > 0 && (
                            <button className="btn-secondary btn-sm btn-danger-hover" onClick={clearAllNotifications}>
                                <FaTrashAlt style={{ marginRight: 6 }} /> Xóa sạch hòm thư
                            </button>
                        )}
                    </div>
                </header>

                <div className="page-content report-page">
                    {error && <div className="status-banner error-banner">{error}</div>}

                    {/* Bộ lọc lựa chọn Tabs */}
                    <div className="notif-tabs">
                        <button 
                            className={`tab-item ${filter === "all" ? "active" : ""}`} 
                            onClick={() => handleFilterChange("all")}
                        >
                            Tất cả
                        </button>
                        <button 
                            className={`tab-item ${filter === "unread" ? "active" : ""}`} 
                            onClick={() => handleFilterChange("unread")}
                        >
                            Chưa đọc
                        </button>
                    </div>

                    {/* Khung danh sách */}
                    <div className="card notif-card-container">
                        {loading ? (
                            <div className="empty-state">Đang đồng bộ dữ liệu thông báo...</div>
                        ) : notifications.length > 0 ? (
                            <>
                                <div className="notif-list">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className={`notif-item ${!notif.is_read ? "unread" : ""}`}>
                                            <div className="notif-left">
                                                {renderIcon(notif.type)}
                                                <div className="notif-main-content">
                                                    <h4 className="notif-title">
                                                        {notif.title}
                                                        {!notif.is_read && <span className="unread-dot"></span>}
                                                    </h4>
                                                    <p className="notif-desc">{notif.content}</p>
                                                    <span className="notif-time">{formatTime(notif.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="notif-actions">
                                                {!notif.is_read && (
                                                    <button className="action-btn check-btn" title="Đánh dấu đã đọc" onClick={() => markAsRead(notif.id)}>
                                                        <FaCheck />
                                                    </button>
                                                )}
                                                <button className="action-btn delete-btn" title="Xóa" onClick={() => deleteNotification(notif.id)}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Thanh nút bấm điều khiển tải thêm trang */}
                                {hasMore && (
                                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                        <button className="btn-secondary btn-sm" onClick={handleLoadMore} disabled={loadingMore}>
                                            {loadingMore ? "Đang tải thêm dữ liệu..." : "Xem các thông báo cũ hơn"}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="notif-empty-state">
                                <FaBell className="empty-bell-icon" />
                                <p>Không có thông báo nào ở đây.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Notification;