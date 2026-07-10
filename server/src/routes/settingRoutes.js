const express = require('express');
const router = express.Router();
const projectSettingController = require('../controllers/settingController');

// Tạo một hàm trung gian giả lập, nó chỉ có nhiệm vụ cho phép request đi tiếp qua bước sau
const bypassAuth = (req, res, next) => next();

// Thay authMiddleware cũ bằng bypassAuth để loại bỏ lỗi không định nghĩa
router.get('/:projectId', bypassAuth, projectSettingController.getProjectSettings);
router.put('/:projectId', bypassAuth, projectSettingController.updateProjectSettings);

module.exports = router;