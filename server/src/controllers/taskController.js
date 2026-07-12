const TaskModel = require("../models/taskModel");

const getAllTasks = (req, res) => {
    TaskModel.getAllByUser(
        req.user.id,
        req.user.role,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi lấy danh sách công việc:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể lấy danh sách công việc",
                    error: err.message
                });
            }

            return res.status(200).json(result);
        }
    );
};

const getTasksByProject = (req, res) => {
    const { projectId } = req.params;

    TaskModel.getByProjectForUser(
        projectId,
        req.user.id,
        req.user.role,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi lấy công việc theo dự án:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể lấy công việc của dự án",
                    error: err.message
                });
            }

            return res.status(200).json(result);
        }
    );
};

const addTask = (req, res) => {
    const data = req.body;

    if (!data.project_id) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng chọn dự án"
        });
    }

    if (!data.title || !data.title.trim()) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập tên công việc"
        });
    }

    TaskModel.canManageProject(
        data.project_id,
        req.user.id,
        req.user.role,
        (permissionErr, allowed) => {
            if (permissionErr) {
                console.error(
                    "Lỗi kiểm tra quyền dự án:",
                    permissionErr
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể kiểm tra quyền dự án"
                });
            }

            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Bạn không có quyền thêm công việc vào dự án này"
                });
            }

            TaskModel.addAssigneeToProjectIfMissing(
                data.project_id,
                data.assigned_to,
                (memberErr) => {
                    if (memberErr) {
                        console.error(
                            "Lỗi thêm người phụ trách vào dự án:",
                            memberErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Không thể thêm người phụ trách vào dự án",
                            error: memberErr.message
                        });
                    }

                    TaskModel.create(
                        data,
                        (err, result) => {
                            if (err) {
                                console.error(
                                    "Lỗi thêm công việc:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Không thể thêm công việc",
                                    error: err.message
                                });
                            }

                            TaskModel.updateProjectProgress(
                                data.project_id,
                                (progressErr) => {
                                    if (progressErr) {
                                        console.error(
                                            "Lỗi cập nhật tiến độ dự án:",
                                            progressErr
                                        );

                                        return res
                                            .status(500)
                                            .json({
                                                success: false,
                                                message:
                                                    "Đã thêm công việc nhưng không thể cập nhật tiến độ dự án",
                                                error:
                                                    progressErr.message
                                            });
                                    }

                                    return res
                                        .status(201)
                                        .json({
                                            success: true,
                                            message:
                                                "Thêm công việc thành công",
                                            id: result.insertId
                                        });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

const updateTask = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (!data.project_id) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng chọn dự án"
        });
    }

    if (!data.title || !data.title.trim()) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập tên công việc"
        });
    }

    TaskModel.getById(id, (findErr, taskResult) => {
        if (findErr) {
            console.error(
                "Lỗi kiểm tra công việc:",
                findErr
            );

            return res.status(500).json({
                success: false,
                message:
                    "Không thể kiểm tra công việc",
                error: findErr.message
            });
        }

        if (!taskResult || taskResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy công việc"
            });
        }

        const oldProjectId =
            taskResult[0].project_id;

        TaskModel.canManageProject(
            data.project_id,
            req.user.id,
            req.user.role,
            (permissionErr, allowed) => {
                if (permissionErr) {
                    console.error(
                        "Lỗi kiểm tra quyền dự án:",
                        permissionErr
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Không thể kiểm tra quyền dự án"
                    });
                }

                if (!allowed) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "Bạn không có quyền cập nhật công việc này"
                    });
                }

                TaskModel.addAssigneeToProjectIfMissing(
                    data.project_id,
                    data.assigned_to,
                    (memberErr) => {
                        if (memberErr) {
                            console.error(
                                "Lỗi thêm người phụ trách vào dự án:",
                                memberErr
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Không thể thêm người phụ trách vào dự án",
                                error:
                                    memberErr.message
                            });
                        }

                        TaskModel.update(
                            id,
                            data,
                            (err, result) => {
                                if (err) {
                                    console.error(
                                        "Lỗi cập nhật công việc:",
                                        err
                                    );

                                    return res
                                        .status(500)
                                        .json({
                                            success: false,
                                            message:
                                                "Không thể cập nhật công việc",
                                            error: err.message
                                        });
                                }

                                if (
                                    result.affectedRows === 0
                                ) {
                                    return res
                                        .status(404)
                                        .json({
                                            success: false,
                                            message:
                                                "Không tìm thấy công việc"
                                        });
                                }

                                TaskModel.updateProjectProgress(
                                    data.project_id,
                                    (newProgressErr) => {
                                        if (newProgressErr) {
                                            console.error(
                                                "Lỗi cập nhật tiến độ dự án mới:",
                                                newProgressErr
                                            );

                                            return res
                                                .status(500)
                                                .json({
                                                    success: false,
                                                    message:
                                                        "Đã cập nhật công việc nhưng không thể cập nhật tiến độ dự án",
                                                    error:
                                                        newProgressErr.message
                                                });
                                        }

                                        if (
                                            Number(oldProjectId) !==
                                            Number(
                                                data.project_id
                                            )
                                        ) {
                                            return TaskModel.updateProjectProgress(
                                                oldProjectId,
                                                (
                                                    oldProgressErr
                                                ) => {
                                                    if (
                                                        oldProgressErr
                                                    ) {
                                                        console.error(
                                                            "Lỗi cập nhật tiến độ dự án cũ:",
                                                            oldProgressErr
                                                        );

                                                        return res
                                                            .status(
                                                                500
                                                            )
                                                            .json({
                                                                success: false,
                                                                message:
                                                                    "Đã cập nhật công việc nhưng không thể cập nhật tiến độ dự án cũ",
                                                                error:
                                                                    oldProgressErr.message
                                                            });
                                                    }

                                                    return res.json({
                                                        success: true,
                                                        message:
                                                            "Cập nhật công việc thành công"
                                                    });
                                                }
                                            );
                                        }

                                        return res.json({
                                            success: true,
                                            message:
                                                "Cập nhật công việc thành công"
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
};

const deleteTask = (req, res) => {
    const { id } = req.params;

    TaskModel.getById(id, (err, result) => {
        if (err) {
            console.error(
                "Lỗi kiểm tra công việc:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Không thể kiểm tra công việc",
                error: err.message
            });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy công việc"
            });
        }

        const projectId =
            result[0].project_id;

        TaskModel.canManageProject(
            projectId,
            req.user.id,
            req.user.role,
            (permissionErr, allowed) => {
                if (permissionErr) {
                    console.error(
                        "Lỗi kiểm tra quyền dự án:",
                        permissionErr
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Không thể kiểm tra quyền dự án"
                    });
                }

                if (!allowed) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "Bạn không có quyền xóa công việc này"
                    });
                }

                TaskModel.delete(
                    id,
                    (deleteErr, deleteResult) => {
                        if (deleteErr) {
                            console.error(
                                "Lỗi xóa công việc:",
                                deleteErr
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Không thể xóa công việc",
                                error:
                                    deleteErr.message
                            });
                        }

                        if (
                            deleteResult.affectedRows === 0
                        ) {
                            return res
                                .status(404)
                                .json({
                                    success: false,
                                    message:
                                        "Không tìm thấy công việc"
                                });
                        }

                        TaskModel.updateProjectProgress(
                            projectId,
                            (progressErr) => {
                                if (progressErr) {
                                    console.error(
                                        "Lỗi cập nhật tiến độ dự án:",
                                        progressErr
                                    );

                                    return res
                                        .status(500)
                                        .json({
                                            success: false,
                                            message:
                                                "Đã xóa công việc nhưng không thể cập nhật tiến độ dự án",
                                            error:
                                                progressErr.message
                                        });
                                }

                                return res.json({
                                    success: true,
                                    message:
                                        "Xóa công việc thành công"
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};

const updateTaskStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
        "CHUA_LAM",
        "DANG_LAM",
        "DANG_REVIEW",
        "HOAN_THANH",
        "QUA_HAN"
    ];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message:
                "Trạng thái công việc không hợp lệ"
        });
    }

    TaskModel.canUpdateStatus(
        id,
        req.user.id,
        req.user.role,
        (permissionErr, allowed) => {
            if (permissionErr) {
                console.error(
                    "Lỗi kiểm tra quyền công việc:",
                    permissionErr
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể kiểm tra quyền công việc"
                });
            }

            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Bạn không có quyền cập nhật trạng thái công việc này"
                });
            }

            TaskModel.getById(
                id,
                (err, result) => {
                    if (err) {
                        console.error(
                            "Lỗi kiểm tra công việc:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Không thể kiểm tra công việc",
                            error: err.message
                        });
                    }

                    if (
                        !result ||
                        result.length === 0
                    ) {
                        return res
                            .status(404)
                            .json({
                                success: false,
                                message:
                                    "Không tìm thấy công việc"
                            });
                    }

                    const projectId =
                        result[0].project_id;

                    TaskModel.updateStatus(
                        id,
                        status,
                        (
                            statusErr,
                            statusResult
                        ) => {
                            if (statusErr) {
                                console.error(
                                    "Lỗi cập nhật trạng thái:",
                                    statusErr
                                );

                                return res
                                    .status(500)
                                    .json({
                                        success: false,
                                        message:
                                            "Không thể cập nhật trạng thái công việc",
                                        error:
                                            statusErr.message
                                    });
                            }

                            if (
                                statusResult.affectedRows ===
                                0
                            ) {
                                return res
                                    .status(404)
                                    .json({
                                        success: false,
                                        message:
                                            "Không tìm thấy công việc"
                                    });
                            }

                            TaskModel.updateProjectProgress(
                                projectId,
                                (progressErr) => {
                                    if (
                                        progressErr
                                    ) {
                                        console.error(
                                            "Lỗi cập nhật tiến độ dự án:",
                                            progressErr
                                        );

                                        return res
                                            .status(500)
                                            .json({
                                                success: false,
                                                message:
                                                    "Đã cập nhật trạng thái nhưng không thể cập nhật tiến độ dự án",
                                                error:
                                                    progressErr.message
                                            });
                                    }

                                    return res.json({
                                        success: true,
                                        message:
                                            "Cập nhật trạng thái công việc thành công"
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

module.exports = {
    getAllTasks,
    getTasksByProject,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus
};