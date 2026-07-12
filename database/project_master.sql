DROP DATABASE IF EXISTS project_master;

CREATE DATABASE project_master
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE project_master;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    role ENUM('ADMIN', 'MANAGER', 'MEMBER') DEFAULT 'MEMBER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    customer VARCHAR(150),
    manager_name VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status ENUM(
        'SAP_TOI',
        'DANG_THUC_HIEN',
        'HOAN_THANH',
        'TAM_DUNG',
        'QUA_HAN'
    ) DEFAULT 'SAP_TOI',
    progress INT DEFAULT 0,
    is_archived TINYINT(1) DEFAULT 0,
    color VARCHAR(20) DEFAULT '#2563EB',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    `position` VARCHAR(100),
    role_in_project ENUM('OWNER', 'MANAGER', 'MEMBER')
        DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, user_id),
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE kanban_columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    column_order INT DEFAULT 0,
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    column_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    assigned_to INT,
    start_date DATE,
    end_date DATE,
    status ENUM(
        'CHUA_LAM',
        'DANG_LAM',
        'DANG_REVIEW',
        'HOAN_THANH',
        'QUA_HAN'
    ) DEFAULT 'CHUA_LAM',
    priority ENUM('THAP', 'TRUNG_BINH', 'CAO')
        DEFAULT 'TRUNG_BINH',
    progress INT DEFAULT 0,
    task_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,
    FOREIGN KEY (column_id)
        REFERENCES kanban_columns(id)
        ON DELETE SET NULL,
    FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE task_dependencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    depends_on_task_id INT NOT NULL,
    dependency_type ENUM('FS', 'SS', 'FF', 'SF') DEFAULT 'FS',
    UNIQUE (task_id, depends_on_task_id),
    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE
);

CREATE TABLE task_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE task_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    is_done TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE
);

CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by VARCHAR(100),
    version VARCHAR(20) DEFAULT 'v1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

CREATE TABLE task_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255),
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    task_id INT,
    user_id INT,
    action VARCHAR(100),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,
    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('info', 'warning', 'system') DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    task_id INT,
    title VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,
    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20),
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

CREATE TABLE task_labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    label_id INT NOT NULL,
    UNIQUE (task_id, label_id),
    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
    FOREIGN KEY (label_id)
        REFERENCES labels(id)
        ON DELETE CASCADE
);

-- 16. Cài đặt chung toàn hệ thống
DROP TABLE IF EXISTS system_settings;

CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    theme_color VARCHAR(20) DEFAULT '#2563EB',
    enable_gantt TINYINT(1) DEFAULT 1,
    enable_timeline TINYINT(1) DEFAULT 1,
    working_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    default_view VARCHAR(50) DEFAULT 'kanban',
    admin_only_create_project TINYINT(1) DEFAULT 1,
    max_upload_size INT DEFAULT 10
);

-- Khởi tạo cấu hình chung mặc định
INSERT INTO system_settings (
    id,
    theme_color,
    enable_gantt,
    enable_timeline,
    working_days,
    default_view,
    admin_only_create_project,
    max_upload_size
)
VALUES (
    1,
    '#2563EB',
    1,
    1,
    'Mon,Tue,Wed,Thu,Fri',
    'kanban',
    1,
    10
);


-- 17. Cài đặt riêng của từng dự án
DROP TABLE IF EXISTS project_settings;

CREATE TABLE project_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL UNIQUE,
    theme_color VARCHAR(20) DEFAULT '#2563EB',
    enable_gantt TINYINT(1) DEFAULT 1,
    enable_timeline TINYINT(1) DEFAULT 1,
    working_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);


-- Dữ liệu người dùng
INSERT INTO users (
    full_name,
    email,
    password,
    phone,
    role,
    avatar
)

VALUES
(
    'Nguyễn Văn A',
    'admin@gmail.com',
    '$2b$10$NYNSzCQFNd3nATIrZp9mbuLDFrK0qmBDEcQN4KEF.VP0CIyTzN1oq',
    '0900000001',
    'ADMIN'
),
(
    'Trần Thị B',
    'frontend@gmail.com',
    '$2b$10$NYNSzCQFNd3nATIrZp9mbuLDFrK0qmBDEcQN4KEF.VP0CIyTzN1oq',
    '0900000002',
    'MANAGER'
),
(
    'Lê Văn C',
    'backend@gmail.com',
    '$2b$10$NYNSzCQFNd3nATIrZp9mbuLDFrK0qmBDEcQN4KEF.VP0CIyTzN1oq',
    '0900000003',
    'MEMBER'
),
(
    'Phạm Thị D',
    'tester@gmail.com',
    '$2b$10$NYNSzCQFNd3nATIrZp9mbuLDFrK0qmBDEcQN4KEF.VP0CIyTzN1oq',
    '0900000004',
    'MEMBER'
),
(
    'Hoàng Văn E',
    'designer@gmail.com',
    '$2b$10$NYNSzCQFNd3nATIrZp9mbuLDFrK0qmBDEcQN4KEF.VP0CIyTzN1oq',
    '0900000005',
    'MEMBER'
);

