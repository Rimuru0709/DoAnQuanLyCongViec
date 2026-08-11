-- ============================================================
-- ProjectMaster — Migration Phase 2
-- Chạy file này để nâng cấp DB lên phiên bản mới nhất
-- ============================================================

USE project_master;

-- ────────────────────────────────────────────────────────────
-- 1. Thêm cột completed_at vào tasks (cho Automation Rules)
-- ────────────────────────────────────────────────────────────
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL DEFAULT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. Thêm estimated_hours và logged_hours vào tasks
-- ────────────────────────────────────────────────────────────
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(6,2) DEFAULT NULL;

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS logged_hours DECIMAL(6,2) DEFAULT 0;

-- ────────────────────────────────────────────────────────────
-- 3. Thêm cột mentions vào task_comments (cho @mention)
-- ────────────────────────────────────────────────────────────
ALTER TABLE task_comments
    ADD COLUMN IF NOT EXISTS mentions JSON DEFAULT NULL;

-- ────────────────────────────────────────────────────────────
-- 4. Bảng time_logs (tạo chính thức nếu chưa tồn tại)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    task_id     INT NOT NULL,
    user_id     INT,
    hours       DECIMAL(6,2) NOT NULL,
    note        VARCHAR(255),
    logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id)  REFERENCES tasks(id)  ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────
-- 5. Chuẩn hóa bảng activities (đảm bảo đủ cột)
-- ────────────────────────────────────────────────────────────
ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) DEFAULT 'task',
    ADD COLUMN IF NOT EXISTS old_value   TEXT,
    ADD COLUMN IF NOT EXISTS new_value   TEXT;

-- ────────────────────────────────────────────────────────────
-- 6. Bảng automation_rules (cấu hình quy tắc tự động)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_rules (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    project_id      INT,
    trigger_event   VARCHAR(100) NOT NULL,
    condition_field VARCHAR(100),
    condition_value VARCHAR(255),
    action_type     VARCHAR(100) NOT NULL,
    action_value    VARCHAR(255),
    is_active       TINYINT(1) DEFAULT 1,
    created_by      INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────
-- 7. Bảng webhook_configs (cấu hình Telegram/Slack/Zalo)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_configs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT,
    platform    ENUM('TELEGRAM','SLACK','ZALO','CUSTOM') NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_key  VARCHAR(255),
    events      JSON DEFAULT NULL,
    is_active   TINYINT(1) DEFAULT 1,
    created_by  INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────
-- 8. Index để tăng tốc truy vấn activity log
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_task    ON activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_user    ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task     ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

SELECT 'Migration Phase 2 hoàn tất!' AS status;
