const express = require("express");

const {
    login,
    getCurrentUser
} = require("../controllers/authController");

const {
    verifyToken
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", login);

router.get("/me", verifyToken, getCurrentUser);

module.exports = router;