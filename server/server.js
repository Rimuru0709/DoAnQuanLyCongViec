const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server Node.js đang chạy");
});

app.listen(3000, () => {
    console.log("Server chạy tại http://localhost:3000");
});