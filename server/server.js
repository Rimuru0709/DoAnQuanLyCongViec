require("dotenv").config();

const express = require("express");
const cors = require("cors");

const projectRoutes = require("./Project/projectRoutes");
const taskRoutes = require("./Task/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("ProjectMaster API đang chạy");
});

app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});