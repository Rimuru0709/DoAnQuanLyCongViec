const ProjectModel = require("../models/projectModel");

// Lấy tất cả dự án
const getProjects = (req, res) => {
    ProjectModel.getAll((err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json(result);
    });
};

// Lấy các dự án đã lưu trữ
const getArchivedProjects = (req, res) => {
    ProjectModel.getArchived((err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json(result);
    });
};

// Lấy dự án theo ID
const getProjectById = (req, res) => {
    const { id } = req.params;

    ProjectModel.getById(id, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy dự án"
            });
        }

        res.json(result[0]);
    });
};

// Thêm dự án
const addProject = (req, res) => {
    const data = req.body;

    ProjectModel.create(data, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Thêm dự án thành công",
            id: result.insertId
        });
    });
};

// Cập nhật dự án
const updateProject = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    ProjectModel.update(id, data, (err) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Cập nhật dự án thành công"
        });
    });
};

// Xóa dự án
const deleteProject = (req, res) => {
    const { id } = req.params;

    ProjectModel.delete(id, (err) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Xóa dự án thành công"
        });
    });
};

// Lưu trữ dự án
const archiveProject = (req, res) => {
    const { id } = req.params;

    ProjectModel.archive(id, (err) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Lưu trữ dự án thành công"
        });
    });
};

// Khôi phục dự án
const restoreProject = (req, res) => {
    const { id } = req.params;

    ProjectModel.restore(id, (err) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Khôi phục dự án thành công"
        });
    });
};

// Nhân bản dự án
const duplicateProject = (req, res) => {
    const { id } = req.params;

    ProjectModel.duplicate(id, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Nhân bản dự án thành công",
            id: result.insertId
        });
    });
};

module.exports = {
    getProjects,
    getArchivedProjects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    duplicateProject
};