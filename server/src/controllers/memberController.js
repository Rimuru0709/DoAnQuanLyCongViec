const db = require("../config/db");

const getMembersByProject = (req, res) => {
    const { projectId } = req.params;

    const sql = `
        SELECT 
            pm.id,
            pm.project_id,
            pm.user_id,
            pm.position,
            pm.role_in_project,
            pm.joined_at,
            u.full_name,
            u.email,
            u.avatar,
            u.phone,
            u.role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?
        ORDER BY pm.id DESC
    `;

    db.query(sql, [projectId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

const addMember = (req, res) => {
    const { project_id, user_id, position, role_in_project } = req.body;

    const sql = `
        INSERT INTO project_members
        (project_id, user_id, position, role_in_project)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            project_id,
            user_id,
            position || "",
            role_in_project || "MEMBER"
        ],
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        message: "Thành viên này đã có trong dự án"
                    });
                }

                return res.status(500).json(err);
            }

            res.json({
                message: "Thêm thành viên thành công",
                id: result.insertId
            });
        }
    );
};

const updateMember = (req, res) => {
    const { id } = req.params;
    const { position, role_in_project } = req.body;

    const sql = `
        UPDATE project_members
        SET position = ?, role_in_project = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            position || "",
            role_in_project || "MEMBER",
            id
        ],
        (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Cập nhật thành viên thành công"
            });
        }
    );
};

const deleteMember = (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM project_members WHERE id = ?",
        [id],
        (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Xóa thành viên thành công"
            });
        }
    );
};

const getAllUsers = (req, res) => {
    const sql = `
        SELECT id, full_name, email, avatar, phone, role
        FROM users
        ORDER BY full_name ASC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

module.exports = {
    getMembersByProject,
    addMember,
    updateMember,
    deleteMember,
    getAllUsers
};
