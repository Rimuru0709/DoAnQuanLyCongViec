const db = require("../config/db");

// Hàm helper để bọc các câu lệnh truy vấn thành Promise
const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        // Đổi từ db.execute sang db.query để tương thích tuyệt đối với mọi cấu hình thư viện mysql/mysql2 cũ và mới
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const DocumentModel = {
    // 1. Lấy phiên bản mới nhất của file trong dự án
    getLatestVersion: async (projectId, fileName) => {
        const sql = `
            SELECT version
            FROM documents
            WHERE project_id = ?
              AND file_name = ?
            ORDER BY id DESC
            LIMIT 1
        `;
        return queryPromise(sql, [Number(projectId), fileName]);
    },

    // 2. Tạo mới tài liệu vào DB
    createDocument: async (data) => {
        const sql = `
            INSERT INTO documents
            (
                project_id,
                file_name,
                file_path,
                file_type,
                file_size,
                uploaded_by,
                version
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return queryPromise(sql, [
            Number(data.project_id),
            data.file_name,
            data.file_path,
            data.file_type,
            Number(data.file_size) || 0,
            data.uploaded_by,
            data.version || "v1.0"
        ]);
    },

    // 3. Lấy danh sách tài liệu thuộc một dự án
    getByProject: async (projectId) => {
        const sql = `
            SELECT
                id,
                project_id,
                file_name,
                file_path,
                file_type,
                file_size,
                uploaded_by,
                version,
                created_at
            FROM documents
            WHERE project_id = ?
            ORDER BY id DESC
        `;
        return queryPromise(sql, [Number(projectId)]);
    },

    // 4. Tìm kiếm tài liệu theo ID cụ thể
    getById: async (id) => {
        const sql = `
            SELECT *
            FROM documents
            WHERE id = ?
            LIMIT 1
        `;
        return queryPromise(sql, [Number(id)]);
    },

    // 5. Xóa tài liệu khỏi DB theo ID
    deleteById: async (id) => {
        const sql = `
            DELETE FROM documents
            WHERE id = ?
        `;
        return queryPromise(sql, [Number(id)]);
    },

    // 6. Tính tổng dung lượng các file đã lưu để gửi lên Dashboard UI
    getStorageSize: async () => {
        const sql = `
            SELECT SUM(file_size) as totalSize 
            FROM documents
        `;
        return queryPromise(sql, []);
    }
};

module.exports = DocumentModel;