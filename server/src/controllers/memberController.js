const Member = require("../models/memberModel");

const getMembersByProject = (req, res) => {
    const { projectId } = req.params;

    Member.getByProject(projectId, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

const addMember = (req, res) => {
    Member.create(req.body, (err, result) => {
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
    });
};

const updateMember = (req, res) => {
    const { id } = req.params;

    Member.update(id, req.body, (err) => {
        if (err) return res.status(500).json(err);

        res.json({
            message: "Cập nhật thành viên thành công"
        });
    });
};

const deleteMember = (req, res) => {
    const { id } = req.params;

    Member.remove(id, (err) => {
        if (err) return res.status(500).json(err);

        res.json({
            message: "Xóa thành viên thành công"
        });
    });
};

const getAllUsers = (req, res) => {
    Member.getAllUsers((err, result) => {
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