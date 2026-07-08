const db = require("../config/db");

const getByProject = (projectId, callback) => {
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

    db.query(sql, [projectId], callback);
};

const create = (data, callback) => {
    const sql = `
        INSERT INTO project_members
        (project_id, user_id, position, role_in_project)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            data.project_id,
            data.user_id,
            data.position || "",
            data.role_in_project || "MEMBER"
        ],
        callback
    );
};

const update = (id, data, callback) => {
    const sql = `
        UPDATE project_members
        SET position = ?, role_in_project = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            data.position || "",
            data.role_in_project || "MEMBER",
            id
        ],
        callback
    );
};

const remove = (id, callback) => {
    db.query(
        "DELETE FROM project_members WHERE id = ?",
        [id],
        callback
    );
};

const getAllUsers = (callback) => {
    const sql = `
        SELECT id, full_name, email, avatar, phone, role
        FROM users
        ORDER BY full_name ASC
    `;

    db.query(sql, callback);
};

module.exports = {
    getByProject,
    create,
    update,
    remove,
    getAllUsers
};