const ProjectModel = require("../models/projectModel");

/*
|--------------------------------------------------------------------------
| Hàm kiểm tra quyền quản lý dự án
|--------------------------------------------------------------------------
|
| ADMIN được quản lý mọi dự án.
| MANAGER chỉ được quản lý dự án do mình tạo.
|
*/

const checkProjectManagementPermission = (
    projectId,
    user,
    callback
) => {
    if (!user) {
        return callback({
            status: 401,
            message: "Bạn chưa đăng nhập"
        });
    }

    if (user.role === "ADMIN") {
        return callback(null, true);
    }

    ProjectModel.getById(projectId, (err, result) => {
        if (err) {
            return callback({
                status: 500,
                message: "Không thể kiểm tra quyền dự án",
                error: err
            });
        }

        if (!result || result.length === 0) {
            return callback({
                status: 404,
                message: "Không tìm thấy dự án"
            });
        }

        const project = result[0];

        if (Number(project.created_by) !== Number(user.id)) {
            return callback({
                status: 403,
                message: "Bạn không có quyền quản lý dự án này"
            });
        }

        callback(null, true);
    });
};

/*
|--------------------------------------------------------------------------
| Lấy danh sách dự án
|--------------------------------------------------------------------------
*/

const getProjects = (req, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Bạn chưa đăng nhập"
        });
    }

    // ADMIN xem toàn bộ dự án
    if (user.role === "ADMIN") {
        return ProjectModel.getAll((err, result) => {
            if (err) {
                console.error("Lỗi lấy danh sách dự án:", err);

                return res.status(500).json({
                    success: false,
                    message: "Không thể lấy danh sách dự án"
                });
            }

            return res.status(200).json(result);
        });
    }

    // MANAGER và MEMBER chỉ xem dự án liên quan
    ProjectModel.getByUserId(user.id, (err, result) => {
        if (err) {
            console.error("Lỗi lấy dự án theo tài khoản:", err);

            return res.status(500).json({
                success: false,
                message: "Không thể lấy danh sách dự án"
            });
        }

        return res.status(200).json(result);
    });
};

/*
|--------------------------------------------------------------------------
| Lấy dự án đã lưu trữ
|--------------------------------------------------------------------------
*/

const getArchivedProjects = (req, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Bạn chưa đăng nhập"
        });
    }

    if (user.role === "ADMIN") {
        return ProjectModel.getArchived((err, result) => {
            if (err) {
                console.error("Lỗi lấy dự án đã lưu trữ:", err);

                return res.status(500).json({
                    success: false,
                    message: "Không thể lấy dự án đã lưu trữ"
                });
            }

            return res.status(200).json(result);
        });
    }

    ProjectModel.getArchivedByUserId(
        user.id,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi lấy dự án lưu trữ theo tài khoản:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Không thể lấy dự án đã lưu trữ"
                });
            }

            return res.status(200).json(result);
        }
    );
};

/*
|--------------------------------------------------------------------------
| Lấy chi tiết dự án
|--------------------------------------------------------------------------
*/

const getProjectById = (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Bạn chưa đăng nhập"
        });
    }

    if (user.role === "ADMIN") {
        return ProjectModel.getById(id, (err, result) => {
            if (err) {
                console.error("Lỗi lấy dự án:", err);

                return res.status(500).json({
                    success: false,
                    message: "Không thể lấy thông tin dự án"
                });
            }

            if (!result || result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy dự án"
                });
            }

            return res.status(200).json(result[0]);
        });
    }

    ProjectModel.getByIdForUser(
        id,
        user.id,
        (err, result) => {
            if (err) {
                console.error(
                    "Lỗi lấy dự án theo tài khoản:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Không thể lấy thông tin dự án"
                });
            }

            if (!result || result.length === 0) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Bạn không có quyền truy cập dự án này"
                });
            }

            return res.status(200).json(result[0]);
        }
    );
};

