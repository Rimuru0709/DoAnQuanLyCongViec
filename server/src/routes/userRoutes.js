const express = require("express");
const router = express.Router();

const {
    getUsers,
    register,
    login
} = require("../controllers/userController");

router.get("/", getUsers);
router.post("/register", register);
router.post("/login", login);

module.exports = router;