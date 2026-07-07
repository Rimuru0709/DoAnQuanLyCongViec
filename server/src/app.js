require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const documentRoutes = require("./routes/documentRoutes");
const memberRoutes = require("./routes/memberRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Cho phép truy cập file upload
app.use("/uploads", express.static(path.join(__dirname, "../Uploads")));

app.get("/", (req, res) => {
    res.send("ProjectMaster API đang chạy");
});

// API
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
