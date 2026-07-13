const MemberModel = require("../models/memberModel");

/*
|--------------------------------------------------------------------------
| Lấy toàn bộ nhân sự trong hệ thống
|--------------------------------------------------------------------------
| Chỉ ADMIN nên được gọi route này.
*/

const getAllMembers = (req, res) => {
    MemberModel.getAll((err, result) => {
        if (err) {
            console.error("Lỗi lấy danh sách thành viên:", err);

            return res.status(500).json({
                success: false,
                message: "Không thể lấy danh sách thành viên",
                error: err.message
            });
        }

        return res.status(200).json(result);
    });
};

/*
|--------------------------------------------------------------------------
| Lấy chi tiết một nhân sự
|--------------------------------------------------------------------------
*/

const getMemberById = (req, res) => {
    const { userId } = req.params;

    MemberModel.getById(userId, (err, result) => {
        if (err) {
            console.error("Lỗi lấy chi tiết thành viên:", err);

            return res.status(500).json({
                success: false,
                message: "Không thể lấy thông tin thành viên",
                error: err.message
            });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thành viên"
            });
        }

        return res.status(200).json(result[0]);
    });
};

/*
|--------------------------------------------------------------------------
| Lấy thành viên của một dự án
|--------------------------------------------------------------------------
| ADMIN xem tất cả.
| MANAGER/MEMBER chỉ xem dự án mình có quyền truy cập.
*/

const getMembersByProject = (req, res) => {
    const { projectId } = req.params;

    MemberModel.canAccessProject(
        projectId,
        req.user.id,
        req.user.role,
        (permissionError, allowed) => {
            if (permissionError) {
                console.error(
                    "Lỗi kiểm tra quyền xem dự án:",
                    permissionError
                );

                return res.status(500).json({
                    success: false,
                    message: "Không thể kiểm tra quyền truy cập dự án",
                    error: permissionError.message
                });
            }

            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền xem thành viên dự án này"
                });
            }

            MemberModel.getByProject(projectId, (err, result) => {
                if (err) {
                    console.error(
                        "Lỗi lấy thành viên dự án:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Không thể lấy thành viên của dự án",
                        error: err.message
                    });
                }

                return res.status(200).json(result);
            });
        }
    );
};

/*
|--------------------------------------------------------------------------
| Tạo nhân sự mới trong hệ thống
|--------------------------------------------------------------------------
| Chỉ ADMIN được sử dụng route này.
*/

const createSystemMember = (req, res) => {
    const {
        full_name,
        email,
        phone,
        avatar,
        role,
        position,
        role_in_project,
        project_ids
    } = req.body;

    const normalizedName =
        typeof full_name === "string"
            ? full_name.trim()
            : "";

    const normalizedEmail =
        typeof email === "string"
            ? email.trim().toLowerCase()
            : "";

    if (!normalizedName || !normalizedEmail) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập họ tên và email"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: "Email không đúng định dạng"
        });
    }

    const validSystemRoles = [
        "ADMIN",
        "MANAGER",
        "MEMBER"
    ];

    const validProjectRoles = [
        "OWNER",
        "MANAGER",
        "MEMBER"
    ];

    const systemRole = validSystemRoles.includes(role)
        ? role
        : "MEMBER";

    const projectRole =
        validProjectRoles.includes(role_in_project)
            ? role_in_project
            : "MEMBER";

    const projectIds = Array.isArray(project_ids)
        ? [
            ...new Set(
                project_ids
                    .map(Number)
                    .filter(
                        (id) =>
                            Number.isInteger(id) &&
                            id > 0
                    )
            )
        ]
        : [];

    MemberModel.createSystemMember(
        {
            full_name: normalizedName,
            email: normalizedEmail,
            phone: phone || null,
            avatar: avatar || null,
            role: systemRole
        },
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        success: false,
                        message: "Email hoặc số điện thoại đã tồn tại"
                    });
                }

                console.error("Lỗi tạo thành viên:", err);

                return res.status(500).json({
                    success: false,
                    message: "Không thể tạo thành viên",
                    error: err.message
                });
            }

            const userId = result.insertId;

            MemberModel.addToProjects(
                userId,
                projectIds,
                position || "",
                projectRole,
                (projectError) => {
                    if (projectError) {
                        console.error(
                            "Lỗi gán thành viên vào dự án:",
                            projectError
                        );

                        return MemberModel.deleteSystemMember(
                            userId,
                            () => {
                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Tạo thành viên thất bại khi gán dự án",
                                    error: projectError.message
                                });
                            }
                        );
                    }

                    return res.status(201).json({
                        success: true,
                        message: "Thêm thành viên thành công",
                        user_id: userId
                    });
                }
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Thêm user có sẵn vào một dự án
|--------------------------------------------------------------------------
*/

