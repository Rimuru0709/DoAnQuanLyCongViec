require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const projectRoutes = require("./src/routes/projectRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const memberRoutes = require("./src/routes/memberRoutes");
const documentRoutes = require("./src/routes/documentRoutes");
const userRoutes = require("./src/routes/userRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const settingRoutes = require("./src/routes/settingRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("ProjectMaster API đang chạy");
});

app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingRoutes); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});