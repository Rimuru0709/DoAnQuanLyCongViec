import { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./Setting.css";

function Setting() {
    // 1. Khởi tạo State lưu cấu hình hệ thống (Cũ + Mới bổ sung)
    const [themeColor, setThemeColor] = useState("#2563EB");
    const [enableGantt, setEnableGantt] = useState(true);
    const [enableTimeline, setEnableTimeline] = useState(true);
    const [workDays, setWorkDays] = useState("Mon,Tue,Wed,Thu,Fri");
    
    // Khởi tạo state cho các tính năng mới được gợi ý
    const [defaultView, setDefaultView] = useState("kanban");
    const [adminOnlyCreateProject, setAdminOnlyCreateProject] = useState(false);
    const [maxUploadSize, setMaxUploadSize] = useState(10);
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    // 2. Gọi API lấy toàn bộ cấu hình hệ thống khi tải trang
    useEffect(() => {
        const fetchSystemSettings = async () => {
            try {
                setLoading(true);
                const response = await fetch("http://localhost:5000/api/settings");
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        // Đổ dữ liệu cũ
                        setThemeColor(data.theme_color || "#2563EB");
                        setEnableGantt(data.enable_gantt !== false);
                        setEnableTimeline(data.enable_timeline !== false);
                        setWorkDays(data.work_days || "Mon,Tue,Wed,Thu,Fri");
                        
                        // Đổ dữ liệu mới (nếu có trong DB, không thì lấy giá trị mặc định)
                        setDefaultView(data.default_view || "kanban");
                        setAdminOnlyCreateProject(data.admin_only_create_project === true);
                        setMaxUploadSize(data.max_upload_size || 10);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi tải cấu hình hệ thống:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSystemSettings();
    }, []);

    // 3. Xử lý lưu toàn bộ cấu hình hệ thống về Backend
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const response = await fetch("http://localhost:5000/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    theme_color: themeColor,
                    enable_gantt: enableGantt,
                    enable_timeline: enableTimeline,
                    work_days: workDays,
                    // Đính kèm các trường mới bổ sung vào body API
                    default_view: defaultView,
                    admin_only_create_project: adminOnlyCreateProject,
                    max_upload_size: Number(maxUploadSize),
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

    return (
        <div className="project-settings-layout">
            <Sidebar />
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

                    <div className="form-group">
                        <label>Ngày làm việc trong tuần (Cách nhau bằng dấu phẩy)</label>
                        <input 
                            type="text" 
                            className="settings-input" 
                            value={workDays} 
                            onChange={(e) => setWorkDays(e.target.value)} 
                            placeholder="Mon,Tue,Wed,Thu,Fri"
                        />
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

                    {/* SECTION 3: ĐÍNH KÈM & TÀI LIỆU */}
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
                        style={{ marginTop: '10px' }}
                    >
                        {loading ? "Đang lưu..." : "Lưu cấu hình hệ thống"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Setting;