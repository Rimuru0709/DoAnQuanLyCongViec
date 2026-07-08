const express = require("express");
const router = express.Router();

const {
    getMembersByProject,
    addMember,
    updateMember,
    deleteMember,
    getAllUsers
} = require("../controllers/memberController");

router.get("/users", getAllUsers);
router.get("/:projectId", getMembersByProject);
router.post("/", addMember);
router.put("/:id", updateMember);
router.delete("/:id", deleteMember);

module.exports = router;