const addMemberToProject = (req, res) => {
    const {
        project_id,
        user_id,
        position,
        role_in_project
    } = req.body;

    const projectId = Number(project_id);
    const userId = Number(user_id);

    if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(userId) ||
        userId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "project_id hoặc user_id không hợp lệ"
        });
    }

    const validRoles = [
        "OWNER",
        "MANAGER",
        "MEMBER"
    ];

    const projectRole =
        validRoles.includes(role_in_project)
            ? role_in_project
            : "MEMBER";

    MemberModel.canManageProject(
        projectId,
        req.user.id,
        req.user.role,
        (permissionError, allowed) => {
            if (permissionError) {
                console.error(
                    "Lỗi kiểm tra quyền quản lý dự án:",
                    permissionError
                );

                return res.status(500).json({
                    success: false,
                    message: "Không thể kiểm tra quyền quản lý dự án",
                    error: permissionError.message
                });
            }

            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền thêm thành viên vào dự án này"
                });
            }

            MemberModel.checkMemberExists(
                projectId,
                userId,
                (checkError, existingMembers) => {
                    if (checkError) {
                        return res.status(500).json({
                            success: false,
                            message: "Không thể kiểm tra thành viên dự án",
                            error: checkError.message
                        });
                    }

                    if (
                        existingMembers &&
                        existingMembers.length > 0
                    ) {
                        return res.status(400).json({
                            success: false,
                            message: "Thành viên này đã có trong dự án"
                        });
                    }

                    MemberModel.addToProject(
                        {
                            project_id: projectId,
                            user_id: userId,
                            position: position || "",
                            role_in_project: projectRole
                        },
                        (err, result) => {
                            if (err) {
                                if (err.code === "ER_DUP_ENTRY") {
                                    return res.status(400).json({
                                        success: false,
                                        message:
                                            "Thành viên này đã có trong dự án"
                                    });
                                }

                                console.error(
                                    "Lỗi thêm thành viên vào dự án:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Không thể thêm thành viên vào dự án",
                                    error: err.message
                                });
                            }

                            return res.status(201).json({
                                success: true,
                                message:
                                    "Thêm thành viên vào dự án thành công",
                                id: result.insertId
                            });
                        }
                    );
                }
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Cập nhật nhân sự toàn hệ thống
|--------------------------------------------------------------------------
| Chỉ ADMIN được sử dụng.
*/

const updateSystemMember = (req, res) => {
    const { userId } = req.params;

    const {
        full_name,
        email,
        phone,
        avatar,
        role,
        position,
        role_in_project,
        project_ids
    } = req.body;

    const normalizedName =
        typeof full_name === "string"
            ? full_name.trim()
            : "";

    const normalizedEmail =
        typeof email === "string"
            ? email.trim().toLowerCase()
            : "";

    if (!normalizedName || !normalizedEmail) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập họ tên và email"
        });
    }

    const validSystemRoles = [
        "ADMIN",
        "MANAGER",
        "MEMBER"
    ];

    const validProjectRoles = [
        "OWNER",
        "MANAGER",
        "MEMBER"
    ];

    const systemRole = validSystemRoles.includes(role)
        ? role
        : "MEMBER";

    const projectRole =
        validProjectRoles.includes(role_in_project)
            ? role_in_project
            : "MEMBER";

    const projectIds = Array.isArray(project_ids)
        ? [
            ...new Set(
                project_ids
                    .map(Number)
                    .filter(
                        (id) =>
                            Number.isInteger(id) &&
                            id > 0
                    )
            )
        ]
        : [];

    MemberModel.updateSystemMember(
        userId,
        {
            full_name: normalizedName,
            email: normalizedEmail,
            phone: phone || null,
            avatar: avatar || null,
            role: systemRole
        },
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        success: false,
                        message: "Email hoặc số điện thoại đã tồn tại"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Không thể cập nhật thành viên",
                    error: err.message
                });
            }

            if (!result || result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy thành viên"
                });
            }

            MemberModel.removeAllProjectsByUser(
                userId,
                (removeError) => {
                    if (removeError) {
                        return res.status(500).json({
                            success: false,
                            message:
                                "Không thể cập nhật danh sách dự án",
                            error: removeError.message
                        });
                    }

                    MemberModel.addToProjects(
                        userId,
                        projectIds,
                        position || "",
                        projectRole,
                        (addError) => {
                            if (addError) {
                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Không thể gán thành viên vào dự án",
                                    error: addError.message
                                });
                            }

                            return res.status(200).json({
                                success: true,
                                message:
                                    "Cập nhật thành viên thành công"
                            });
                        }
                    );
                }
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Cập nhật vai trò/vị trí trong một dự án
|--------------------------------------------------------------------------
*/

