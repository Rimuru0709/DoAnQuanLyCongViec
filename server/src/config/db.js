const mysql = require('mysql2/promise');
require('dotenv').config(); // Để đọc được các biến từ file .env

// Tạo một pool chứa các kết nối có sẵn tới MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '170806',
    database: 'quan_ly_cong_viec',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Đoạn code tự động chạy để kiểm tra xem cấu hình thông tin kết nối DB có chuẩn chưa
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối database MySQL thành công !');
        connection.release(); // Trả lại kết nối vào pool sau khi test xong
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL rồi ! Kiểm tra lại thông tin cấu hình nhé.');
        console.error('Chi tiết lỗi:', error.message);
    }
})();

module.exports = pool;