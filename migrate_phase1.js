/**
 * Migration: Phase 1 — Add missing columns for Task Detail features
 * Run: node server/migrate_phase1.js
 */
require("dotenv").config({ path: "./server/.env" });

const mysql = require("mysql2");

const db = mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

const migrations = [
    // Add estimated_hours and logged_hours to tasks
    {
        name: "tasks.estimated_hours",
        sql:  "ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(6,2) DEFAULT NULL"
    },
    {
        name: "tasks.logged_hours",
        sql:  "ALTER TABLE tasks ADD COLUMN logged_hours DECIMAL(6,2) DEFAULT 0"
    },
    // Add URGENT priority (change enum)
    // Note: MySQL ALTER TABLE MODIFY can handle enum expansion
    {
        name: "tasks.priority URGENT",
        sql:  "ALTER TABLE tasks MODIFY COLUMN priority ENUM('THAP','TRUNG_BINH','CAO','KHAN_CAP') DEFAULT 'TRUNG_BINH'"
    },
    // Add mentions column to task_comments
    {
        name: "task_comments.mentions",
        sql:  "ALTER TABLE task_comments ADD COLUMN mentions JSON DEFAULT NULL"
    },
    // Create time_logs table
    {
        name: "CREATE time_logs",
        sql: `
            CREATE TABLE IF NOT EXISTS time_logs (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                task_id    INT NOT NULL,
                user_id    INT,
                hours      DECIMAL(6,2) NOT NULL,
                note       VARCHAR(255),
                logged_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `
    }
];

async function runMigrations() {
    console.log("🚀 Running Phase 1 migrations...\n");

    for (const m of migrations) {
        await new Promise((resolve) => {
            db.query(m.sql, (err) => {
                if (err) {
                    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR" ||
                        err.message.includes("Duplicate column") || err.message.includes("already exists")) {
                        console.log(`  ⏭️  SKIP (already exists): ${m.name}`);
                    } else {
                        console.error(`  ❌ ERROR: ${m.name}\n     ${err.message}`);
                    }
                } else {
                    console.log(`  ✅ OK: ${m.name}`);
                }
                resolve();
            });
        });
    }

    console.log("\n✅ Migrations complete!");
    db.end();
}

db.connect((err) => {
    if (err) {
        console.error("❌ Cannot connect to DB:", err.message);
        process.exit(1);
    }
    console.log("✅ Connected to DB\n");
    runMigrations();
});
