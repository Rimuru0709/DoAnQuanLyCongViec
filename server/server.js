require("dotenv").config();

const express = require("express");
const cors = require("cors");

const projectRoutes = require("./Project/projectRoutes");
const taskRoutes = require("./Task/taskRoutes");
const documentRoutes = require("./Document/documentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Cho phép truy cập file upload
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
    res.send("ProjectMaster API đang chạy");
});

// API
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});