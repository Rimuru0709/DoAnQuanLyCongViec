require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Trang chủ
app.get("/", (req, res) => {
    res.send("ProjectMaster API đang chạy");
});

// Lấy danh sách dự án
app.get("/api/projects", (req, res) => {

    const sql = "SELECT * FROM projects";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json(result);

    });

});

// Lấy danh sách công việc
app.get("/api/tasks", (req, res) => {

    const sql = "SELECT * FROM tasks";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json(result);

    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});