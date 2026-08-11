import { useState, useEffect } from "react";
import "./Setting.css";

// Danh sách các ngày trong tuần cố định để hiển thị checkbox
const DAYS_OF_WEEK = [
    { key: "Mon", label: "Thứ 2" },
    { key: "Tue", label: "Thứ 3" },
    { key: "Wed", label: "Thứ 4" },
    { key: "Thu", label: "Thứ 5" },
    { key: "Fri", label: "Thứ 6" },
    { key: "Sat", label: "Thứ 7" },
    { key: "Sun", label: "Chủ Nhật" },
];

function Setting() {
    // 1. Khởi tạo State cũ + mới
    const [themeColor, setThemeColor] = useState("#2563EB");
    const [enableGantt, setEnableGantt] = useState(true);
    const [enableTimeline, setEnableTimeline] = useState(true);
    
    // Chuyển workDays thành mảng để quản lý bằng Checkbox trực quan
    const [workDays, setWorkDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    
    const [defaultView, setDefaultView] = useState("kanban");
    const [adminOnlyCreateProject, setAdminOnlyCreateProject] = useState(false);
    const [maxUploadSize, setMaxUploadSize] = useState(10);
    
    // TÍNH NĂNG MỚI BỔ SUNG: Bật tắt thông báo email
    const [enableEmailNotify, setEnableEmailNotify] = useState(true); 
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    // Giả định bạn có thông tin user đăng nhập trong localStorage để phân quyền ở Frontend
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isAuthorized = currentUser.role === "ADMIN" || currentUser.role === "MANAGER";

    // 2. Tải cấu hình hệ thống
    useEffect(() => {
        const fetchSystemSettings = async () => {
            try {
                setLoading(true);
                const response = await fetch("http://localhost:5000/api/settings", {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        setThemeColor(data.theme_color || "#2563EB");
                        setEnableGantt(data.enable_gantt !== false);
                        setEnableTimeline(data.enable_timeline !== false);
                        
                        // Chuyển chuỗi "Mon,Tue" từ DB thành mảng để đổ vào checkbox
                        if (data.work_days) {
                            setWorkDays(data.work_days.split(","));
                        }
                        
                        setDefaultView(data.default_view || "kanban");
                        setAdminOnlyCreateProject(data.admin_only_create_project === true);
                        setMaxUploadSize(data.max_upload_size || 10);
                        setEnableEmailNotify(data.enable_email_notify !== false);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi tải cấu hình hệ thống:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthorized) fetchSystemSettings();
    }, [isAuthorized]);

    // Xử lý khi click chọn/bỏ chọn checkbox ngày làm việc
    const handleDayChange = (dayKey) => {
        if (workDays.includes(dayKey)) {
            setWorkDays(workDays.filter(d => d !== dayKey)); // Bỏ chọn
        } else {
            setWorkDays([...workDays, dayKey]); // Thêm vào danh sách ngày làm việc
        }
    };

    // 3. Lưu cấu hình hệ thống
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        if (!isAuthorized) return;
        
        setLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const response = await fetch("http://localhost:5000/api/settings", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    theme_color: themeColor,
                    enable_gantt: enableGantt,
                    enable_timeline: enableTimeline,
                    work_days: workDays.join(","), // Gom mảng thành chuỗi "Mon,Tue,Wed..." gửi lên DB
                    default_view: defaultView,
                    admin_only_create_project: adminOnlyCreateProject,
                    max_upload_size: Number(maxUploadSize),
                    enable_email_notify: enableEmailNotify // Gửi trường mới lên backend
                }),
            });

            if (response.ok) {
                setStatus({ type: "success", message: "Đã cập nhật cấu hình hệ thống thành công!" });
            } else {
                setStatus({ type: "error", message: "Không thể lưu cấu hình. Vui lòng thử lại." });
            }
        } catch {
            setStatus({ type: "error", message: "Lỗi kết nối đến server." });
        } finally {
            setLoading(false);
        }
    };

    // Chặn hiển thị nếu user không đủ quyền hạn
    if (!isAuthorized) {
        return (
            <div className="project-settings-layout">
                <div className="project-settings-container" style={{ padding: "20px", color: "red" }}>
                    <h3>Bạn không có quyền truy cập vào khu vực thiết lập hệ thống.</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="project-settings-layout">
            <div className="project-settings-container">
                <form className="settings-form" onSubmit={handleSaveSettings}>
                    <h2 className="form-section-title">Thiết lập Hệ thống Dự án (Chung)</h2>
                    
                    {status.message && (
                        <div className={`status-banner ${status.type}-banner`}>
                            {status.message}
                        </div>
                    )}

                    {/* SECTION: GIAO DIỆN CƠ BẢN */}
                    <div className="form-group">
                        <label>Màu sắc chủ đạo mặc định (Theme Color)</label>
                        <div className="color-picker-wrapper">
                            <input 
                                type="color" 
                                value={themeColor} 
                                onChange={(e) => setThemeColor(e.target.value)} 
                            />
                            <span className="color-code-text">{themeColor.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* SECTION 1: QUY TRÌNH & HIỂN THỊ */}
                    <h3 className="form-section-title" style={{ fontSize: '16px', marginTop: '20px' }}>Quy trình & Hiển thị</h3>

                    <div className="form-group">
                        <label>Chế độ xem mặc định khi vào dự án</label>
                        <select 
                            className="settings-input" 
                            style={{ appearance: 'auto' }}
                            value={defaultView}
                            onChange={(e) => setDefaultView(e.target.value)}
                        >
                            <option value="kanban">Bảng Kanban (Mặc định)</option>
                            <option value="list">Danh sách (List View)</option>
                            <option value="calendar">Lịch (Calendar)</option>
                        </select>
                    </div>

                    <div className="setting-toggle-item">
                        <div className="toggle-text-group">
                            <h4>Kích hoạt biểu đồ Gantt</h4>
                            <p className="sub-text">Hiển thị tiến độ công việc theo dạng thanh lịch trình mặc định.</p>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={enableGantt} 
                                onChange={(e) => setEnableGantt(e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="setting-toggle-item">
                        <div className="toggle-text-group">
                            <h4>Kích hoạt Timeline</h4>
                            <p className="sub-text">Theo dõi chuỗi sự kiện và cột mốc quan trọng của dự án.</p>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={enableTimeline} 
                                onChange={(e) => setEnableTimeline(e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* ĐÃ CẢI TIẾN: Chọn ngày làm việc trực quan bằng Checkbox */}
                    <div className="form-group">
                        <label style={{ marginBottom: "10px", display: "block" }}>Ngày làm việc trong tuần</label>
                        <div className="days-checkbox-group" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            {DAYS_OF_WEEK.map((day) => (
                                <label key={day.key} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                    <input 
                                        type="checkbox"
                                        checked={workDays.includes(day.key)}
                                        onChange={() => handleDayChange(day.key)}
                                    />
                                    {day.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 2: QUẢN LÝ QUYỀN HẠN MẶC ĐỊNH */}
                    <h3 className="form-section-title" style={{ fontSize: '16px', marginTop: '20px' }}>Quyền hạn hệ thống</h3>

                    <div className="setting-toggle-item">
                        <div className="toggle-text-group">
                            <h4>Chỉ Admin mới được tạo dự án</h4>
                            <p className="sub-text">Nếu tắt, tất cả nhân viên đều có thể tự tạo dự án mới.</p>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={adminOnlyCreateProject} 
                                onChange={(e) => setAdminOnlyCreateProject(e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* SECTION 3: TÍNH NĂNG MỚI BỔ SUNG - THÔNG BÁO */}
                    <h3 className="form-section-title" style={{ fontSize: '16px', marginTop: '20px' }}>Thông báo & Tương tác</h3>
                    
                    <div className="setting-toggle-item">
                        <div className="toggle-text-group">
                            <h4>Gửi thông báo qua Email</h4>
                            <p className="sub-text">Tự động gửi email nhắc nhở cho nhân viên khi có công việc mới hoặc sắp trễ hạn.</p>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={enableEmailNotify} 
                                onChange={(e) => setEnableEmailNotify(e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* SECTION 4: ĐÍNH KÈM & TÀI LIỆU */}
                    <h3 className="form-section-title" style={{ fontSize: '16px', marginTop: '20px' }}>Tài liệu & Đính kèm</h3>

                    <div className="form-group">
                        <label>Dung lượng file tối đa cho phép tải lên (MB)</label>
                        <input 
                            type="number" 
                            className="settings-input" 
                            value={maxUploadSize} 
                            onChange={(e) => setMaxUploadSize(e.target.value)}
                            min={1}
                            max={100}
                        />
                    </div>

                    {/* NÚT SUBMIT */}
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={loading}
                        style={{ marginTop: '20px' }}
                    >
                        {loading ? "Đang lưu..." : "Lưu cấu hình hệ thống"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Setting;