INSERT INTO projects
(name, description, customer, manager_name, start_date, end_date,
 status, progress, color, created_by)
VALUES
(
    'Website bán hàng',
    'Phát triển website thương mại điện tử',
    'Công ty ABC',
    'Nguyễn Văn A',
    '2026-07-01',
    '2026-07-25',
    'DANG_THUC_HIEN',
    85,
    '#2563EB',
    1
),
(
    'Ứng dụng quản lý nhân sự',
    'Quản lý nhân viên, chấm công và lương',
    'Công ty XYZ',
    'Trần Thị B',
    '2026-07-05',
    '2026-08-10',
    'DANG_THUC_HIEN',
    0,
    '#22C55E',
    2
),
(
    'Hệ thống CRM',
    'Quản lý khách hàng và chăm sóc khách hàng',
    'Công ty MNO',
    'Nguyễn Văn A',
    '2026-08-01',
    '2026-09-01',
    'SAP_TOI',
    0,
    '#A855F7',
    1
);

INSERT INTO project_members
(project_id, user_id, position, role_in_project)
VALUES
(1, 1, 'Chủ dự án', 'OWNER'),
(1, 2, 'Quản lý Frontend', 'MANAGER'),
(1, 3, 'Backend Developer', 'MEMBER'),
(1, 4, 'Tester', 'MEMBER'),
(1, 5, 'Designer', 'MEMBER'),
(2, 2, 'Chủ dự án', 'OWNER'),
(2, 3, 'Backend Developer', 'MEMBER'),
(2, 4, 'Tester', 'MEMBER'),
(3, 1, 'Chủ dự án', 'OWNER'),
(3, 5, 'Designer', 'MEMBER');

INSERT INTO kanban_columns
(project_id, name, column_order)
VALUES
(1, 'Việc cần làm', 1),
(1, 'Đang thực hiện', 2),
(1, 'Đang review', 3),
(1, 'Hoàn thành', 4),
(2, 'Việc cần làm', 1),
(2, 'Đang thực hiện', 2),
(2, 'Đang review', 3),
(2, 'Hoàn thành', 4),
(3, 'Việc cần làm', 1),
(3, 'Đang thực hiện', 2),
(3, 'Đang review', 3),
(3, 'Hoàn thành', 4);

INSERT INTO tasks
(project_id, column_id, title, description, assigned_to,
 start_date, end_date, status, priority, progress, task_order)
VALUES
(
    1, 4, 'Phân tích yêu cầu',
    'Thu thập và phân tích yêu cầu dự án',
    1, '2026-07-01', '2026-07-03',
    'HOAN_THANH', 'CAO', 100, 1
),
(
    1, 2, 'Thiết kế giao diện',
    'Thiết kế UI cho website bán hàng',
    5, '2026-07-04', '2026-07-10',
    'DANG_LAM', 'CAO', 80, 2
),
(
    1, 2, 'Xây dựng API sản phẩm',
    'Xây dựng API Node.js cho sản phẩm',
    3, '2026-07-08', '2026-07-18',
    'DANG_LAM', 'CAO', 70, 3
),
(
    1, 3, 'Kiểm thử chức năng thanh toán',
    'Kiểm thử quy trình thanh toán',
    4, '2026-07-19', '2026-07-23',
    'DANG_REVIEW', 'TRUNG_BINH', 90, 4
);

INSERT INTO labels
(project_id, name, color)
VALUES
(1, 'Frontend', '#2563EB'),
(1, 'Backend', '#22C55E'),
(1, 'Bug', '#EF4444'),
(1, 'UI', '#A855F7');

INSERT INTO project_settings
(project_id, theme_color)
VALUES
(1, '#2563EB'),
(2, '#22C55E'),
(3, '#A855F7');

INSERT INTO notifications
(user_id, title, content, type)
VALUES
(2, 'Dự án mới', 'Bạn đang quản lý dự án quản lý nhân sự', 'info'),
(3, 'Công việc mới', 'Bạn được giao xây dựng API sản phẩm', 'info'),
(4, 'Kiểm thử', 'Bạn được giao kiểm thử thanh toán', 'warning'),
(5, 'Thiết kế', 'Bạn được giao thiết kế giao diện', 'info');