const db = require('../config/db'); // File kết nối cơ sở dữ liệu MySQL của bạn

// 1. Lấy cấu hình của một dự án
const getProjectSettings = async (req, res) => {
    const { projectId } = req.params;

    try {
        const query = 'SELECT * FROM project_settings WHERE project_id = ?';
        const [rows] = await db.execute(query, [projectId]);

        if (rows.length === 0) {
            // Nếu dự án mới tạo chưa có bản ghi cài đặt, trả về cấu hình mặc định hoặc tự động chèn mới
            return res.status(200).json({
                project_id: parseInt(projectId),
                theme_color: '#2563EB',
                enable_gantt: true,
                enable_timeline: true,
                working_days: 'Mon,Tue,Wed,Thu,Fri'
            });
        }

        // Chuyển đổi dữ liệu BOOLEAN (0/1 trong MySQL) thành true/false cho React
        const settings = rows[0];
        return res.status(200).json({
            ...settings,
            enable_gantt: !!settings.enable_gantt,
            enable_timeline: !!settings.enable_timeline
        });

    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi lấy cấu hình dự án", error: error.message });
    }
};

// 2. Cập nhật hoặc Khởi tạo cấu hình dự án
const updateProjectSettings = async (req, res) => {
    const { projectId } = req.params;
    const { theme_color, enable_gantt, enable_timeline, working_days } = req.body;

    try {
        // Sử dụng câu lệnh ON DUPLICATE KEY UPDATE vì project_id là UNIQUE
        const query = `
            INSERT INTO project_settings (project_id, theme_color, enable_gantt, enable_timeline, working_days)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                theme_color = VALUES(theme_color),
                enable_gantt = VALUES(enable_gantt),
                enable_timeline = VALUES(enable_timeline),
                working_days = VALUES(working_days)
        `;

        await db.execute(query, [
            projectId, 
            theme_color || '#2563EB', 
            enable_gantt ?? true, 
            enable_timeline ?? true, 
            working_days || 'Mon,Tue,Wed,Thu,Fri'
        ]);

        return res.status(200).json({ message: "Cập nhật cấu hình dự án thành công!" });

    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi lưu cấu hình dự án", error: error.message });
    }
};

module.exports = {
    getProjectSettings,
    updateProjectSettings
};