import { useEffect, useState } from "react";
import "./Member.css";

function Member({ projectId }) {
    const API_URL = "http://localhost:5000";

    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);

    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    const [formData, setFormData] = useState({
        user_id: "",
        position: "",
        role_in_project: "MEMBER",
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const loadMembers = async () => {
        const res = await fetch(`${API_URL}/api/members/${projectId}`);
        const data = await res.json();
        setMembers(data);
    };

    const loadUsers = async () => {
        const res = await fetch(`${API_URL}/api/members/users`);
        const data = await res.json();
        setUsers(data);
    };

    useEffect(() => {
        loadMembers();
        loadUsers();
    }, [projectId]);

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const openAddForm = () => {
        setEditingMember(null);
        setFormData({
            user_id: "",
            position: "",
            role_in_project: "MEMBER",
        });
        setShowForm(true);
    };

    const openEditForm = (member) => {
        setEditingMember(member);
        setFormData({
            user_id: member.user_id,
            position: member.position || "",
            role_in_project: member.role_in_project || "MEMBER",
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingMember(null);

        setFormData({
            user_id: "",
            position: "",
            role_in_project: "MEMBER",
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingMember && !formData.user_id) {
            alert("Vui lòng chọn thành viên");
            return;
        }

        const url = editingMember
            ? `${API_URL}/api/members/${editingMember.id}`
            : `${API_URL}/api/members`;

        const method = editingMember ? "PUT" : "POST";

        const body = editingMember
            ? {
                position: formData.position,
                role_in_project: formData.role_in_project,
            }
            : {
                project_id: projectId,
                user_id: formData.user_id,
                position: formData.position,
                role_in_project: formData.role_in_project,
            };

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const error = await res.json();
            alert(error.message || "Thao tác thất bại");
            return;
        }

        closeForm();
        loadMembers();
    };

    const handleDelete = async (id) => {
        const res = await fetch(`${API_URL}/api/members/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            alert("Xóa thành viên thất bại");
            return;
        }

        loadMembers();
    };

    const getRoleText = (role) => {
        if (role === "OWNER") return "Chủ dự án";
        if (role === "MANAGER") return "Quản lý";
        return "Thành viên";
    };

    const filteredMembers = members.filter((member) => {
        const keyword = search.toLowerCase();

        return (
            member.full_name?.toLowerCase().includes(keyword) ||
            member.email?.toLowerCase().includes(keyword) ||
            member.position?.toLowerCase().includes(keyword) ||
            getRoleText(member.role_in_project).toLowerCase().includes(keyword)
        );
    });

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="member-page">
            <div className="member-header">
                <div>
                    <h2>Thành viên dự án</h2>
                    <p>Quản lý thành viên, vai trò và chức vụ trong dự án.</p>
                </div>

                <button onClick={openAddForm}>+ Thêm thành viên</button>
            </div>

            <div className="member-toolbar">
                <input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
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
                            <th>Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedMembers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="empty-member">
                                    Chưa có thành viên nào
                                </td>
                            </tr>
                        ) : (
                            paginatedMembers.map((member) => (
                                <tr key={member.id}>
                                    <td>
                                        <div className="member-user">
                                            {member.avatar ? (
                                                <img
                                                    src={`${API_URL}/${member.avatar}`}
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="member-avatar">
                                                    {member.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            <div>
                                                <h4>{member.full_name}</h4>
                                                <p>{member.phone || "Chưa có số điện thoại"}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{member.email}</td>
                                    <td>{member.position || "Chưa có chức vụ"}</td>

                                    <td>
                                        <span className={`member-role ${member.role_in_project}`}>
                                            {getRoleText(member.role_in_project)}
                                        </span>
                                    </td>

                                    <td>{formatDate(member.joined_at)}</td>

                                    <td>
                                        <div className="member-actions">
                                            <button
                                                className="btn-member-edit"
                                                onClick={() => openEditForm(member)}
                                            >
                                                Sửa
                                            </button>

                                            <button
                                                className="btn-member-delete"
                                                onClick={() => handleDelete(member.id)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="member-pagination">
                <span>
                    Hiển thị {paginatedMembers.length} / {filteredMembers.length} thành viên
                </span>

                <div>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        Trước
                    </button>

                    <span>Trang {currentPage} / {totalPages || 1}</span>

                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Sau
                    </button>
                </div>
            </div>

            {showForm && (
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
                                    <label>Chọn người dùng</label>
                                    <select
                                        value={formData.user_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                user_id: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">-- Chọn thành viên --</option>
                                        {users
                                            .filter((user) =>
                                                !members.some((member) => member.user_id === user.id)
                                            )
                                            .map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.full_name} - {user.email}
                                                </option>
                                            ))}
                                    </select>
                                </>
                            )}

                            <label>Chức vụ</label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        position: e.target.value,
                                    })
                                }
                                placeholder="VD: Frontend Developer"
                            />

                            <label>Vai trò trong dự án</label>
                            <select
                                value={formData.role_in_project}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        role_in_project: e.target.value,
                                    })
                                }
                            >
                                <option value="OWNER">Chủ dự án</option>
                                <option value="MANAGER">Quản lý</option>
                                <option value="MEMBER">Thành viên</option>
                            </select>

                            <div className="member-modal-actions">
                                <button
                                    type="button"
                                    className="btn-member-cancel"
                                    onClick={closeForm}
                                >
                                    Hủy
                                </button>

                                <button type="submit" className="btn-member-save">
                                    {editingMember ? "Cập nhật" : "Thêm"}
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