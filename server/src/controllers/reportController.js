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

// [GET] Lấy dữ liệu báo cáo tổng hợp (Hỗ trợ lọc theo Tên Dự án, Tháng, Năm từ hiện tại về sau)
const getDashboardReport = async (req, res) => {
    try {
        // 1. Lấy thông tin Năm hiện tại để tính toán giới hạn bộ lọc động
        const currentYear = new Date().getFullYear(); // Năm 2026

        // 2. Nhận các tham số truy vấn từ Client Front-end gửi lên
        // Hỗ trợ tìm kiếm theo Tên dự án (projectName), Tháng (month) và Năm (year)
        const projectName = req.query.projectName || "";
        const month = req.query.month ? parseInt(req.query.month, 10) : null;
        let year = req.query.year ? parseInt(req.query.year, 10) : null;

        // Xử lý logic nghiệp vụ: Nếu người dùng chọn năm trước năm hiện hành, tự động ép về năm hiện tại
        if (year && year < currentYear) {
            year = currentYear;
        }

        // Tạo đối tượng filters chuẩn để truyền xuống Model
        const filters = {
            projectName,
            month,
            year
        };

        // 3. Chạy đồng thời cả 3 hàm thống kê bằng Promise.all để tối ưu hiệu năng
        const [generalRes, projectRes, taskRes] = await Promise.all([
            getGeneralStatsPromise(filters),
            getStatsByProjectPromise(filters),
            getTaskStatsPromise(filters) 
        ]);

        const general = generalRes[0] || {};
        const taskStats = taskRes[0] || { todo: 0, in_progress: 0, done: 0, overdue: 0 };

        // Tính tổng số lượng task trên hệ thống
        const totalTasks = Number(taskStats.todo || 0) + 
                           Number(taskStats.in_progress || 0) + 
                           Number(taskStats.done || 0) + 
                           Number(taskStats.overdue || 0);

        // 4. Tạo danh sách năm gợi ý từ năm hiện hành về sau (ví dụ: tạo danh sách 6 năm tới)
        const yearsDropdown = [];
        for (let i = 0; i <= 5; i++) {
            yearsDropdown.push(currentYear + i);
        }

        // 5. Trả về cấu trúc JSON chuẩn khít với Front-end React kèm dữ liệu năm gợi ý
        return res.status(200).json({
            summary: {
                totalProjects: general.total_projects || 0,
                totalFiles: general.total_files || 0,
                totalTasks: totalTasks, 
                formattedTotalSize: formatBytes(Number(general.total_size_bytes || 0)),
                rawTotalSizeBytes: general.total_size_bytes || 0
            },
            projects: projectRes.map(proj => ({
                id: proj.project_id,
                name: proj.project_name,
                fileCount: proj.file_count,
                storageUsed: formatBytes(Number(proj.total_size_bytes || 0)),
                rawTotalSizeBytes: proj.total_size_bytes || 0 
            })),
            taskSummary: { 
                todo: Number(taskStats.todo || 0),
                inProgress: Number(taskStats.in_progress || 0),
                done: Number(taskStats.done || 0),
                overdue: Number(taskStats.overdue || 0)
            },
            availableYears: yearsDropdown 
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