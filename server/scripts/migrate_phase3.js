/**
 * Migration Phase 3 — automation_rules table
 * Run: node scripts/migrate_phase3.js
 */
const db = require("../src/config/db");

async function migrate() {
    console.log("=== Starting Phase 3 Migration ===");

    // Tạo bảng automation_rules
    await new Promise((resolve, reject) => {
        db.query(`
            CREATE TABLE IF NOT EXISTS automation_rules (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                project_id      INT NOT NULL,
                name            VARCHAR(150) NOT NULL DEFAULT 'Quy tắc mới',
                trigger_event   VARCHAR(80)  NOT NULL DEFAULT 'STATUS_CHANGE',
                condition_field VARCHAR(80)  NOT NULL DEFAULT 'status',
                condition_value VARCHAR(150) NOT NULL DEFAULT '',
                action_type     VARCHAR(80)  NOT NULL DEFAULT 'SET_COMPLETED_AT',
                action_value    VARCHAR(150) NOT NULL DEFAULT 'NOW',
                is_active       TINYINT(1)   NOT NULL DEFAULT 1,
                created_by      INT,
                created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE SET NULL
            )
        `, (err) => {
            if (err) { console.error("ERR automation_rules:", err.message); }
            else { console.log("OK: automation_rules table ready"); }
            resolve();
        });
    });

    // Đảm bảo task_dependencies tồn tại (phòng trường hợp chưa có)
    await new Promise((resolve) => {
        db.query(`
            CREATE TABLE IF NOT EXISTS task_dependencies (
                task_id             INT NOT NULL,
                depends_on_task_id  INT NOT NULL,
                PRIMARY KEY (task_id, depends_on_task_id),
                FOREIGN KEY (task_id)            REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) { console.log("Skip task_dependencies:", err.message); }
            else { console.log("OK: task_dependencies table ready"); }
            resolve();
        });
    });

    // Seed 3 default rules mẫu nếu bảng trống
    await new Promise((resolve) => {
        db.query("SELECT COUNT(*) AS cnt FROM automation_rules", (err, rows) => {
            if (err || (rows && rows[0].cnt > 0)) return resolve();
            // Lấy project đầu tiên để seed
            db.query("SELECT id, created_by FROM projects LIMIT 1", (e2, projects) => {
                if (e2 || !projects || projects.length === 0) return resolve();
                const pid = projects[0].id;
                const uid = projects[0].created_by;
                const seeds = [
                    [pid, "Tự động hoàn thành", "STATUS_CHANGE", "status", "HOAN_THANH", "SET_COMPLETED_AT", "NOW", uid],
                    [pid, "Cảnh báo quá hạn",  "DEADLINE_PASSED", "end_date", "TODAY", "NOTIFY_ASSIGNEE", "QUA_HAN",  uid],
                    [pid, "Thông báo review",   "STATUS_CHANGE", "status", "DANG_REVIEW", "NOTIFY_MANAGER", "REVIEW_REQUESTED", uid]
                ];
                let done = 0;
                seeds.forEach(row => {
                    db.query(
                        "INSERT INTO automation_rules (project_id,name,trigger_event,condition_field,condition_value,action_type,action_value,created_by) VALUES (?,?,?,?,?,?,?,?)",
                        row,
                        () => { if (++done === seeds.length) { console.log("Seeded 3 default rules"); resolve(); } }
                    );
                });
            });
        });
    });

    console.log("=== Phase 3 Migration Done ===");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
