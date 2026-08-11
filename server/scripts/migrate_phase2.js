/**
 * Safe migration script for Phase 2
 * Run: node scripts/migrate_phase2.js
 */
const db = require("../src/config/db");

const addColIfNotExists = (table, col, def) => new Promise(resolve => {
    db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, col],
        (e, r) => {
            if (e) { console.error("ERR check col:", e.message); return resolve(); }
            if (r.length > 0) { console.log("Skip (exists):", `${table}.${col}`); return resolve(); }

            db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`, (e2) => {
                if (e2) { console.error("ERR add col:", col, e2.message); }
                else { console.log("Added:", `${table}.${col}`); }
                resolve();
            });
        }
    );
});

const createIdxIfNotExists = (name, table, cols) => new Promise(resolve => {
    db.query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, name],
        (e, r) => {
            if (e) { console.error("ERR check idx:", e.message); return resolve(); }
            if (r.length > 0) { console.log("Skip idx:", name); return resolve(); }

            db.query(`CREATE INDEX ${name} ON ${table}(${cols})`, (e2) => {
                if (e2) { console.error("ERR create idx:", name, e2.message); }
                else { console.log("Created idx:", name); }
                resolve();
            });
        }
    );
});

async function migrate() {
    console.log("=== Starting Phase 2 Migration ===");

    // 1. Thêm cột vào bảng tasks
    await addColIfNotExists("tasks", "completed_at",  "TIMESTAMP NULL DEFAULT NULL");
    await addColIfNotExists("tasks", "estimated_hours", "DECIMAL(6,2) DEFAULT NULL");
    await addColIfNotExists("tasks", "logged_hours", "DECIMAL(6,2) DEFAULT 0");

    // 2. Thêm cột vào task_comments
    await addColIfNotExists("task_comments", "mentions", "JSON DEFAULT NULL");

    // 3. Chuẩn hóa bảng activities
    await addColIfNotExists("activities", "entity_type", "VARCHAR(50) DEFAULT 'task'");
    await addColIfNotExists("activities", "old_value", "TEXT");
    await addColIfNotExists("activities", "new_value", "TEXT");

    // 4. Tạo indexes
    await createIdxIfNotExists("idx_activities_project", "activities", "project_id");
    await createIdxIfNotExists("idx_activities_task",    "activities", "task_id");
    await createIdxIfNotExists("idx_activities_user",    "activities", "user_id");
    await createIdxIfNotExists("idx_notif_user_read",    "notifications", "user_id, is_read");

    console.log("=== Migration Phase 2 Completed ===");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
