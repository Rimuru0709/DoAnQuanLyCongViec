const db = require("../config/db");

// 1. Thống kê tổng quan: Tổng số dự án, Tổng số file, và Tổng dung lượng hệ thống (Bytes)
const getGeneralStats = (callback) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM projects) AS total_projects,
            (SELECT COUNT(*) FROM documents) AS total_files,
            (SELECT IFNULL(SUM(file_size), 0) FROM documents) AS total_size_bytes
    `;
    db.query(sql, [], callback);
};

// 2. Thống kê số lượng tài liệu và dung lượng theo từng dự án
const getStatsByProject = (callback) => {
    const sql = `
        SELECT 
            p.id AS project_id,
            p.name AS project_name,
            COUNT(d.id) AS file_count,
            IFNULL(SUM(d.file_size), 0) AS total_size_bytes
        FROM projects p
        LEFT JOIN documents d ON p.id = d.project_id
        GROUP BY p.id, p.name
        ORDER BY file_count DESC
    `;
    db.query(sql, [], callback);
};

// 3. Thống kê số lượng file dựa theo định dạng (PDF, DOCX, XLSX, PNG...) để vẽ biểu đồ hình tròn
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
    getStatsByFileType
};