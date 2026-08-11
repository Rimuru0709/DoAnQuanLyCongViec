require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const http    = require("http");
const { Server } = require("socket.io");
const jwt     = require("jsonwebtoken");

const authRoutes       = require("./src/routes/authRoutes");
const projectRoutes    = require("./src/routes/projectRoutes");
const taskRoutes       = require("./src/routes/taskRoutes");
const memberRoutes     = require("./src/routes/memberRoutes");
const documentRoutes   = require("./src/routes/documentRoutes");
const userRoutes       = require("./src/routes/userRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const reportRoutes     = require("./src/routes/reportRoutes");
const settingRoutes    = require("./src/routes/settingRoutes");
const homeRoutes       = require("./src/routes/homeRoutes");
const taskDetailRoutes = require("./src/routes/taskDetailRoutes");
const activityRoutes   = require("./src/routes/activityRoutes");
const automationRoutes = require("./src/routes/automationRoutes");

const app    = express();
const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| Socket.io — Real-time
|--------------------------------------------------------------------------
*/

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

/* Xác thực socket với JWT */
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Chưa xác thực"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id || decoded.userId;
        next();
    } catch {
        next(new Error("Token không hợp lệ"));
    }
});

io.on("connection", (socket) => {
    const userId = socket.userId;
    if (userId) {
        socket.join(`user:${userId}`);   // phòng riêng cho từng user
    }
    socket.join("global");               // phòng chung (admin broadcasts)

    socket.on("disconnect", () => {});
});

/* Gắn io vào app để dùng từ controllers */
app.set("io", io);

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Thư mục file tải lên
|--------------------------------------------------------------------------
*/

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*
|--------------------------------------------------------------------------
| API kiểm tra server
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    return res.status(200).json({ success: true, message: "ProjectMaster API đang chạy" });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth",        authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/projects",    projectRoutes);
app.use("/api/tasks",       taskRoutes);
app.use("/api/members",     memberRoutes);
app.use("/api/documents",   documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports",     reportRoutes);
app.use("/api/settings",    settingRoutes);
app.use("/api/home",        homeRoutes);
app.use("/api/task-detail", taskDetailRoutes);
app.use("/api/activities",  activityRoutes);
app.use("/api/automation",  automationRoutes);

/*
|--------------------------------------------------------------------------
| Xử lý API không tồn tại
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
    return res.status(404).json({ success: false, message: "Không tìm thấy API" });
});

/*
|--------------------------------------------------------------------------
| Xử lý lỗi server
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
    console.error("Lỗi server:", error);
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi trên máy chủ" });
});

/*
|--------------------------------------------------------------------------
| Khởi động server (dùng http.Server để Socket.io hoạt động)
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});