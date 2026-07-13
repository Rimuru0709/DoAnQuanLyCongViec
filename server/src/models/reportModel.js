const db = require("../config/db");

// 1. Thống kê tổng quan: Tổng số dự án, Tổng số file, và Tổng dung lượng (Có hỗ trợ lọc)
const getGeneralStats = (filters, callback) => {
    let sql = `
        SELECT 
            (SELECT COUNT(*) FROM projects WHERE 1=1 #FILTER_PROJECT#) AS total_projects,
            (SELECT COUNT(*) FROM documents WHERE 1=1 #FILTER_DOCUMENT#) AS total_files,
            (SELECT IFNULL(SUM(file_size), 0) FROM documents WHERE 1=1 #FILTER_DOCUMENT#) AS total_size_bytes
    `;
    
    let params = [];
    let projectFilter = "";
    let documentFilter = "";

    // Nếu người dùng chọn một dự án cụ thể thay vì "Tất cả"
    if (filters.projectId && filters.projectId !== "all") {
        projectFilter += " AND id = ?";
        documentFilter += " AND project_id = ?";
        params.push(filters.projectId, filters.projectId, filters.projectId); // Truyền tham số cho 3 subquery
    } else {
        // Nếu chọn "all", ta có thể giả định truyền giá trị ảo hoặc không truyền tùy cấu trúc ép chuỗi
        params = [];
    }

    sql = sql.replace("#FILTER_PROJECT#", projectFilter)
             .replace("#FILTER_DOCUMENT#", documentFilter)
             .replace("#FILTER_DOCUMENT#", documentFilter);

    db.query(sql, params, callback);
};

// 2. Thống kê số lượng tài liệu và dung lượng theo từng dự án (Có hỗ trợ lọc)
const getStatsByProject = (filters, callback) => {
    let sql = `
        SELECT 
            p.id AS project_id,
            p.name AS project_name,
            COUNT(d.id) AS file_count,
            IFNULL(SUM(d.file_size), 0) AS total_size_bytes
        FROM projects p
        LEFT JOIN documents d ON p.id = d.project_id
        WHERE 1=1
    `;
    
    const params = [];
    if (filters.projectId && filters.projectId !== "all") {
        sql += ` AND p.id = ?`;
        params.push(filters.projectId);
    }

    sql += ` GROUP BY p.id, p.name ORDER BY file_count DESC`;
    
    db.query(sql, params, callback);
};

// 3. TÍNH NĂNG MỚI: Thống kê số lượng Task theo trạng thái để vẽ biểu đồ tròn (Đồng bộ dashboard)
const getTaskStats = (filters, callback) => {
    let sql = `
        SELECT 
            SUM(CASE WHEN status = 'CHUA_LAM' THEN 1 ELSE 0 END) AS todo,
            SUM(CASE WHEN status = 'DANG_LAM' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN status = 'DANG_REVIEW' THEN 1 ELSE 0 END) AS in_progress_review,
            SUM(CASE WHEN status = 'HOAN_THANH' THEN 1 ELSE 0 END) AS done,
            SUM(CASE WHEN status = 'QUA_HAN' OR (status != 'HOAN_THANH' AND end_date < NOW()) THEN 1 ELSE 0 END) AS overdue
        FROM tasks
        WHERE 1=1
    `;
    
    const params = [];
    if (filters.projectId && filters.projectId !== "all") {
        sql += ` AND project_id = ?`;
        params.push(filters.projectId);
    }

    // FIX: Lọc chuẩn xác theo mốc thời gian lịch thực tế thay vì tính lùi khoảng ngày
    if (filters.timeRange) {
        if (filters.timeRange === "week") {
            sql += ` AND YEARWEEK(start_date, 1) = YEARWEEK(NOW(), 1)`;
        } else if (filters.timeRange === "month") {
            sql += ` AND YEAR(start_date) = YEAR(NOW()) AND MONTH(start_date) = MONTH(NOW())`;
        } else if (filters.timeRange === "quarter") {
            sql += ` AND QUARTER(start_date) = QUARTER(NOW()) AND YEAR(start_date) = YEAR(NOW())`;
        }
    }

    db.query(sql, params, callback);
};

// 4. Giữ lại hàm thống kê loại file cũ nếu bạn vẫn cần dùng ở các cấu phần khác
const getStatsByFileType = (callback) => {
    const sql = `
        SELECT 
            file_type,
            COUNT(*) AS count
        FROM documents
        GROUP BY file_type
        ORDER BY count DESC
    `;
    db.query(sql, [], callback);
};

module.exports = {
    getGeneralStats,
    getStatsByProject,
    getTaskStats,      // Đã export hàm mới
    getStatsByFileType
};