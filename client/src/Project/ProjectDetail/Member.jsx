import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Member.css";

const API_URL = "http://localhost:5000";

function Member({ projectId }) {
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const itemsPerPage = 5;
    const token = localStorage.getItem("token");

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user")
        );
    } catch {
        currentUser = null;
    }

    const canManageMembers =
        currentUser?.role === "ADMIN" ||
        currentUser?.role === "MANAGER";

    const [formData, setFormData] = useState({
        user_id: "",
        position: "",
        role_in_project: "MEMBER"
    });

    const showToast = (text) => {
        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 2500);
    };

    const logoutAndRedirect = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
            replace: true
        });
    };

    const parseResponse = async (response) => {
        try {
            return await response.json();
        } catch {
            return {};
        }
    };

    const authFetch = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.body && {
                    "Content-Type": "application/json"
                }),
                Authorization: `Bearer ${token}`,
                ...options.headers
            }
        });

        if (response.status === 401) {
            logoutAndRedirect();

            throw new Error(
                "Phiên đăng nhập đã hết hạn"
            );
        }

        return response;
    };

    const loadMembers = async () => {
        if (!token) {
            logoutAndRedirect();
            return;
        }

        setLoading(true);

        try {
            const response = await authFetch(
                `${API_URL}/api/members/${projectId}`
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Không thể tải danh sách thành viên"
                );

                setMembers([]);
                return;
            }

            setMembers(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.members)
                        ? data.members
                        : []
            );
        } catch (error) {
            console.error(
                "Lỗi tải thành viên:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        if (!canManageMembers) {
            setUsers([]);
            return;
        }

        try {
            const response = await authFetch(
                `${API_URL}/api/members/users`
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                setUsers([]);
                return;
            }

            setUsers(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.users)
                        ? data.users
                        : []
            );
        } catch (error) {
            console.error(
                "Lỗi tải người dùng:",
                error
            );
        }
    };

    useEffect(() => {
        if (projectId) {
            loadMembers();
            loadUsers();
        }
    }, [projectId]);

    const formatDate = (date) => {
        if (!date) {
            return "Chưa có";
        }

        return new Date(date).toLocaleDateString(
            "vi-VN"
        );
    };

    const openAddForm = () => {
        if (!canManageMembers) {
            showToast(
                "Bạn không có quyền thêm thành viên"
            );

            return;
        }

        setEditingMember(null);

        setFormData({
            user_id: "",
            position: "",
            role_in_project: "MEMBER"
        });

        setShowForm(true);
    };

    const openEditForm = (member) => {
        if (!canManageMembers) {
            showToast(
                "Bạn không có quyền sửa thành viên"
            );

            return;
        }

        setEditingMember(member);

        setFormData({
            user_id: member.user_id,
            position: member.position || "",
            role_in_project:
                member.role_in_project || "MEMBER"
        });

        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingMember(null);

        setFormData({
            user_id: "",
            position: "",
            role_in_project: "MEMBER"
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canManageMembers) {
            showToast(
                "Bạn không có quyền thực hiện thao tác này"
            );

            return;
        }

        if (!editingMember && !formData.user_id) {
            showToast(
                "Vui lòng chọn thành viên"
            );

            return;
        }

        const url = editingMember
            ? `${API_URL}/api/members/${editingMember.id}`
            : `${API_URL}/api/members`;

        const method = editingMember
            ? "PUT"
            : "POST";

        const body = editingMember
            ? {
                position:
                    formData.position.trim(),
                role_in_project:
                    formData.role_in_project
            }
            : {
                project_id:
                    Number(projectId),
                user_id:
                    Number(formData.user_id),
                position:
                    formData.position.trim(),
                role_in_project:
                    formData.role_in_project
            };

        try {
            const response = await authFetch(url, {
                method,
                body: JSON.stringify(body)
            });

            const data = await parseResponse(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Thao tác thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                (editingMember
                    ? "Cập nhật thành viên thành công"
                    : "Thêm thành viên thành công")
            );

            closeForm();

            await Promise.all([
                loadMembers(),
                loadUsers()
            ]);
        } catch (error) {
            console.error(
                "Lỗi lưu thành viên:",
                error
            );
        }
    };

    const handleDelete = async (memberId) => {
        if (!canManageMembers) {
            showToast(
                "Bạn không có quyền xóa thành viên"
            );

            return;
        }

        try {
            const response = await authFetch(
                `${API_URL}/api/members/${memberId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                showToast(
                    data.message ||
                    "Xóa thành viên thất bại"
                );

                return;
            }

            showToast(
                data.message ||
                "Xóa thành viên thành công"
            );

            await Promise.all([
                loadMembers(),
                loadUsers()
            ]);
        } catch (error) {
            console.error(
                "Lỗi xóa thành viên:",
                error
            );
        }
    };

    const getRoleText = (role) => {
        if (role === "OWNER") {
            return "Chủ dự án";
        }

        if (role === "MANAGER") {
            return "Quản lý";
        }

        return "Thành viên";
    };

    const filteredMembers = members.filter(
        (member) => {
            const keyword =
                search.trim().toLowerCase();

            const fullName =
                member.full_name?.toLowerCase() || "";

            const email =
                member.email?.toLowerCase() || "";

            const position =
                member.position?.toLowerCase() || "";

            const roleText =
                getRoleText(
                    member.role_in_project
                ).toLowerCase();

            return (
                fullName.includes(keyword) ||
                email.includes(keyword) ||
                position.includes(keyword) ||
                roleText.includes(keyword)
            );
        }
    );

    const totalPages = Math.ceil(
        filteredMembers.length /
        itemsPerPage
    );

    const paginatedMembers =
        filteredMembers.slice(
            (currentPage - 1) *
                itemsPerPage,
            currentPage *
                itemsPerPage
        );

    return (
        <div className="member-page">
            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <div className="member-header">
                <div>
                    <h2>Thành viên dự án</h2>

                    <p>
                        Quản lý thành viên, vai trò và
                        chức vụ trong dự án.
                    </p>
                </div>

                {canManageMembers && (
                    <button onClick={openAddForm}>
                        + Thêm thành viên
                    </button>
                )}
            </div>

            <div className="member-toolbar">
                <input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    value={search}
                    onChange={(event) => {
                        setSearch(
                            event.target.value
                        );

                        setCurrentPage(1);
                    }}
                />
            </div>

            <div className="member-table">
                <table>
                    <thead>
                        <tr>
                            <th>Thành viên</th>
                            <th>Email</th>
                            <th>Chức vụ</th>
                            <th>Vai trò</th>
                            <th>Ngày tham gia</th>

                            {canManageMembers && (
                                <th>Hành động</th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={
                                        canManageMembers
                                            ? 6
                                            : 5
                                    }
                                    className="empty-member"
                                >
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : paginatedMembers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        canManageMembers
                                            ? 6
                                            : 5
                                    }
                                    className="empty-member"
                                >
                                    Chưa có thành viên nào
                                </td>
                            </tr>
                        ) : (
                            paginatedMembers.map(
                                (member) => (
                                    <tr key={member.id}>
                                        <td>
                                            <div className="member-user">
                                                {member.avatar ? (
                                                    <img
                                                        src={`${API_URL}/${member.avatar}`}
                                                        alt={
                                                            member.full_name
                                                        }
                                                    />
                                                ) : (
                                                    <div className="member-avatar">
                                                        {member.full_name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ||
                                                            "?"}
                                                    </div>
                                                )}

                                                <div>
                                                    <h4>
                                                        {
                                                            member.full_name
                                                        }
                                                    </h4>

                                                    <p>
                                                        {member.phone ||
                                                            "Chưa có số điện thoại"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {member.email}
                                        </td>

                                        <td>
                                            {member.position ||
                                                "Chưa có chức vụ"}
                                        </td>

                                        <td>
                                            <span
                                                className={`member-role ${member.role_in_project}`}
                                            >
                                                {getRoleText(
                                                    member.role_in_project
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(
                                                member.joined_at
                                            )}
                                        </td>

                                        {canManageMembers && (
                                            <td>
                                                <div className="member-actions">
                                                    <button
                                                        className="btn-member-edit"
                                                        onClick={() =>
                                                            openEditForm(
                                                                member
                                                            )
                                                        }
                                                    >
                                                        Sửa
                                                    </button>

                                                    <button
                                                        className="btn-member-delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                member.id
                                                            )
                                                        }
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </div>

            <div className="member-pagination">
                <span>
                    Hiển thị{" "}
                    {paginatedMembers.length} /{" "}
                    {filteredMembers.length} thành viên
                </span>

                <div>
                    <button
                        type="button"
                        disabled={
                            currentPage === 1
                        }
                        onClick={() =>
                            setCurrentPage(
                                currentPage - 1
                            )
                        }
                    >
                        Trước
                    </button>

                    <span>
                        Trang {currentPage} /{" "}
                        {totalPages || 1}
                    </span>

                    <button
                        type="button"
                        disabled={
                            currentPage === totalPages ||
                            totalPages === 0
                        }
                        onClick={() =>
                            setCurrentPage(
                                currentPage + 1
                            )
                        }
                    >
                        Sau
                    </button>
                </div>
            </div>

            {showForm && canManageMembers && (
                <div className="member-modal-overlay">
                    <div className="member-modal">
                        <h2>
                            {editingMember
                                ? "Cập nhật thành viên"
                                : "Thêm thành viên"}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            {!editingMember && (
                                <>
                                    <label>
                                        Chọn người dùng
                                    </label>

                                    <select
                                        value={
                                            formData.user_id
                                        }
                                        onChange={(event) =>
                                            setFormData({
                                                ...formData,
                                                user_id:
                                                    event.target.value
                                            })
                                        }
                                        required
                                    >
                                        <option value="">
                                            -- Chọn thành viên --
                                        </option>

                                        {users
                                            .filter(
                                                (user) =>
                                                    !members.some(
                                                        (member) =>
                                                            Number(
                                                                member.user_id
                                                            ) ===
                                                            Number(
                                                                user.id
                                                            )
                                                    )
                                            )
                                            .map((user) => (
                                                <option
                                                    key={user.id}
                                                    value={user.id}
                                                >
                                                    {user.full_name} -{" "}
                                                    {user.email}
                                                </option>
                                            ))}
                                    </select>
                                </>
                            )}

                            <label>Chức vụ</label>

                            <input
                                type="text"
                                value={
                                    formData.position
                                }
                                onChange={(event) =>
                                    setFormData({
                                        ...formData,
                                        position:
                                            event.target.value
                                    })
                                }
                                placeholder="VD: Frontend Developer"
                            />

                            <label>
                                Vai trò trong dự án
                            </label>

                            <select
                                value={
                                    formData.role_in_project
                                }
                                onChange={(event) =>
                                    setFormData({
                                        ...formData,
                                        role_in_project:
                                            event.target.value
                                    })
                                }
                            >
                                <option value="OWNER">
                                    Chủ dự án
                                </option>

                                <option value="MANAGER">
                                    Quản lý
                                </option>

                                <option value="MEMBER">
                                    Thành viên
                                </option>
                            </select>

                            <div className="member-modal-actions">
                                <button
                                    type="button"
                                    className="btn-member-cancel"
                                    onClick={closeForm}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="btn-member-save"
                                >
                                    {editingMember
                                        ? "Cập nhật"
                                        : "Thêm"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Member;