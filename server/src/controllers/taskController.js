const TaskModel      = require("../models/taskModel");
const ActivityModel  = require("../models/activityModel");
const NotifModel     = require("../models/notificationModel");
const db             = require("../config/db");

/* ── Helper: ghi activity log (fire-and-forget) ── */
const logActivity = (params) => ActivityModel.log(params, null);

/* ── Helper: emit socket task:updated ── */
const emitTaskUpdate = (req, taskId, payload) => {
    try {
        const io = req.app?.get?.("io");
        if (io) {
            io.to("global").emit("task:updated", { taskId, ...payload });
        }
    } catch (e) { /* ignore */ }
};

/* ── Helper: automation rules ── */
const runAutomation = (task, newStatus, userId) => {
    if (!task || !newStatus) return;

    // Rule 1: Khi chuyển sang HOAN_THANH → ghi completed_at
    if (newStatus === "HOAN_THANH" && !task.completed_at) {
        db.query(
            "UPDATE tasks SET completed_at = NOW() WHERE id = ? AND completed_at IS NULL",
            [task.id],
            (err) => { if (err) console.error("Automation completed_at:", err.message); }
        );
    }
};

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
    const taskId = Number(req.params.id);
    const user = req.user;
    const requestData = req.body;

    if (
        !Number.isInteger(taskId) ||
        taskId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Mã công việc không hợp lệ"
        });
    }

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Bạn chưa đăng nhập"
        });
    }

    TaskModel.getById(
        taskId,
        (findError, taskResult) => {
            if (findError) {
                console.error(
                    "Lỗi kiểm tra công việc:",
                    findError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể kiểm tra công việc",
                    error: findError.message
                });
            }

            if (
                !Array.isArray(taskResult) ||
                taskResult.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy công việc"
                });
            }

            const oldTask = taskResult[0];
            const projectId =
                Number(oldTask.project_id);

            const isAdmin =
                user.role === "ADMIN";

            const isManager =
                user.role === "MANAGER";

            const isMember =
                user.role === "MEMBER";

            const isTaskAssignee =
                Number(oldTask.assigned_to) ===
                Number(user.id);

            /*
            |--------------------------------------------------------------------------
            | MEMBER
            |--------------------------------------------------------------------------
            | Chỉ được sửa trạng thái và tiến độ
            | của công việc được giao cho chính mình.
            */

            if (isMember) {
                if (!isTaskAssignee) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "Bạn không được giao công việc này"
                    });
                }

                const validStatuses = [
                    "CHUA_LAM",
                    "DANG_LAM",
                    "DANG_REVIEW",
                    "HOAN_THANH",
                    "QUA_HAN"
                ];

                const status =
                    requestData.status ||
                    oldTask.status;

                if (
                    !validStatuses.includes(status)
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Trạng thái công việc không hợp lệ"
                    });
                }

                let progress = Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            requestData.progress ??
                            oldTask.progress
                        ) || 0
                    )
                );

                // Tự đồng bộ tiến độ theo trạng thái
                if (status === "CHUA_LAM") {
                    progress = 0;
                }

                if (status === "DANG_LAM") {
                    progress = Math.min(
                        89,
                        Math.max(1, progress)
                    );
                }

                if (status === "DANG_REVIEW") {
                    progress = 90;
                }

                if (status === "HOAN_THANH") {
                    progress = 100;
                }

                if (status === "QUA_HAN") {
                    progress = 0;
                }

                const memberUpdateData = {
                    project_id: projectId,
                    title: oldTask.title,
                    description:
                        oldTask.description || "",
                    assigned_to:
                        oldTask.assigned_to || null,
                    start_date:
                        oldTask.start_date || null,
                    end_date:
                        oldTask.end_date || null,
                    status,
                    priority:
                        oldTask.priority ||
                        "TRUNG_BINH",
                    progress
                };

                return TaskModel.updateStatusAndProgress(
                    taskId,
                    status,
                    progress,
                    (updateError, updateResult) => {
                        if (updateError) {
                            console.error(
                                "Lỗi Member cập nhật công việc:",
                                updateError
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Không thể cập nhật công việc",
                                error:
                                    updateError.message
                            });
                        }

                        if (
                            !updateResult ||
                            updateResult.affectedRows === 0
                        ) {
                            return res.status(404).json({
                                success: false,
                                message:
                                    "Không tìm thấy công việc"
                            });
                        }

                        TaskModel.updateProjectProgress(
                            projectId,
                            (progressError) => {
                                if (progressError) {
                                    console.error(
                                        "Lỗi cập nhật tiến độ dự án:",
                                        progressError
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Đã cập nhật công việc nhưng không thể cập nhật tiến độ dự án",
                                        error:
                                            progressError.message
                                    });
                                }

                                emitTaskUpdate(req, taskId, { status, progress, projectId });
                                return res.status(200).json({
                                    success: true,
                                    message:
                                        "Cập nhật trạng thái và tiến độ thành công"
                                });
                            }
                        );
                    }
                );
            } // PHẢI CÓ DẤU NÀY để đóng if (isMember)

            /*
            |--------------------------------------------------------------------------
            | ADMIN / MANAGER
            |--------------------------------------------------------------------------
            | Được sửa toàn bộ thông tin công việc.
            */
            /*
            |--------------------------------------------------------------------------
            | ADMIN / MANAGER
            |--------------------------------------------------------------------------
            | Được sửa toàn bộ thông tin công việc.
            */

            if (!isAdmin && !isManager) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Bạn không có quyền cập nhật công việc"
                });
            }

            const newProjectId =
                Number(
                    requestData.project_id ||
                    projectId
                );

            if (
                !Number.isInteger(newProjectId) ||
                newProjectId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Mã dự án không hợp lệ"
                });
            }

            const title =
                String(
                    requestData.title || ""
                ).trim();

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Vui lòng nhập tên công việc"
                });
            }

            if (
                requestData.start_date &&
                requestData.end_date &&
                new Date(requestData.end_date) <
                new Date(
                    requestData.start_date
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Deadline không được trước ngày bắt đầu"
                });
            }

            TaskModel.canManageProject(
                newProjectId,
                user.id,
                user.role,
                (permissionError, allowed) => {
                    if (permissionError) {
                        console.error(
                            "Lỗi kiểm tra quyền dự án:",
                            permissionError
                        );

                        return res
                            .status(500)
                            .json({
                                success: false,
                                message:
                                    "Không thể kiểm tra quyền dự án"
                            });
                    }

                    if (!allowed) {
                        return res
                            .status(403)
                            .json({
                                success: false,
                                message:
                                    "Bạn không có quyền cập nhật công việc này"
                            });
                    }

                    TaskModel.addAssigneeToProjectIfMissing(
                        newProjectId,
                        requestData.assigned_to,
                        (memberError) => {
                            if (memberError) {
                                console.error(
                                    "Lỗi thêm người phụ trách vào dự án:",
                                    memberError
                                );

                                return res
                                    .status(500)
                                    .json({
                                        success: false,
                                        message:
                                            "Không thể thêm người phụ trách vào dự án",
                                        error:
                                            memberError.message
                                    });
                            }

                            const progress =
                                Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        Number(
                                            requestData.progress
                                        ) || 0
                                    )
                                );

                            const updateData = {
                                project_id:
                                    newProjectId,

                                title,

                                description:
                                    String(
                                        requestData.description ||
                                        ""
                                    ).trim(),

                                assigned_to:
                                    requestData.assigned_to
                                        ? Number(
                                            requestData.assigned_to
                                        )
                                        : null,

                                start_date:
                                    requestData.start_date ||
                                    null,

                                end_date:
                                    requestData.end_date ||
                                    null,

                                status:
                                    requestData.status ||
                                    "CHUA_LAM",

                                priority:
                                    requestData.priority ||
                                    "TRUNG_BINH",

                                progress
                            };

                            TaskModel.update(
                                taskId,
                                updateData,
                                (
                                    updateError,
                                    updateResult
                                ) => {
                                    if (updateError) {
                                        console.error(
                                            "Lỗi cập nhật công việc:",
                                            updateError
                                        );

                                        return res
                                            .status(500)
                                            .json({
                                                success: false,
                                                message:
                                                    "Không thể cập nhật công việc",
                                                error:
                                                    updateError.message
                                            });
                                    }

                                    if (
                                        !updateResult ||
                                        updateResult
                                            .affectedRows === 0
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
                                        newProjectId,
                                        (
                                            newProgressError
                                        ) => {
                                            if (
                                                newProgressError
                                            ) {
                                                console.error(
                                                    "Lỗi cập nhật tiến độ dự án:",
                                                    newProgressError
                                                );

                                                return res
                                                    .status(500)
                                                    .json({
                                                        success:
                                                            false,
                                                        message:
                                                            "Đã cập nhật công việc nhưng không thể cập nhật tiến độ dự án",
                                                        error:
                                                            newProgressError.message
                                                    });
                                            }

                                            if (
                                                projectId !==
                                                newProjectId
                                            ) {
                                                return TaskModel.updateProjectProgress(
                                                    projectId,
                                                    (
                                                        oldProgressError
                                                    ) => {
                                                        if (
                                                            oldProgressError
                                                        ) {
                                                            console.error(
                                                                "Lỗi cập nhật tiến độ dự án cũ:",
                                                                oldProgressError
                                                            );
                                                        }

                                                        emitTaskUpdate(req, taskId, { projectId: newProjectId });
                                                        return res
                                                            .status(200)
                                                            .json({
                                                                success:
                                                                    true,
                                                                message:
                                                                    "Cập nhật công việc thành công"
                                                            });
                                                    }
                                                );
                                            }

                                            emitTaskUpdate(req, taskId, { projectId: newProjectId });
                                            return res
                                                .status(200)
                                                .json({
                                                    success:
                                                        true,
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
        }
    );
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

                                    runAutomation(result[0], status, req.user.id);
                                    emitTaskUpdate(req, id, { status, projectId });
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

/*
|--------------------------------------------------------------------------
| GET /api/tasks/project/:projectId/gantt
| Lấy tasks + dependencies cho Gantt Chart
|--------------------------------------------------------------------------
*/

const getTasksGantt = (req, res) => {
    const { projectId } = req.params;

    TaskModel.getTasksWithDependencies(
        projectId,
        (err, data) => {
            if (err) {
                console.error("Lỗi lấy dữ liệu Gantt:", err);
                return res.status(500).json({
                    success: false,
                    message: "Không thể tải dữ liệu Gantt",
                    error: err.message
                });
            }

            return res.status(200).json({
                success: true,
                tasks: data.tasks || [],
                dependencies: data.dependencies || []
            });
        }
    );
};

module.exports = {
    getAllTasks,
    getTasksByProject,
    getTasksGantt,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus
};