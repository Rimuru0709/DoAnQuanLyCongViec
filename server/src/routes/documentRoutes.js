const express = require("express");
const router = express.Router();

const {
    uploadDocument,
    getDocumentsByProject,
    deleteDocument
} = require("../controllers/documentController");

router.post("/", uploadDocument);
router.get("/:projectId", getDocumentsByProject);
router.delete("/:id", deleteDocument);

module.exports = router;