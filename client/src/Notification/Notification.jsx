import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FaBell,
    FaCheck,
    FaTrash,
    FaInfoCircle,
    FaExclamationTriangle,
    FaCog,
    FaCheckCircle,
    FaTrashAlt
} from "react-icons/fa";

import "./Notification.css";

const API_URL =
    "http://localhost:5000/api/notifications";

const LIMIT = 10;

/*
|--------------------------------------------------------------------------
| Header xác thực
|--------------------------------------------------------------------------
*/

const getAuthHeaders = () => {
    const token =
        localStorage.getItem("token");

    return token
        ? {
            Authorization:
                `Bearer ${token}`
        }
        : {};
};

function Notification() {
    const [
        notifications,
        setNotifications
    ] = useState([]);

    const [
        filter,
        setFilter
    ] = useState("all");

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        loadingMore,
        setLoadingMore
    ] = useState(false);

    const [
        error,
        setError
    ] = useState("");

    const [
        page,
        setPage
    ] = useState(1);

    const [
        hasMore,
        setHasMore
    ] = useState(true);

    const [
        showClearModal,
        setShowClearModal
    ] = useState(false);

    const [
        clearingAll,
        setClearingAll
    ] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Đọc dữ liệu JSON an toàn
    |--------------------------------------------------------------------------
    */

    const parseResponse = async (
        response
    ) => {
        try {
            return await response.json();
        } catch {
            return {};
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Báo cho Sidebar cập nhật chấm đỏ
    |--------------------------------------------------------------------------
    */

    const notifySidebarUpdated = () => {
        window.dispatchEvent(
            new Event(
                "notification-updated"
            )
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Lấy danh sách thông báo
    |--------------------------------------------------------------------------
    */

    const fetchNotifications = async (
        targetPage = 1,
        targetFilter = filter
    ) => {
        const response = await fetch(
            `${API_URL}?page=${targetPage}&limit=${LIMIT}&filter=${targetFilter}`,
            {
                headers:
                    getAuthHeaders()
            }
        );

        const data =
            await parseResponse(response);

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Không thể tải danh sách thông báo"
            );
        }

        return Array.isArray(
            data.results
        )
            ? data.results
            : [];
    };

    /*
    |--------------------------------------------------------------------------
    | Tải trang đầu tiên khi đổi bộ lọc
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let isMounted = true;

        const loadFirstPage =
            async () => {
                try {
                    setLoading(true);
                    setError("");
                    setPage(1);

                    const newNotifications =
                        await fetchNotifications(
                            1,
                            filter
                        );

                    if (!isMounted) {
                        return;
                    }

                    setNotifications(
                        newNotifications
                    );

                    setHasMore(
                        newNotifications.length >=
                        LIMIT
                    );
                } catch (err) {
                    console.error(
                        "Lỗi tải thông báo:",
                        err
                    );

                    if (isMounted) {
                        setNotifications([]);
                        setHasMore(false);

                        setError(
                            err.message ||
                            "Không thể kết nối đến server"
                        );
                    }
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            };

        loadFirstPage();

        return () => {
            isMounted = false;
        };
    }, [filter]);

    /*
    |--------------------------------------------------------------------------
    | Polling thông báo mới mỗi 30 giây
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (page !== 1) {
            return undefined;
        }

        const interval =
            setInterval(
                async () => {
                    try {
                        const newNotifications =
                            await fetchNotifications(
                                1,
                                filter
                            );

                        setNotifications(
                            newNotifications
                        );

                        setHasMore(
                            newNotifications.length >=
                            LIMIT
                        );
                    } catch (err) {
                        console.error(
                            "Lỗi cập nhật thông báo tự động:",
                            err
                        );
                    }
                },
                30000
            );

        return () => {
            clearInterval(interval);
        };
    }, [filter, page]);

    /*
    |--------------------------------------------------------------------------
    | Đếm thông báo chưa đọc
    |--------------------------------------------------------------------------
    */

    const unreadCount =
        useMemo(() => {
            return notifications.filter(
                (notification) =>
                    !notification.is_read
            ).length;
        }, [notifications]);

    /*
    |--------------------------------------------------------------------------
    | Tải thêm thông báo
    |--------------------------------------------------------------------------
    */

    const fetchNextPage = async (
        nextPage
    ) => {
        try {
            setLoadingMore(true);
            setError("");

            const newNotifications =
                await fetchNotifications(
                    nextPage,
                    filter
                );

            setNotifications(
                (previous) => {
                    const existingIds =
                        new Set(
                            previous.map(
                                (notification) =>
                                    notification.id
                            )
                        );

                    const uniqueItems =
                        newNotifications.filter(
                            (notification) =>
                                !existingIds.has(
                                    notification.id
                                )
                        );

                    return [
                        ...previous,
                        ...uniqueItems
                    ];
                }
            );

            setHasMore(
                newNotifications.length >=
                LIMIT
            );
        } catch (err) {
            console.error(
                "Lỗi tải thêm thông báo:",
                err
            );

            setError(
                err.message ||
                "Không thể tải thêm thông báo"
            );
        } finally {
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (
            loadingMore ||
            !hasMore
        ) {
            return;
        }

        const nextPage =
            page + 1;

        setPage(nextPage);

        fetchNextPage(
            nextPage
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Đánh dấu một thông báo đã đọc
    |--------------------------------------------------------------------------
    */

    const markAsRead = async (
        id
    ) => {
        const previousNotifications =
            notifications;

        setNotifications(
            (previous) =>
                previous.map(
                    (notification) =>
                        notification.id === id
                            ? {
                                ...notification,
                                is_read: 1
                            }
                            : notification
                )
        );

        try {
            const response =
                await fetch(
                    `${API_URL}/${id}/read`,
                    {
                        method: "PUT",
                        headers:
                            getAuthHeaders()
                    }
                );

            const data =
                await parseResponse(
                    response
                );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Không thể đánh dấu thông báo đã đọc"
                );
            }

            setError("");

            notifySidebarUpdated();
        } catch (err) {
            console.error(
                "Lỗi đánh dấu đã đọc:",
                err
            );

            setNotifications(
                previousNotifications
            );

            setError(
                err.message ||
                "Không thể cập nhật thông báo"
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Đánh dấu tất cả đã đọc
    |--------------------------------------------------------------------------
    */

    const markAllAsRead =
        async () => {
            const previousNotifications =
                notifications;

            setNotifications(
                (previous) =>
                    previous.map(
                        (notification) => ({
                            ...notification,
                            is_read: 1
                        })
                    )
            );

            try {
                const response =
                    await fetch(
                        `${API_URL}/read-all`,
                        {
                            method: "PUT",
                            headers:
                                getAuthHeaders()
                        }
                    );

                const data =
                    await parseResponse(
                        response
                    );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Không thể đánh dấu tất cả thông báo đã đọc"
                    );
                }

                setError("");

                notifySidebarUpdated();
            } catch (err) {
                console.error(
                    "Lỗi đánh dấu tất cả đã đọc:",
                    err
                );

                setNotifications(
                    previousNotifications
                );

                setError(
                    err.message ||
                    "Không thể cập nhật thông báo"
                );
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Xóa một thông báo
    |--------------------------------------------------------------------------
    */

    const deleteNotification =
        async (id) => {
            const previousNotifications =
                notifications;

            setNotifications(
                (previous) =>
                    previous.filter(
                        (notification) =>
                            notification.id !==
                            id
                    )
            );

            try {
                const response =
                    await fetch(
                        `${API_URL}/${id}`,
                        {
                            method:
                                "DELETE",
                            headers:
                                getAuthHeaders()
                        }
                    );

                const data =
                    await parseResponse(
                        response
                    );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Không thể xóa thông báo"
                    );
                }

                setError("");

                notifySidebarUpdated();
            } catch (err) {
                console.error(
                    "Lỗi xóa thông báo:",
                    err
                );

                setNotifications(
                    previousNotifications
                );

                setError(
                    err.message ||
                    "Không thể xóa thông báo"
                );
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Xóa toàn bộ thông báo
    |--------------------------------------------------------------------------
    */

    const clearAllNotifications =
        async () => {
            try {
                setClearingAll(true);
                setError("");

                const response =
                    await fetch(
                        `${API_URL}/clear-all`,
                        {
                            method:
                                "DELETE",
                            headers:
                                getAuthHeaders()
                        }
                    );

                const data =
                    await parseResponse(
                        response
                    );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Không thể xóa toàn bộ thông báo"
                    );
                }

                setNotifications([]);
                setHasMore(false);
                setPage(1);
                setShowClearModal(false);

                notifySidebarUpdated();
            } catch (err) {
                console.error(
                    "Lỗi xóa toàn bộ thông báo:",
                    err
                );

                setError(
                    err.message ||
                    "Không thể xóa toàn bộ thông báo"
                );
            } finally {
                setClearingAll(false);
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Hiển thị biểu tượng
    |--------------------------------------------------------------------------
    */

    const renderIcon = (
        type
    ) => {
        switch (type) {
            case "warning":
                return (
                    <FaExclamationTriangle className="notif-icon icon-warning" />
                );

            case "system":
                return (
                    <FaCog className="notif-icon icon-system" />
                );

            default:
                return (
                    <FaInfoCircle className="notif-icon icon-info" />
                );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Định dạng thời gian
    |--------------------------------------------------------------------------
    */

    const formatTime = (
        dateString
    ) => {
        if (!dateString) {
            return "";
        }

        const date =
            new Date(dateString);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const time =
            date.toLocaleTimeString(
                "vi-VN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        const day =
            date.toLocaleDateString(
                "vi-VN"
            );

        return `${time} - ${day}`;
    };

    /*
    |--------------------------------------------------------------------------
    | Đổi bộ lọc
    |--------------------------------------------------------------------------
    */

    const handleFilterChange = (
        newFilter
    ) => {
        if (
            newFilter === filter
        ) {
            return;
        }

        setFilter(newFilter);
        setPage(1);
    };

    return (
        <div className="page-content">

            <main className="main">
                <header className="topbar">
                    <div
                        style={{
                            display: "flex",
                            alignItems:
                                "center",
                            gap: 12
                        }}
                    >
                        <h1>
                            Thông báo
                        </h1>

                        {unreadCount > 0 && (
                            <span className="unread-badge-count">
                                {unreadCount} mới
                            </span>
                        )}
                    </div>

                    <div className="hero-actions">
                        {unreadCount >
                            0 && (
                            <button
                                type="button"
                                className="btn-secondary btn-sm"
                                onClick={
                                    markAllAsRead
                                }
                            >
                                <FaCheckCircle
                                    style={{
                                        marginRight:
                                            6
                                    }}
                                />

                                Đọc tất cả
                            </button>
                        )}

                        {notifications.length >
                            0 && (
                            <button
                                type="button"
                                className="btn-secondary btn-sm btn-danger-hover"
                                onClick={() =>
                                    setShowClearModal(
                                        true
                                    )
                                }
                            >
                                <FaTrashAlt
                                    style={{
                                        marginRight:
                                            6
                                    }}
                                />

                                Xóa sạch hòm thư
                            </button>
                        )}
                    </div>
                </header>

                <div className="page-content report-page">
                    {error && (
                        <div className="status-banner error-banner">
                            {error}
                        </div>
                    )}

                    <div className="notif-tabs">
                        <button
                            type="button"
                            className={`tab-item ${
                                filter ===
                                "all"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                handleFilterChange(
                                    "all"
                                )
                            }
                        >
                            Tất cả
                        </button>

                        <button
                            type="button"
                            className={`tab-item ${
                                filter ===
                                "unread"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                handleFilterChange(
                                    "unread"
                                )
                            }
                        >
                            Chưa đọc
                        </button>
                    </div>

                    <div className="card notif-card-container">
                        {loading ? (
                            <div className="empty-state">
                                Đang đồng bộ dữ liệu thông báo...
                            </div>
                        ) : notifications.length >
                            0 ? (
                            <>
                                <div className="notif-list">
                                    {notifications.map(
                                        (
                                            notification
                                        ) => (
                                            <div
                                                key={
                                                    notification.id
                                                }
                                                className={`notif-item ${
                                                    !notification.is_read
                                                        ? "unread"
                                                        : ""
                                                }`}
                                            >
                                                <div className="notif-left">
                                                    {renderIcon(
                                                        notification.type
                                                    )}

                                                    <div className="notif-main-content">
                                                        <h4 className="notif-title">
                                                            {
                                                                notification.title
                                                            }

                                                            {!notification.is_read && (
                                                                <span className="unread-dot" />
                                                            )}
                                                        </h4>

                                                        <p className="notif-desc">
                                                            {
                                                                notification.content
                                                            }
                                                        </p>

                                                        <span className="notif-time">
                                                            {formatTime(
                                                                notification.created_at
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="notif-actions">
                                                    {!notification.is_read && (
                                                        <button
                                                            type="button"
                                                            className="action-btn check-btn"
                                                            title="Đánh dấu đã đọc"
                                                            onClick={() =>
                                                                markAsRead(
                                                                    notification.id
                                                                )
                                                            }
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="action-btn delete-btn"
                                                        title="Xóa"
                                                        onClick={() =>
                                                            deleteNotification(
                                                                notification.id
                                                            )
                                                        }
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>

                                {hasMore && (
                                    <div
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "16px 0"
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="btn-secondary btn-sm"
                                            onClick={
                                                handleLoadMore
                                            }
                                            disabled={
                                                loadingMore
                                            }
                                        >
                                            {loadingMore
                                                ? "Đang tải thêm dữ liệu..."
                                                : "Xem các thông báo cũ hơn"}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="notif-empty-state">
                                <FaBell className="empty-bell-icon" />

                                <p>
                                    Không có thông báo nào ở đây.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {showClearModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => {
                            if (
                                !clearingAll
                            ) {
                                setShowClearModal(
                                    false
                                );
                            }
                        }}
                    >
                        <div
                            className="confirm-modal"
                            onClick={(
                                event
                            ) =>
                                event.stopPropagation()
                            }
                        >
                            <h3>
                                Xóa tất cả thông báo
                            </h3>

                            <p>
                                Bạn có chắc chắn muốn
                                xóa toàn bộ thông báo
                                không?
                            </p>

                            <small>
                                Hành động này không thể
                                hoàn tác.
                            </small>

                            <div className="modal-buttons">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        setShowClearModal(
                                            false
                                        )
                                    }
                                    disabled={
                                        clearingAll
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    className="delete-btn"
                                    onClick={
                                        clearAllNotifications
                                    }
                                    disabled={
                                        clearingAll
                                    }
                                >
                                    {clearingAll
                                        ? "Đang xóa..."
                                        : "Xóa"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Notification;