const db = require("../config/db");

/* ──────────────────────────────────────────
   GET Task Detail (full — with comments, checklist, attachments)
   GET /api/task-detail/:taskId
────────────────────────────────────────── */
const getTaskDetail = (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.id;
    const role   = req.user.role;

    // 1. Get task with assignee name + project name
    const taskSql = `
        SELECT 
            t.*,
            u.full_name   AS assignee_name,
            u.email       AS assignee_email,
            p.name        AS project_name
        FROM tasks t
        LEFT JOIN users   u ON u.id = t.assigned_to
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.id = ?
    `;

    db.query(taskSql, [taskId], (err, taskRows) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi tải công việc", error: err.message });
        if (!taskRows || taskRows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy công việc" });

        const task = taskRows[0];

        // Permission check: MEMBER can only see tasks they're assigned to
        if (role === "MEMBER" && task.assigned_to !== userId) {
            // Check if they're a project member
            const memberCheckSql = "SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1";
            db.query(memberCheckSql, [task.project_id, userId], (mErr, mRows) => {
                if (mErr || !mRows || mRows.length === 0) {
                    return res.status(403).json({ success: false, message: "Bạn không có quyền xem công việc này" });
                }
                fetchDetail(task, res);
            });
        } else {
            fetchDetail(task, res);
        }
    });
};

function fetchDetail(task, res) {
    const taskId = task.id;

    // 2. Comments with user info
    const commentSql = `
        SELECT 
            c.id, c.content, c.created_at, c.mentions,
            u.id        AS user_id,
            u.full_name AS user_name,
            u.role      AS user_role
        FROM task_comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.task_id = ?
        ORDER BY c.created_at ASC
    `;

    // 3. Checklist items
    const checklistSql = `
        SELECT id, title, is_done, created_at
        FROM task_checklists
        WHERE task_id = ?
        ORDER BY id ASC
    `;

    // 4. Attachments
    const attachSql = `
        SELECT 
            a.id, a.file_name, a.file_url, a.uploaded_at,
            u.full_name AS uploaded_by_name
        FROM task_attachments a
        LEFT JOIN users u ON u.id = a.uploaded_by
        WHERE a.task_id = ?
        ORDER BY a.uploaded_at DESC
    `;

    // 5. Time logs
    const timeSql = `
        SELECT 
            tl.id, tl.hours, tl.note, tl.logged_at,
            u.full_name AS logged_by_name
        FROM time_logs tl
        LEFT JOIN users u ON u.id = tl.user_id
        WHERE tl.task_id = ?
        ORDER BY tl.logged_at DESC
    `;

    let comments = [], checklist = [], attachments = [], timeLogs = [];
    let done = 0;
    let hasError = false;

    const tryRespond = (res) => {
        done++;
        if (done < 4 || hasError) return;
        return res.json({
            success: true,
            task,
            comments,
            checklist,
            attachments,
            time_logs: timeLogs
        });
    };

    db.query(commentSql, [taskId], (err, rows) => {
        if (err) { hasError = true; return res.status(500).json({ success: false, message: "Lỗi tải bình luận" }); }
        comments = rows || [];
        tryRespond(res);
    });

    db.query(checklistSql, [taskId], (err, rows) => {
        if (err) { hasError = true; return res.status(500).json({ success: false, message: "Lỗi tải checklist" }); }
        checklist = rows || [];
        tryRespond(res);
    });

    db.query(attachSql, [taskId], (err, rows) => {
        if (err) { hasError = true; return res.status(500).json({ success: false, message: "Lỗi tải tài liệu" }); }
        attachments = rows || [];
        tryRespond(res);
    });

    // time_logs table may not exist yet — graceful fallback
    db.query(timeSql, [taskId], (err, rows) => {
        if (err) { timeLogs = []; } else { timeLogs = rows || []; }
        tryRespond(res);
    });
}

/* ──────────────────────────────────────────
   COMMENTS
────────────────────────────────────────── */

const getComments = (req, res) => {
    const { taskId } = req.params;
    const sql = `
        SELECT c.id, c.content, c.created_at, c.mentions,
               u.id AS user_id, u.full_name AS user_name, u.role AS user_role
        FROM task_comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.task_id = ?
        ORDER BY c.created_at ASC
    `;
    db.query(sql, [taskId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi tải bình luận", error: err.message });
        return res.json({ success: true, comments: rows || [] });
    });
};

const addComment = (req, res) => {
    const { taskId } = req.params;
    const { content, mentions } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: "Nội dung bình luận không được để trống" });
    }

    const mentionsJson = mentions ? JSON.stringify(mentions) : null;

    const sql = "INSERT INTO task_comments (task_id, user_id, content, mentions) VALUES (?, ?, ?, ?)";
    db.query(sql, [taskId, userId, content.trim(), mentionsJson], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Không thể thêm bình luận", error: err.message });

        // Return the new comment with user info
        const fetchSql = `
            SELECT c.id, c.content, c.created_at, c.mentions,
                   u.id AS user_id, u.full_name AS user_name, u.role AS user_role
            FROM task_comments c LEFT JOIN users u ON u.id = c.user_id
            WHERE c.id = ?
        `;
        db.query(fetchSql, [result.insertId], (err2, rows) => {
            return res.status(201).json({
                success: true,
                message: "Đã thêm bình luận",
                comment: rows?.[0] || { id: result.insertId, content, user_id: userId }
            });
        });
    });
};

const deleteComment = (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    // Only comment owner or ADMIN can delete
    const checkSql = "SELECT user_id FROM task_comments WHERE id = ?";
    db.query(checkSql, [commentId], (err, rows) => {
        if (err || !rows?.length) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });

        if (role !== "ADMIN" && rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xóa bình luận này" });
        }

        db.query("DELETE FROM task_comments WHERE id = ?", [commentId], (delErr) => {
            if (delErr) return res.status(500).json({ success: false, message: "Không thể xóa bình luận" });
            return res.json({ success: true, message: "Đã xóa bình luận" });
        });
    });
};

