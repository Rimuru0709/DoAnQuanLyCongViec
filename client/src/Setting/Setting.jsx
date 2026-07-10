import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./Setting.css"; 

function ProjectSettings() {
    const { projectId } = useParams(); 
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    
    const [settings, setSettings] = useState({
        theme_color: "#2563EB",
        enable_gantt: true,
        enable_timeline: true,
        working_days: "Mon,Tue,Wed,Thu,Fri"
    });

    useEffect(() => {
        if (!projectId) return;
        fetch(`http://localhost:5000/api/settings/${projectId}`) 
            .then(res => res.json())
            .then(data => {
                if (data && !data.message) {
                    setSettings({
                        theme_color: data.theme_color || "#2563EB",
                        enable_gantt: data.enable_gantt ?? true,
                        enable_timeline: data.enable_timeline ?? true,
                        working_days: data.working_days || "Mon,Tue,Wed,Thu,Fri"
                    });
                }
            })
            .catch(err => console.error("Lỗi tải cấu hình:", err));
    }, [projectId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch(`http://localhost:5000/api/settings/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setStatus({ type: "success", message: "Đã lưu thiết lập dự án thành công!" });
            } else {
                setStatus({ type: "error", message: "Lưu thất bại. Vui lòng kiểm tra lại!" });
            }
        } catch {
            setStatus({ type: "error", message: "Không thể kết nối đến máy chủ." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="project-settings-layout">
            {/* Thanh điều hướng bên trái */}
            <Sidebar />

            {/* Vùng nội dung cấu hình bên phải */}
            <div className="project-settings-container">
                <form onSubmit={handleSave} className="settings-form">
                    <h3 className="form-section-title">Thiết lập Dự án (ID: {projectId || "Chưa chọn"})</h3>
                    
                    {status.message && (
                        <div className={`status-banner ${status.type}-banner`}>
                            {status.message}
                        </div>
                    )}

                    {/* Chọn màu chủ đạo */}
                    <div className="form-group">
                        <label>Màu sắc chủ đạo dự án (Theme Color)</label>
                        <div className="color-picker-wrapper">
                            <input 
                                type="color" 
                                value={settings.theme_color} 
                                onChange={e => setSettings({...settings, theme_color: e.target.value})} 
                            />
                            <span className="color-code-text">{settings.theme_color}</span>
                        </div>
                    </div>

                    {/* Bật/tắt Biểu đồ Gantt */}
                    <div className="setting-toggle-item">
                        <div className="toggle-text-group">
                            <h4>Kích hoạt biểu đồ Gantt</h4>
                            <p className="sub-text">Hiển thị tiến độ công việc theo dạng thanh lịch trình.</p>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={settings.enable_gantt} 
                                onChange={e => setSettings({...settings, enable_gantt: e.target.checked})} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* Bật/tắt Sơ đồ Thời gian */}
                    <div className="setting-toggle-item">
                        <div className="toggle-text-group">
                            <h4>Kích hoạt Timeline</h4>
                            <p className="sub-text">Theo dõi chuỗi sự kiện và cột mốc quan trọng.</p>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={settings.enable_timeline} 
                                onChange={e => setSettings({...settings, enable_timeline: e.target.checked})} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* Nhập chuỗi ngày làm việc */}
                    <div className="form-group">
                        <label>Ngày làm việc trong tuần (Cách nhau bằng dấu phẩy)</label>
                        <input 
                            type="text" 
                            className="settings-input" 
                            value={settings.working_days} 
                            onChange={e => setSettings({...settings, working_days: e.target.value})} 
                            placeholder="Mon,Tue,Wed,Thu,Fri"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading || !projectId}>
                        {loading ? "Đang lưu..." : "Lưu cấu hình dự án"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProjectSettings;