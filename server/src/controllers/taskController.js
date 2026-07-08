const TaskModel = require("../models/taskModel");

const getAllTasks = (req, res) => {
    TaskModel.getAll((err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

const getTasksByProject = (req, res) => {
    const { projectId } = req.params;

    TaskModel.getByProject(projectId, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

const addTask = (req, res) => {
    const data = req.body;

    TaskModel.create(data, (err, result) => {
        if (err) return res.status(500).json(err);

        TaskModel.updateProjectProgress(data.project_id, (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Thêm công việc thành công",
                id: result.insertId
            });
        });
    });
};

const updateTask = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    TaskModel.update(id, data, (err) => {
        if (err) return res.status(500).json(err);

        TaskModel.updateProjectProgress(data.project_id, (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Cập nhật công việc thành công"
            });
        });
    });
};

const deleteTask = (req, res) => {
    const { id } = req.params;

    TaskModel.getById(id, (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy công việc"
            });
        }

        const projectId = result[0].project_id;

        TaskModel.delete(id, (err) => {
            if (err) return res.status(500).json(err);

            TaskModel.updateProjectProgress(projectId, (err) => {
                if (err) return res.status(500).json(err);

                res.json({
                    message: "Xóa công việc thành công"
                });
            });
        });
    });
};

module.exports = {
    getAllTasks,
    getTasksByProject,
    addTask,
    updateTask,
    deleteTask
};