/* ──────────────────────────────────────────
   CHECKLIST
────────────────────────────────────────── */

const getChecklist = (req, res) => {
    const { taskId } = req.params;
    db.query("SELECT id, title, is_done, created_at FROM task_checklists WHERE task_id = ? ORDER BY id ASC", [taskId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi tải checklist" });
        return res.json({ success: true, items: rows || [] });
    });
};

const addChecklistItem = (req, res) => {
    const { taskId } = req.params;
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: "Tiêu đề không được để trống" });

    db.query("INSERT INTO task_checklists (task_id, title) VALUES (?, ?)", [taskId, title.trim()], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Không thể thêm checklist item" });
        return res.status(201).json({ success: true, message: "Đã thêm", item: { id: result.insertId, title: title.trim(), is_done: 0 } });
    });
};

const updateChecklistItem = (req, res) => {
    const { itemId } = req.params;
    const { is_done, title } = req.body;

    const fields = [];
    const values = [];

    if (typeof is_done !== "undefined") { fields.push("is_done = ?"); values.push(is_done ? 1 : 0); }
    if (title !== undefined)            { fields.push("title = ?");   values.push(title.trim()); }

    if (!fields.length) return res.status(400).json({ success: false, message: "Không có trường cần cập nhật" });

    values.push(itemId);
    db.query(`UPDATE task_checklists SET ${fields.join(", ")} WHERE id = ?`, values, (err) => {
        if (err) return res.status(500).json({ success: false, message: "Không thể cập nhật checklist item" });
        return res.json({ success: true, message: "Đã cập nhật" });
    });
};

const deleteChecklistItem = (req, res) => {
    const { itemId } = req.params;
    db.query("DELETE FROM task_checklists WHERE id = ?", [itemId], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Không thể xóa checklist item" });
        return res.json({ success: true, message: "Đã xóa" });
    });
};

/* ──────────────────────────────────────────
   TIME TRACKING
────────────────────────────────────────── */

const logTime = (req, res) => {
    const { taskId } = req.params;
    const { hours, note } = req.body;
    const userId = req.user.id;

    if (!hours || isNaN(hours) || Number(hours) <= 0) {
        return res.status(400).json({ success: false, message: "Số giờ phải lớn hơn 0" });
    }

    // Create time_logs table if it doesn't exist (graceful)
    const createSql = `
        CREATE TABLE IF NOT EXISTS time_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT,
            hours DECIMAL(6,2) NOT NULL,
            note VARCHAR(255),
            logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `;
    db.query(createSql, [], (createErr) => {
        if (createErr) return res.status(500).json({ success: false, message: "Lỗi khởi tạo bảng time_logs" });

        db.query(
            "INSERT INTO time_logs (task_id, user_id, hours, note) VALUES (?, ?, ?, ?)",
            [taskId, userId, Number(hours), note?.trim() || null],
            (err, result) => {
                if (err) return res.status(500).json({ success: false, message: "Không thể lưu thời gian" });

                // Also update logged_hours on task (if column exists — graceful)
                db.query(
                    "UPDATE tasks SET logged_hours = COALESCE(logged_hours, 0) + ? WHERE id = ?",
                    [Number(hours), taskId],
                    () => {} // ignore error if column doesn't exist yet
                );

                return res.status(201).json({
                    success: true,
                    message: `Đã ghi nhận ${hours} giờ`,
                    log: { id: result.insertId, hours: Number(hours), note: note || null, user_id: userId }
                });
            }
        );
    });
};

const getTimeLogs = (req, res) => {
    const { taskId } = req.params;
    const sql = `
        SELECT tl.id, tl.hours, tl.note, tl.logged_at,
               u.full_name AS logged_by_name
        FROM time_logs tl
        LEFT JOIN users u ON u.id = tl.user_id
        WHERE tl.task_id = ?
        ORDER BY tl.logged_at DESC
    `;
    db.query(sql, [taskId], (err, rows) => {
        if (err) return res.json({ success: true, logs: [] }); // graceful if table missing
        return res.json({ success: true, logs: rows || [] });
    });
};

/* ──────────────────────────────────────────
   UPDATE TASK ESTIMATED HOURS
────────────────────────────────────────── */
const updateEstimatedHours = (req, res) => {
    const { taskId } = req.params;
    const { estimated_hours } = req.body;

    if (isNaN(estimated_hours) || Number(estimated_hours) < 0) {
        return res.status(400).json({ success: false, message: "Số giờ ước tính không hợp lệ" });
    }

    db.query(
        "UPDATE tasks SET estimated_hours = ? WHERE id = ?",
        [Number(estimated_hours), taskId],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: "Không thể cập nhật giờ ước tính" });
            return res.json({ success: true, message: "Đã cập nhật giờ ước tính" });
        }
    );
};

/* ──────────────────────────────────────────
   GET PROJECT MEMBERS (for @mention)
────────────────────────────────────────── */
const getProjectMembers = (req, res) => {
    const { projectId } = req.params;
    const sql = `
        SELECT u.id, u.full_name, u.email, u.role
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        WHERE pm.project_id = ?
        ORDER BY u.full_name ASC
    `;
    db.query(sql, [projectId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi lấy danh sách thành viên" });
        return res.json({ success: true, members: rows || [] });
    });
};

module.exports = {
    getTaskDetail,
    getComments,
    addComment,
    deleteComment,
    getChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    logTime,
    getTimeLogs,
    updateEstimatedHours,
    getProjectMembers
};
