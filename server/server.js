require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require(
    "./src/routes/authRoutes"
);

const projectRoutes = require(
    "./src/routes/projectRoutes"
);

const taskRoutes = require(
    "./src/routes/taskRoutes"
);

const memberRoutes = require(
    "./src/routes/memberRoutes"
);

const documentRoutes = require(
    "./src/routes/documentRoutes"
);

const userRoutes = require(
    "./src/routes/userRoutes"
);

const notificationRoutes = require(
    "./src/routes/notificationRoutes"
);

const reportRoutes = require(
    "./src/routes/reportRoutes"
);

const settingRoutes = require(
    "./src/routes/settingRoutes"
);

const homeRoutes = require(
    "./src/routes/homeRoutes"
);

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

/*
|--------------------------------------------------------------------------
| Thư mục file tải lên
|--------------------------------------------------------------------------
*/

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

/*
|--------------------------------------------------------------------------
| API kiểm tra server
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message:
            "ProjectMaster API đang chạy"
    });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/projects",
    projectRoutes
);

app.use(
    "/api/tasks",
    taskRoutes
);

app.use(
    "/api/members",
    memberRoutes
);

app.use(
    "/api/documents",
    documentRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/reports",
    reportRoutes
);

app.use(
    "/api/settings",
    settingRoutes
);

app.use(
    "/api/home",
    homeRoutes
);

/*
|--------------------------------------------------------------------------
| Xử lý API không tồn tại
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message:
            "Không tìm thấy API"
    });
});

/*
|--------------------------------------------------------------------------
| Xử lý lỗi server
|--------------------------------------------------------------------------
*/

app.use(
    (
        error,
        req,
        res,
        next
    ) => {
        console.error(
            "Lỗi server:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Đã xảy ra lỗi trên máy chủ"
        });
    }
);

/*
|--------------------------------------------------------------------------
| Khởi động server
|--------------------------------------------------------------------------
*/

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `🚀 Server chạy tại http://localhost:${PORT}`
    );
});