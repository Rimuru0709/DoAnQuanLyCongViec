const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/memberController");

const {
    verifyToken,
    allowRoles
} = require("../middlewares/authMiddleware");

/*
|--------------------------------------------------------------------------
| Quản lý nhân sự toàn hệ thống
|--------------------------------------------------------------------------
*/

// ADMIN xem toàn bộ nhân sự
router.get(
    "/",
    verifyToken,
    allowRoles("ADMIN"),
    getAllMembers
);

// ADMIN và MANAGER lấy danh sách user cho combobox
router.get(
    "/users",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    getAllUsers
);

// ADMIN xem chi tiết một tài khoản
router.get(
    "/detail/:userId",
    verifyToken,
    allowRoles("ADMIN"),
    getMemberById
);

// ADMIN tạo tài khoản mới
router.post(
    "/system",
    verifyToken,
    allowRoles("ADMIN"),
    createSystemMember
);

// ADMIN sửa tài khoản hệ thống
router.put(
    "/system/:userId",
    verifyToken,
    allowRoles("ADMIN"),
    updateSystemMember
);

// ADMIN xóa tài khoản hệ thống
router.delete(
    "/system/:userId",
    verifyToken,
    allowRoles("ADMIN"),
    deleteSystemMember
);

/*
|--------------------------------------------------------------------------
| Thành viên trong dự án
|--------------------------------------------------------------------------
*/

// Người đã đăng nhập được xem thành viên dự án có quyền truy cập
router.get(
    "/project/:projectId",
    verifyToken,
    getMembersByProject
);

// ADMIN và MANAGER thêm user vào dự án
router.post(
    "/project",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    addMemberToProject
);

// ADMIN và MANAGER sửa vai trò trong dự án
router.put(
    "/project-member/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    updateProjectMember
);

// ADMIN và MANAGER xóa thành viên khỏi dự án
router.delete(
    "/project-member/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    removeMemberFromProject
);

/*
|--------------------------------------------------------------------------
| Giữ tương thích với Member.jsx hiện tại
|--------------------------------------------------------------------------
|
| Member.jsx hiện gọi:
| GET    /api/members/:projectId
| POST   /api/members
| PUT    /api/members/:id
| DELETE /api/members/:id
|
*/

router.get(
    "/:projectId",
    verifyToken,
    getMembersByProject
);

router.post(
    "/",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    addMemberToProject
);

router.put(
    "/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    updateProjectMember
);

router.delete(
    "/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    removeMemberFromProject
);

module.exports = router;