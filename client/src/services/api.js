/**
 * ProjectMaster — Centralized API Service
 * 
 * Tất cả requests tới backend đi qua đây để:
 * - Tự động gắn JWT token
 * - Xử lý 401 (hết phiên) tự động
 * - Thống nhất error handling
 */

const BASE_URL = "http://localhost:5000/api";

/**
 * Lấy JWT token từ localStorage
 */
const getToken = () => localStorage.getItem("token");

/**
 * Lấy thông tin user hiện tại từ localStorage
 */
export const getCurrentUser = () => {
    try {
        const data = localStorage.getItem("user");
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

/**
 * Xóa session và redirect về login
 */
const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
};

/**
 * Core fetch với auto JWT header + 401 handler
 * @param {string} endpoint - Đường dẫn API (ví dụ: "/home")
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - JSON data
 */
export const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();

    const defaultHeaders = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    // Hết hạn token → tự động logout
    if (response.status === 401) {
        logout();
        throw new Error("Phiên đăng nhập đã hết hạn");
    }

    // Parse JSON (kể cả khi response không OK)
    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
};

/**
 * Upload file với FormData (không set Content-Type để browser tự set boundary)
 */
export const apiUpload = async (endpoint, formData) => {
    const token = getToken();

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (response.status === 401) {
        logout();
        throw new Error("Phiên đăng nhập đã hết hạn");
    }

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
};

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
export const authAPI = {
    login: (email, password) =>
        apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    register: (data) =>
        apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ─────────────────────────────────────────
// HOME / DASHBOARD
// ─────────────────────────────────────────
export const homeAPI = {
    getDashboard: () => apiFetch("/home"),
};

// ─────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────
export const projectAPI = {
    getAll: () => apiFetch("/projects"),
    getById: (id) => apiFetch(`/projects/${id}`),
    create: (data) =>
        apiFetch("/projects", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
        apiFetch(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) =>
        apiFetch(`/projects/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────
export const taskAPI = {
    getAll: () => apiFetch("/tasks"),
    getByProject: (projectId) => apiFetch(`/tasks/project/${projectId}`),
    create: (data) =>
        apiFetch("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
        apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    updateStatus: (id, status) =>
        apiFetch(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    delete: (id) =>
        apiFetch(`/tasks/${id}`, { method: "DELETE" }),
    getGantt: (projectId) =>
        apiFetch(`/tasks/project/${projectId}/gantt`),
};

// ─────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────
export const memberAPI = {
    getAll: (params = "") => apiFetch(`/members${params}`),
    getProjectMembers: (projectId) => apiFetch(`/members/project/${projectId}`),
};

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────
export const notificationAPI = {
    getAll: (params = "") => apiFetch(`/notifications${params}`),
    getUnreadCount: () => apiFetch("/notifications/unread-count"),
    getLatest: (limit = 5) => apiFetch(`/notifications/latest?limit=${limit}`),
    markRead: (id) =>
        apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () =>
        apiFetch("/notifications/read-all", { method: "PATCH" }),
    clearAll: () =>
        apiFetch("/notifications/clear-all", { method: "DELETE" }),
};

// ─────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────
export const reportAPI = {
    get:             (params = "") => apiFetch(`/reports/dashboard${params}`),
    getWorkload:     ()            => apiFetch("/reports/workload"),
    getTimeTracking: (params = "") => apiFetch(`/reports/time-tracking${params}`),
    getBottleneck:   ()            => apiFetch("/reports/bottleneck"),
};

// ─────────────────────────────────────────
// ACTIVITIES
// ─────────────────────────────────────────
export const activityAPI = {
    getByProject: (projectId, limit = 50) => apiFetch(`/activities/project/${projectId}?limit=${limit}`),
    getByTask:    (taskId)                => apiFetch(`/activities/task/${taskId}`),
    getRecent:    (limit = 20)            => apiFetch(`/activities/recent?limit=${limit}`),
};

// ─────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────
export const documentAPI = {
    getByProject: (projectId) => apiFetch(`/documents/project/${projectId}`),
    upload: (formData) => apiUpload("/documents/upload", formData),
    delete: (id) => apiFetch(`/documents/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────
// AUTOMATION RULES
// ─────────────────────────────────────────
export const automationAPI = {
    getByProject: (projectId) => apiFetch(`/automation/${projectId}`),
    create:        (data)      => apiFetch("/automation", { method: "POST", body: JSON.stringify(data) }),
    toggle:        (id, active)=> apiFetch(`/automation/${id}/toggle`, { method: "PATCH", body: JSON.stringify({ is_active: active }) }),
    update:        (id, data)  => apiFetch(`/automation/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete:        (id)        => apiFetch(`/automation/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────
// TASK DEPENDENCIES
// ─────────────────────────────────────────
export const dependencyAPI = {
    getForTask:    (taskId)              => apiFetch(`/automation/task/${taskId}/dependencies`),
    getProjectTasks:(taskId, projectId) => apiFetch(`/automation/task/${taskId}/project-tasks?projectId=${projectId}`),
    add:           (taskId, depId)      => apiFetch("/automation/task/dependency", { method: "POST",   body: JSON.stringify({ task_id: taskId, depends_on_task_id: depId }) }),
    remove:        (taskId, depId)      => apiFetch("/automation/task/dependency", { method: "DELETE", body: JSON.stringify({ task_id: taskId, depends_on_task_id: depId }) }),
};

export default apiFetch;
