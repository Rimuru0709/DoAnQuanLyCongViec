const express = require("express");
const router = express.Router();

const {
    getProjects,
    getArchivedProjects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    duplicateProject
} = require("../controllers/projectController");

const {
    verifyToken,
    allowRoles
} = require("../middlewares/authMiddleware");

/*
|--------------------------------------------------------------------------
| Xem danh sách dự án
|--------------------------------------------------------------------------
|
| ADMIN:
| - Xem toàn bộ dự án
|
| MANAGER, MEMBER:
| - Chỉ xem dự án mình tạo hoặc được thêm vào
|
*/

router.get(
    "/",
    verifyToken,
    getProjects
);

/*
|--------------------------------------------------------------------------
| Xem danh sách dự án đã lưu trữ
|--------------------------------------------------------------------------
*/

router.get(
    "/archived",
    verifyToken,
    getArchivedProjects
);

/*
|--------------------------------------------------------------------------
| Xem chi tiết dự án
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    verifyToken,
    getProjectById
);

/*
|--------------------------------------------------------------------------
| Thêm dự án
|--------------------------------------------------------------------------
|
| Chỉ ADMIN và MANAGER được tạo dự án
|
*/

router.post(
    "/",
    verifyToken,
    allowRoles("ADMIN"),
    addProject
);

/*
|--------------------------------------------------------------------------
| Cập nhật dự án
|--------------------------------------------------------------------------
|
| Chỉ ADMIN và MANAGER mới được vào controller.
| Controller sẽ kiểm tra tiếp:
| - ADMIN được sửa mọi dự án
| - MANAGER chỉ sửa dự án do mình tạo
|
*/

router.put(
    "/:id",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    updateProject
);

/*
|--------------------------------------------------------------------------
| Lưu trữ dự án
|--------------------------------------------------------------------------
*/

router.put(
    "/:id/archive",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    archiveProject
);

/*
|--------------------------------------------------------------------------
| Khôi phục dự án
|--------------------------------------------------------------------------
*/

router.put(
    "/:id/restore",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    restoreProject
);

/*
|--------------------------------------------------------------------------
| Nhân bản dự án
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/duplicate",
    verifyToken,
    allowRoles("ADMIN", "MANAGER"),
    duplicateProject
);

/*
|--------------------------------------------------------------------------
| Xóa dự án
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    verifyToken,
    allowRoles("ADMIN"),
    deleteProject
);

module.exports = router;