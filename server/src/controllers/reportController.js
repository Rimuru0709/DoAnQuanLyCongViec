const ReportModel = require("../models/reportModel");

// Hàm bổ trợ chuyển đổi dung lượng từ Bytes sang định dạng dễ đọc (KB, MB, GB)
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// [GET] Lấy toàn bộ dữ liệu báo cáo tổng hợp
const getDashboardReport = (req, res) => {
    // Sử dụng cơ chế Promise hoặc xử lý lồng nhau gọn gàng để gom dữ liệu từ 3 hàm thống kê
    ReportModel.getGeneralStats((err, generalRes) => {
        if (err) return res.status(500).json({ message: "Lỗi thống kê tổng quan", error: err });

        ReportModel.getStatsByProject((projectErr, projectRes) => {
            if (projectErr) return res.status(500).json({ message: "Lỗi thống kê theo dự án", error: projectErr });

            ReportModel.getStatsByFileType((typeErr, typeRes) => {
                if (typeErr) return res.status(500).json({ message: "Lỗi thống kê theo loại file", error: typeErr });

                // Xử lý dữ liệu tổng quan trước khi trả về Client
                const general = generalRes[0];
                
                // Trả về cấu trúc JSON phân loại rõ ràng, sẵn sàng cho Front-end React vẽ UI/Biểu đồ
                return res.status(200).json({
                    summary: {
                        totalProjects: general.total_projects,
                        totalFiles: general.total_files,
                        formattedTotalSize: formatBytes(Number(general.total_size_bytes)),
                        rawTotalSizeBytes: general.total_size_bytes
                    },
                    projects: projectRes.map(proj => ({
                        id: proj.project_id,
                        name: proj.project_name,
                        fileCount: proj.file_count,
                        storageUsed: formatBytes(Number(proj.total_size_bytes))
                    })),
                    fileTypes: typeRes.map(t => ({
                        type: t.file_type || "UNKNOWN",
                        count: t.count
                    }))
                });
            });
        });
    });
};

module.exports = {
    getDashboardReport
};