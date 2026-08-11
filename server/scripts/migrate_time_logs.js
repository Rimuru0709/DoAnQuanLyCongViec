const db = require("../src/config/db");

async function migrate() {
    console.log("=== Creating time_logs table ===");
    await new Promise((resolve) => {
        db.query(`
            CREATE TABLE IF NOT EXISTS time_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                user_id INT NOT NULL,
                hours DECIMAL(6,2) NOT NULL DEFAULT 0,
                log_date DATE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) { console.error("ERR time_logs:", err.message); }
            else { console.log("OK: time_logs table ready"); }
            resolve();
        });
    });
    console.log("=== Migration Done ===");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
