const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

// Tạo một hàm trung gian giả lập, nó chỉ có nhiệm vụ cho phép request đi tiếp qua bước sau
const bypassAuth = (req, res, next) => next();

// MỚI: Loại bỏ hoàn toàn /:projectId trên URL vì giờ đây là cấu hình chung hệ thống
router.get('/', bypassAuth, settingController.getSystemSettings);
router.put('/', bypassAuth, settingController.updateSystemSettings);

module.exports = router;