const updateProjectMember = (req, res) => {
    const { id } = req.params;

    const {
        position,
        role_in_project
    } = req.body;

    const validRoles = [
        "OWNER",
        "MANAGER",
        "MEMBER"
    ];

    if (!validRoles.includes(role_in_project)) {
        return res.status(400).json({
            success: false,
            message: "Vai trò trong dự án không hợp lệ"
        });
    }

    MemberModel.getProjectMemberById(
        id,
        (findError, memberResult) => {
            if (findError) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể kiểm tra thành viên trong dự án",
                    error: findError.message
                });
            }

            if (
                !memberResult ||
                memberResult.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy thành viên trong dự án"
                });
            }

            const projectMember = memberResult[0];

            MemberModel.canManageProject(
                projectMember.project_id,
                req.user.id,
                req.user.role,
                (permissionError, allowed) => {
                    if (permissionError) {
                        return res.status(500).json({
                            success: false,
                            message:
                                "Không thể kiểm tra quyền quản lý dự án",
                            error: permissionError.message
                        });
                    }

                    if (!allowed) {
                        return res.status(403).json({
                            success: false,
                            message:
                                "Bạn không có quyền cập nhật thành viên này"
                        });
                    }

                    MemberModel.updateProjectMember(
                        id,
                        {
                            position: position || "",
                            role_in_project
                        },
                        (err, result) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Không thể cập nhật thành viên trong dự án",
                                    error: err.message
                                });
                            }

                            if (
                                !result ||
                                result.affectedRows === 0
                            ) {
                                return res.status(404).json({
                                    success: false,
                                    message:
                                        "Không tìm thấy thành viên trong dự án"
                                });
                            }

                            return res.status(200).json({
                                success: true,
                                message:
                                    "Cập nhật thành viên trong dự án thành công"
                            });
                        }
                    );
                }
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Xóa người khỏi một dự án
|--------------------------------------------------------------------------
*/

const removeMemberFromProject = (req, res) => {
    const { id } = req.params;

    MemberModel.getProjectMemberById(
        id,
        (findError, memberResult) => {
            if (findError) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể kiểm tra thành viên trong dự án",
                    error: findError.message
                });
            }

            if (
                !memberResult ||
                memberResult.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy thành viên trong dự án"
                });
            }

            const projectMember = memberResult[0];

            if (
                projectMember.role_in_project ===
                "OWNER"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Không thể xóa chủ dự án khỏi dự án"
                });
            }

            MemberModel.canManageProject(
                projectMember.project_id,
                req.user.id,
                req.user.role,
                (permissionError, allowed) => {
                    if (permissionError) {
                        return res.status(500).json({
                            success: false,
                            message:
                                "Không thể kiểm tra quyền quản lý dự án",
                            error: permissionError.message
                        });
                    }

                    if (!allowed) {
                        return res.status(403).json({
                            success: false,
                            message:
                                "Bạn không có quyền xóa thành viên này"
                        });
                    }

                    MemberModel.removeFromProject(
                        id,
                        (err, result) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Không thể xóa thành viên khỏi dự án",
                                    error: err.message
                                });
                            }

                            if (
                                !result ||
                                result.affectedRows === 0
                            ) {
                                return res.status(404).json({
                                    success: false,
                                    message:
                                        "Không tìm thấy thành viên trong dự án"
                                });
                            }

                            return res.status(200).json({
                                success: true,
                                message:
                                    "Xóa thành viên khỏi dự án thành công"
                            });
                        }
                    );
                }
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Xóa nhân sự khỏi toàn hệ thống
|--------------------------------------------------------------------------
*/

const deleteSystemMember = (req, res) => {
    const { userId } = req.params;

    if (
        Number(userId) ===
        Number(req.user.id)
    ) {
        return res.status(400).json({
            success: false,
            message: "Bạn không thể tự xóa tài khoản của mình"
        });
    }

    MemberModel.getById(
        userId,
        (findError, result) => {
            if (findError) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Không thể kiểm tra thành viên",
                    error: findError.message
                });
            }

            if (
                !result ||
                result.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Không tìm thấy thành viên"
                });
            }

            if (result[0].role === "ADMIN") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Không thể xóa tài khoản Admin"
                });
            }

            MemberModel.deleteSystemMember(
                userId,
                (err, deleteResult) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message:
                                "Không thể xóa thành viên",
                            error: err.message
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message:
                            "Xóa thành viên khỏi hệ thống thành công",
                        affectedRows:
                            deleteResult.affectedRows
                    });
                }
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Lấy tất cả user cho combobox
|--------------------------------------------------------------------------
*/

const getAllUsers = (req, res) => {
    MemberModel.getAllUsers((err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message:
                    "Không thể lấy danh sách người dùng",
                error: err.message
            });
        }

        return res.status(200).json(result);
    });
};

module.exports = {
    getAllMembers,
    getMemberById,
    getMembersByProject,
    createSystemMember,
    addMemberToProject,
    updateSystemMember,
    updateProjectMember,
    removeMemberFromProject,
    deleteSystemMember,
    getAllUsers
};