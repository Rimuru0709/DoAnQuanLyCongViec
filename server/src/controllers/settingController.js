const db = require('../config/db'); 

// 1. Lấy cấu hình hệ thống (Chung cho tất cả dự án)
const getSystemSettings = async (req, res) => {
    try {
        // Cấu hình chung luôn nằm cố định ở dòng có id = 1
        const query = 'SELECT * FROM system_settings WHERE id = 1';
        const [rows] = await db.execute(query);

        if (rows.length === 0) {
            // Trường hợp hy hữu nếu dòng id = 1 chưa có, trả về giá trị mặc định cho Frontend
            return res.status(200).json({
                theme_color: '#2563EB',
                enable_gantt: true,
                enable_timeline: true,
                work_days: 'Mon,Tue,Wed,Thu,Fri',
                default_view: 'kanban',
                admin_only_create_project: false,
                max_upload_size: 10
            });
        }

        const settings = rows[0];
        
        // Trả dữ liệu về cho React Frontend, đồng thời ép kiểu BOOLEAN chuẩn chỉnh (0/1 -> true/false)
        return res.status(200).json({
            theme_color: settings.theme_color,
            enable_gantt: !!settings.enable_gantt,
            enable_timeline: !!settings.enable_timeline,
            work_days: settings.working_days, // Map trúng cột working_days trong DB sang biến work_days của React
            default_view: settings.default_view,
            admin_only_create_project: !!settings.admin_only_create_project,
            max_upload_size: settings.max_upload_size
        });

    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi lấy cấu hình hệ thống", error: error.message });
    }
};

// 2. Cập nhật cấu hình hệ thống
const updateSystemSettings = async (req, res) => {
    // Hứng trọn vẹn các trường cũ và mới từ body của React gửi sang
    const { 
        theme_color, 
        enable_gantt, 
        enable_timeline, 
        work_days, 
        default_view, 
        admin_only_create_project, 
        max_upload_size 
    } = req.body;

    try {
        // Câu lệnh SQL chèn hoặc cập nhật trực tiếp vào dòng id = 1
        const query = `
            INSERT INTO system_settings (id, theme_color, enable_gantt, enable_timeline, working_days, default_view, admin_only_create_project, max_upload_size)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                theme_color = VALUES(theme_color),
                enable_gantt = VALUES(enable_gantt),
                enable_timeline = VALUES(enable_timeline),
                working_days = VALUES(working_days),
                default_view = VALUES(default_view),
                admin_only_create_project = VALUES(admin_only_create_project),
                max_upload_size = VALUES(max_upload_size)
        `;

        // Chuẩn bị mảng dữ liệu, ép các giá trị boolean từ JS thành số 0/1 để lưu vào MySQL
        await db.execute(query, [
            theme_color || '#2563EB', 
            enable_gantt ?? true ? 1 : 0, 
            enable_timeline ?? true ? 1 : 0, 
            work_days || 'Mon,Tue,Wed,Thu,Fri',
            default_view || 'kanban',
            admin_only_create_project ? 1 : 0,
            parseInt(max_upload_size, 10) || 10
        ]);

        return res.status(200).json({ message: "Cập nhật cấu hình hệ thống thành công!" });

    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi lưu cấu hình hệ thống", error: error.message });
    }
};

module.exports = {
    getSystemSettings,
    updateSystemSettings
};