/*
|--------------------------------------------------------------------------
| Thêm dự án
|--------------------------------------------------------------------------
*/

const addProject = (req, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Bạn chưa đăng nhập"
        });
    }

    if (!["ADMIN", "MANAGER"].includes(user.role)) {
        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền tạo dự án"
        });
    }

    const data = {
        ...req.body,
        created_by: user.id
    };

    ProjectModel.create(data, (err, result) => {
        if (err) {
            console.error("Lỗi thêm dự án:", err);

            return res.status(500).json({
                success: false,
                message: "Không thể thêm dự án"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Thêm dự án thành công",
            id: result.insertId
        });
    });
};

/*
|--------------------------------------------------------------------------
| Cập nhật dự án
|--------------------------------------------------------------------------
*/

const updateProject = (req, res) => {
    const { id } = req.params;
    const data = req.body;

    checkProjectManagementPermission(
        id,
        req.user,
        (permissionError) => {
            if (permissionError) {
                return res
                    .status(permissionError.status)
                    .json({
                        success: false,
                        message: permissionError.message
                    });
            }

            ProjectModel.update(id, data, (err, result) => {
                if (err) {
                    console.error("Lỗi cập nhật dự án:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Không thể cập nhật dự án"
                    });
                }

                if (result && result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Không tìm thấy dự án"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Cập nhật dự án thành công"
                });
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Xóa dự án
|--------------------------------------------------------------------------
*/

const deleteProject = (req, res) => {
    const { id } = req.params;

    checkProjectManagementPermission(
        id,
        req.user,
        (permissionError) => {
            if (permissionError) {
                return res
                    .status(permissionError.status)
                    .json({
                        success: false,
                        message: permissionError.message
                    });
            }

            ProjectModel.delete(id, (err, result) => {
                if (err) {
                    console.error("Lỗi xóa dự án:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Không thể xóa dự án"
                    });
                }

                if (result && result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Không tìm thấy dự án"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Xóa dự án thành công"
                });
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Lưu trữ dự án
|--------------------------------------------------------------------------
*/

const archiveProject = (req, res) => {
    const { id } = req.params;

    checkProjectManagementPermission(
        id,
        req.user,
        (permissionError) => {
            if (permissionError) {
                return res
                    .status(permissionError.status)
                    .json({
                        success: false,
                        message: permissionError.message
                    });
            }

            ProjectModel.archive(id, (err, result) => {
                if (err) {
                    console.error("Lỗi lưu trữ dự án:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Không thể lưu trữ dự án"
                    });
                }

                if (result && result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Không tìm thấy dự án"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Lưu trữ dự án thành công"
                });
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Khôi phục dự án
|--------------------------------------------------------------------------
*/

const restoreProject = (req, res) => {
    const { id } = req.params;

    checkProjectManagementPermission(
        id,
        req.user,
        (permissionError) => {
            if (permissionError) {
                return res
                    .status(permissionError.status)
                    .json({
                        success: false,
                        message: permissionError.message
                    });
            }

            ProjectModel.restore(id, (err, result) => {
                if (err) {
                    console.error("Lỗi khôi phục dự án:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Không thể khôi phục dự án"
                    });
                }

                if (result && result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Không tìm thấy dự án"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Khôi phục dự án thành công"
                });
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Nhân bản dự án
|--------------------------------------------------------------------------
*/

const duplicateProject = (req, res) => {
    const { id } = req.params;
    const user = req.user;

    checkProjectManagementPermission(
        id,
        user,
        (permissionError) => {
            if (permissionError) {
                return res
                    .status(permissionError.status)
                    .json({
                        success: false,
                        message: permissionError.message
                    });
            }

            ProjectModel.duplicate(
                id,
                user.id,
                (err, result) => {
                    if (err) {
                        console.error(
                            "Lỗi nhân bản dự án:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Không thể nhân bản dự án"
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message: "Nhân bản dự án thành công",
                        id: result.insertId
                    });
                }
            );
        }
    );
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