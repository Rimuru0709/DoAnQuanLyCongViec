const ReportModel = require("../models/reportModel");

// Hàm bổ trợ chuyển đổi dung lượng từ Bytes sang định dạng dễ đọc
const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Chuyển đổi các hàm callback cũ của Model sang Promise để dùng async/await
const getGeneralStatsPromise = (filters) => new Promise((res, rej) => ReportModel.getGeneralStats(filters, (err, data) => err ? rej(err) : res(data)));
const getStatsByProjectPromise = (filters) => new Promise((res, rej) => ReportModel.getStatsByProject(filters, (err, data) => err ? rej(err) : res(data)));
const getTaskStatsPromise = (filters) => new Promise((res, rej) => ReportModel.getTaskStats(filters, (err, data) => err ? rej(err) : res(data)));

// [GET] Lấy dữ liệu báo cáo tổng hợp (Hỗ trợ Bộ lọc thời gian & Dự án)
const getDashboardReport = async (req, res) => {
    try {
        // 1. Lấy các tham số bộ lọc từ URL query (ví dụ: ?project=all&time=month)
        const filters = {
            projectId: req.query.project || "all",
            timeRange: req.query.time || "month"
        };

        // 2. Chạy đồng thời cả 3 hàm thống kê bằng Promise.all để tối ưu hiệu năng
        const [generalRes, projectRes, taskRes] = await Promise.all([
            getGeneralStatsPromise(filters),
            getStatsByProjectPromise(filters),
            getTaskStatsPromise(filters) // Hàm mới bổ sung cho biểu đồ tròn
        ]);

        const general = generalRes[0] || {};
        const taskStats = taskRes[0] || { todo: 0, in_progress: 0, done: 0, overdue: 0 };

        // Tính tổng số lượng task trên hệ thống
        const totalTasks = Number(taskStats.todo || 0) + 
                           Number(taskStats.in_progress || 0) + 
                           Number(taskStats.done || 0) + 
                           Number(taskStats.overdue || 0);

        // 3. Trả về cấu trúc JSON chuẩn khít với Front-end React
        return res.status(200).json({
            summary: {
                totalProjects: general.total_projects || 0,
                totalFiles: general.total_files || 0,
                totalTasks: totalTasks, // Đã bổ sung biến đếm task tổng
                formattedTotalSize: formatBytes(Number(general.total_size_bytes || 0)),
                rawTotalSizeBytes: general.total_size_bytes || 0
            },
            projects: projectRes.map(proj => ({
                id: proj.project_id,
                name: proj.project_name,
                fileCount: proj.file_count,
                storageUsed: formatBytes(Number(proj.total_size_bytes || 0)),
                rawTotalSizeBytes: proj.total_size_bytes || 0 // FIX: Đã bổ sung trường này cho biểu đồ Recharts vẽ cột
            })),
            taskSummary: { // Đối tượng mới tinh phục vụ biểu đồ tròn
                todo: Number(taskStats.todo || 0),
                inProgress: Number(taskStats.in_progress || 0),
                done: Number(taskStats.done || 0),
                overdue: Number(taskStats.overdue || 0)
            }
        });

    } catch (error) {
        console.error("Lỗi Controller Báo Cáo:", error);
        return res.status(500).json({ 
            message: "Hệ thống không thể tổng hợp báo cáo", 
            error: error.message 
        });
    }
};

module.exports = {
    getDashboardReport
};