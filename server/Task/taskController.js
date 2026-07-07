const db = require("../db");

// Lấy công việc theo dự án
const getTasksByProject = (req, res) => {
    const { projectId } = req.params;

    const sql = `
        SELECT tasks.*, users.full_name AS assignee_name
        FROM tasks
        LEFT JOIN users ON tasks.assigned_to = users.id
        WHERE tasks.project_id = ?
        ORDER BY tasks.id DESC
    `;

    db.query(sql, [projectId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

// Thêm công việc
const addTask = (req, res) => {
    const {
        project_id,
        title,
        description,
        assigned_to,
        start_date,
        end_date,
        status,
        priority,
        progress
    } = req.body;

    const sql = `
        INSERT INTO tasks
        (project_id, title, description, assigned_to, start_date, end_date, status, priority, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            project_id,
            title,
            description,
            assigned_to || null,
            start_date,
            end_date,
            status,
            priority,
            progress
        ],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Thêm công việc thành công",
                id: result.insertId
            });
        }
    );
};

// Cập nhật công việc
const updateTask = (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_to, start_date, end_date, status, priority, progress } = req.body;

    const sql = `
        UPDATE tasks
        SET title = ?, description = ?, assigned_to = ?, start_date = ?, end_date = ?, status = ?, priority = ?, progress = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [title, description, assigned_to || null, start_date, end_date, status, priority, progress, id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Cập nhật công việc thành công" });
        }
    );
};

// Xóa công việc
const deleteTask = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM tasks WHERE id = ?";

    db.query(sql, [id], (err) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Xóa công việc thành công",
        });
    });
};;

// Lấy tất cả công việc của tất cả dự án
const getAllTasks = (req, res) => {
    const sql = `
        SELECT 
            tasks.*,
            projects.name AS project_name,
            projects.customer AS customer,
            users.full_name AS assignee_name
        FROM tasks
        LEFT JOIN projects ON tasks.project_id = projects.id
        LEFT JOIN users ON tasks.assigned_to = users.id
        ORDER BY tasks.id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

module.exports = {
    getAllTasks,
    getTasksByProject,
    addTask,
    updateTask,
    deleteTask
};