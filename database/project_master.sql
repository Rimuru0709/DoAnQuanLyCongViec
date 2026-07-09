DROP DATABASE IF EXISTS project_master;
CREATE DATABASE project_master
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE project_master;

-- 1. Người dùng
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

-- 2. Dự án
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('SAP_TOI', 'DANG_THUC_HIEN', 'HOAN_THANH', 'TAM_DUNG', 'QUA_HAN') DEFAULT 'SAP_TOI',
    progress INT DEFAULT 0,
	is_archived TINYINT DEFAULT 0,
	color VARCHAR(20) DEFAULT '#2563EB',
	created_by INT,
    customer VARCHAR(150),
    manager_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. Thành viên trong dự án
CREATE TABLE project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    `position` VARCHAR(100),
    role_in_project ENUM('OWNER', 'MANAGER', 'MEMBER')
        DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_project_user
        UNIQUE (project_id, user_id)
);

-- 4. Cột Kanban
CREATE TABLE kanban_columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    column_order INT DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. Công việc
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    column_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    assigned_to INT,
    start_date DATE,
    end_date DATE,
    status ENUM('CHUA_LAM', 'DANG_LAM', 'DANG_REVIEW', 'HOAN_THANH', 'QUA_HAN') DEFAULT 'CHUA_LAM',
    priority ENUM('THAP', 'TRUNG_BINH', 'CAO') DEFAULT 'TRUNG_BINH',
    progress INT DEFAULT 0,
    task_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Phụ thuộc công việc dùng cho Gantt
CREATE TABLE task_dependencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    depends_on_task_id INT NOT NULL,
    dependency_type ENUM('FS', 'SS', 'FF', 'SF') DEFAULT 'FS',
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 7. Bình luận công việc
CREATE TABLE task_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. Checklist trong công việc
CREATE TABLE task_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    is_done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 9. Tài liệu dự án
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by VARCHAR(100),
    version VARCHAR(20) DEFAULT 'v1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. File đính kèm công việc
CREATE TABLE task_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255),
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Timeline / hoạt động
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    task_id INT,
    user_id INT,
    action VARCHAR(100),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Thông báo
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Sự kiện lịch
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
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Nhãn công việc
CREATE TABLE labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 15. Liên kết task với nhãn
CREATE TABLE task_labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    label_id INT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- 16. Cài đặt riêng của dự án
CREATE TABLE project_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL UNIQUE,
    theme_color VARCHAR(20) DEFAULT '#2563EB',
    enable_gantt BOOLEAN DEFAULT TRUE,
    enable_timeline BOOLEAN DEFAULT TRUE,
    working_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);



-- Dữ liệu

INSERT INTO users (full_name, email, password, phone, role, avatar)
VALUES
('Nguyễn Văn A', 'admin@gmail.com', '123456', '0900000001', 'ADMIN', NULL),
('Trần Thị B', 'frontend@gmail.com', '123456', '0900000002', 'MEMBER', NULL),
('Lê Văn C', 'backend@gmail.com', '123456', '0900000003', 'MEMBER', NULL),
('Phạm Thị D', 'tester@gmail.com', '123456', '0900000004', 'MEMBER', NULL),
('Hoàng Văn E', 'designer@gmail.com', '123456', '0900000005', 'MEMBER', NULL);

INSERT INTO projects(name, description, start_date, end_date, status, progress, is_archived, color, created_by)
VALUES
('Website bán hàng', 'Phát triển website thương mại điện tử', '2026-07-01', '2026-07-25', 'DANG_THUC_HIEN', 75, 0, '#2563EB', 1),
('Ứng dụng quản lý nhân sự', 'Quản lý nhân viên, chấm công và lương', '2026-07-05', '2026-08-10', 'DANG_THUC_HIEN', 60, 0, '#22C55E', 1),
('Hệ thống CRM', 'Quản lý khách hàng và chăm sóc khách hàng', '2026-08-01', '2026-09-01', 'SAP_TOI', 30, 0, '#A855F7', 1);

INSERT INTO project_members (project_id, user_id, position, role_in_project)
VALUES
(1, 1, 'Quản lý dự án', 'OWNER'),
(1, 2, 'Frontend Developer', 'MEMBER'),
(1, 3, 'Backend Developer', 'MEMBER'),
(1, 4, 'Tester', 'MEMBER'),
(1, 5, 'Designer', 'MEMBER');

INSERT INTO kanban_columns (project_id, name, column_order)
VALUES
(1, 'Việc cần làm', 1),
(1, 'Đang thực hiện', 2),
(1, 'Đang review', 3),
(1, 'Hoàn thành', 4);

INSERT INTO tasks (project_id, column_id, title, description, assigned_to, start_date, end_date, status, priority, progress, task_order)
VALUES
(1, 4, 'Phân tích yêu cầu', 'Thu thập và phân tích yêu cầu dự án', 1, '2026-07-01', '2026-07-03', 'HOAN_THANH', 'CAO', 100, 1),
(1, 2, 'Thiết kế giao diện', 'Thiết kế UI cho website bán hàng', 5, '2026-07-04', '2026-07-10', 'DANG_LAM', 'CAO', 80, 2),
(1, 2, 'Xây dựng API sản phẩm', 'Xây dựng API Node.js cho sản phẩm', 3, '2026-07-08', '2026-07-18', 'DANG_LAM', 'CAO', 70, 3),
(1, 3, 'Kiểm thử chức năng thanh toán', 'Kiểm thử quy trình thanh toán', 4, '2026-07-19', '2026-07-23', 'DANG_REVIEW', 'TRUNG_BINH', 40, 4);

INSERT INTO labels (project_id, name, color)
VALUES
(1, 'Frontend', '#2563EB'),
(1, 'Backend', '#22C55E'),
(1, 'Bug', '#EF4444'),
(1, 'UI', '#A855F7');

INSERT INTO activities (project_id, task_id, user_id, action, content)
VALUES
(1, 1, 1, 'CREATE_PROJECT', 'Nguyễn Văn A đã tạo dự án Website bán hàng'),
(1, 2, 5, 'UPDATE_TASK', 'Hoàng Văn E cập nhật tiến độ thiết kế giao diện'),
(1, 3, 3, 'CREATE_TASK', 'Lê Văn C tạo công việc xây dựng API sản phẩm'),
(1, 4, 4, 'REVIEW_TASK', 'Phạm Thị D đưa công việc vào trạng thái review');

INSERT INTO project_settings (project_id)
VALUES
(1), (2), (3);


DROP DATABASE IF EXISTS project_master;