const db = require("../config/db");

const getProjects = (req, res) => {
    const sql = `
        SELECT 
            p.*,
            IFNULL(ROUND(AVG(t.progress)), 0) AS progress
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id
        ORDER BY p.id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

const getProjectById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT 
            p.*,
            IFNULL(ROUND(AVG(t.progress)), 0) AS progress
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.id = ?
        GROUP BY p.id
    `;

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy dự án" });
        }

        res.json(result[0]);
    });
};

const addProject = (req, res) => {
    const {
        name,
        description,
        customer,
        manager_name,
        start_date,
        end_date,
        status,
        progress,
        created_by
    } = req.body;

    const sql = `
        INSERT INTO projects
        (name, description, customer, manager_name, start_date, end_date, status, progress, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            description,
            customer,
            manager_name,
            start_date,
            end_date,
            status,
            progress,
            created_by
        ],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Thêm dự án thành công",
                id: result.insertId
            });
        }
    );
};

const updateProject = (req, res) => {
    const { id } = req.params;

    const {
        name,
        description,
        customer,
        manager_name,
        start_date,
        end_date,
        status,
        progress
    } = req.body;

    const sql = `
        UPDATE projects
        SET name = ?, description = ?, customer = ?, manager_name = ?, start_date = ?, end_date = ?, status = ?, progress = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name,
            description,
            customer,
            manager_name,
            start_date,
            end_date,
            status,
            progress,
            id
        ],
        (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Cập nhật dự án thành công"
            });
        }
    );
};

const deleteProject = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM projects WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Xóa dự án thành công" });
    });
};

const archiveProject = (req, res) => {
    const { id } = req.params;

    db.query(
        "UPDATE projects SET status = 'TAM_DUNG' WHERE id = ?",
        [id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Lưu trữ dự án thành công" });
        }
    );
};

const duplicateProject = (req, res) => {
    const { id } = req.params;

    const sql = `
        INSERT INTO projects
        (name, description, customer, manager_name, start_date, end_date, status, progress, created_by)
        SELECT 
            CONCAT(name, ' (Copy)'), 
            description,
            customer,
            manager_name,
            start_date, 
            end_date, 
            'SAP_TOI', 
            0, 
            created_by
        FROM projects
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
            message: "Nhân bản dự án thành công",
            id: result.insertId
        });
    });
};

module.exports = {
    getProjects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    duplicateProject
};
