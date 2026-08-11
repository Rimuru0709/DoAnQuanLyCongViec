import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    FaEnvelope,
    FaEye,
    FaFolderOpen,
    FaPhone,
    FaPlus,
    FaSearch,
    FaTasks,
    FaTrash,
    FaUser,
    FaUserEdit,
    FaUsers,
    FaUserShield,
    FaUserTie
} from "react-icons/fa";

import "./Member.css";

const MEMBER_API =
    "http://localhost:5000/api/members";

const PROJECT_API =
    "http://localhost:5000/api/projects";

const roleText = {
    ADMIN: "Quản trị viên",
    MANAGER: "Quản lý",
    MEMBER: "Thành viên"
};

const projectRoleText = {
    OWNER: "Chủ dự án",
    MANAGER: "Quản lý dự án",
    MEMBER: "Thành viên"
};

const initialForm = {
    full_name: "",
    email: "",
    phone: "",
    avatar: "",
    role: "MEMBER",
    position: "",
    role_in_project: "MEMBER",
    project_ids: [],
    project_names: ""
};

function Member() {
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] =
        useState("ALL");

    const [projectFilter, setProjectFilter] =
        useState("ALL");

    const [selectedMember, setSelectedMember] =
        useState(null);

    const [showFormModal, setShowFormModal] =
        useState(false);

    const [formMode, setFormMode] =
        useState("ADD");

    const [editingMemberId, setEditingMemberId] =
        useState(null);

    const [memberForm, setMemberForm] =
        useState(initialForm);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [formError, setFormError] =
        useState("");

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user")
        );
    } catch {
        currentUser = null;
    }

    const isAdmin =
        currentUser?.role === "ADMIN";

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

    const authFetch = async (
        url,
        options = {}
    ) => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            logoutAndRedirect();

            throw new Error(
                "Bạn chưa đăng nhập"
            );
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.body && {
                    "Content-Type":
                        "application/json"
                }),
                Authorization:
                    `Bearer ${token}`,
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

    /*
    |--------------------------------------------------------------------------
    | Tải danh sách nhân sự
    |--------------------------------------------------------------------------
    */

    const loadMembers = async (
        showLoading = true
    ) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            setError("");

            const response = await authFetch(
                MEMBER_API
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Không thể tải danh sách thành viên"
                );
            }

            setMembers(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.members)
                        ? data.members
                        : []
            );
        } catch (requestError) {
            console.error(
                "Lỗi tải thành viên:",
                requestError
            );

            if (
                requestError.message !==
                "Phiên đăng nhập đã hết hạn" &&
                requestError.message !==
                "Bạn chưa đăng nhập"
            ) {
                setError(
                    requestError.message ||
                    "Đã xảy ra lỗi khi tải danh sách thành viên"
                );
            }
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Tải danh sách dự án
    |--------------------------------------------------------------------------
    */

    const loadProjects = async () => {
        try {
            const response = await authFetch(
                PROJECT_API
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Không thể tải danh sách dự án"
                );
            }

            setProjects(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.projects)
                        ? data.projects
                        : []
            );
        } catch (requestError) {
            console.error(
                "Lỗi tải dự án:",
                requestError
            );

            setProjects([]);
        }
    };

    useEffect(() => {
        loadMembers(true);
        loadProjects();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | ESC đóng modal
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setSelectedMember(null);
                setShowFormModal(false);
                setEditingMemberId(null);
                setMemberForm(initialForm);
                setFormError("");
                setSaving(false);
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Khóa cuộn trang khi mở modal
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            selectedMember ||
            showFormModal
        ) {
            document.body.style.overflow =
                "hidden";
        } else {
            document.body.style.overflow =
                "";
        }

        return () => {
            document.body.style.overflow =
                "";
        };
    }, [
        selectedMember,
        showFormModal
    ]);

    const safeMembers =
        Array.isArray(members)
            ? members
            : [];

    const safeProjects =
        Array.isArray(projects)
            ? projects
            : [];

    /*
    |--------------------------------------------------------------------------
    | Lọc danh sách nhân sự
    |--------------------------------------------------------------------------
    */

    const filteredMembers = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        return safeMembers.filter(
            (member) => {
                const memberId =
                    String(
                        member.id || ""
                    ).toLowerCase();

                const fullName =
                    String(
                        member.full_name || ""
                    ).toLowerCase();

                const email =
                    String(
                        member.email || ""
                    ).toLowerCase();

                const phone =
                    String(
                        member.phone || ""
                    ).toLowerCase();

                const projectNames =
                    String(
                        member.project_names || ""
                    ).toLowerCase();

                const matchSearch =
                    keyword === "" ||
                    memberId.includes(keyword) ||
                    fullName.includes(keyword) ||
                    email.includes(keyword) ||
                    phone.includes(keyword) ||
                    projectNames.includes(keyword);

                const matchRole =
                    roleFilter === "ALL" ||
                    member.role === roleFilter;

                const selectedProject =
                    safeProjects.find(
                        (project) =>
                            String(
                                project.id
                            ) ===
                            String(
                                projectFilter
                            )
                    );

                const matchProject =
                    projectFilter === "ALL" ||
                    (
                        selectedProject &&
                        projectNames.includes(
                            String(
                                selectedProject.name
                            ).toLowerCase()
                        )
                    );

                return (
                    matchSearch &&
                    matchRole &&
                    matchProject
                );
            }
        );
    }, [
        safeMembers,
        safeProjects,
        search,
        roleFilter,
        projectFilter
    ]);

    /*
    |--------------------------------------------------------------------------
    | Thống kê
    |--------------------------------------------------------------------------
    */

    const statistics = useMemo(() => {
        return {
            total:
                safeMembers.length,

            admin:
                safeMembers.filter(
                    (member) =>
                        member.role === "ADMIN"
                ).length,

            manager:
                safeMembers.filter(
                    (member) =>
                        member.role === "MANAGER"
                ).length,

            member:
                safeMembers.filter(
                    (member) =>
                        member.role === "MEMBER"
                ).length
        };
    }, [safeMembers]);

    /*
    |--------------------------------------------------------------------------
    | Hàm tiện ích
    |--------------------------------------------------------------------------
    */

    const getInitial = (name) => {
        const normalizedName =
            String(name || "").trim();

        if (!normalizedName) {
            return "?";
        }

        return normalizedName
            .charAt(0)
            .toUpperCase();
    };

    const getAvatarUrl = (avatar) => {
        if (!avatar) {
            return null;
        }

        if (
            avatar.startsWith("http://") ||
            avatar.startsWith("https://")
        ) {
            return avatar;
        }

        const cleanAvatar =
            avatar.startsWith("/")
                ? avatar
                : `/${avatar}`;

        return (
            `http://localhost:5000${cleanAvatar}`
        );
    };

    const calculateProgress = (member) => {
        return Math.min(
            100,
            Math.max(
                0,
                Number(
                    member.average_task_progress
                ) || 0
            )
        );
    };

    const formatDate = (date) => {
        if (!date) {
            return "Chưa cập nhật";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Chưa cập nhật";
        }

        return parsedDate.toLocaleDateString(
            "vi-VN"
        );
    };

    const getMemberProjectIds = (
        member
    ) => {
        if (!member?.project_names) {
            return [];
        }

        const memberProjectNames =
            String(member.project_names)
                .split(",")
                .map((name) =>
                    name
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean);

        return safeProjects
            .filter((project) =>
                memberProjectNames.includes(
                    String(project.name)
                        .trim()
                        .toLowerCase()
                )
            )
            .map((project) =>
                Number(project.id)
            );
    };

    /*
    |--------------------------------------------------------------------------
    | Xem chi tiết nhân sự
    |--------------------------------------------------------------------------
    */

    const openMemberDetail = async (
        member
    ) => {
        try {
            const response = await authFetch(
                `${MEMBER_API}/detail/${member.id}`
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                setSelectedMember(member);
                return;
            }

            setSelectedMember(data);
        } catch (requestError) {
            console.error(
                "Lỗi tải chi tiết thành viên:",
                requestError
            );

            if (
                requestError.message !==
                "Phiên đăng nhập đã hết hạn" &&
                requestError.message !==
                "Bạn chưa đăng nhập"
            ) {
                setSelectedMember(member);
            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Mở form thêm nhân sự
    |--------------------------------------------------------------------------
    */

    const openAddModal = () => {
        if (!isAdmin) {
            window.alert(
                "Chỉ Admin mới có quyền thêm nhân sự"
            );

            return;
        }

        setFormMode("ADD");
        setEditingMemberId(null);
        setMemberForm(initialForm);
        setFormError("");
        setShowFormModal(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Mở form cập nhật nhân sự
    |--------------------------------------------------------------------------
    */

    const openEditModal = (member) => {
        if (!isAdmin) {
            window.alert(
                "Chỉ Admin mới có quyền sửa nhân sự"
            );

            return;
        }

        setFormMode("EDIT");
        setEditingMemberId(member.id);
        setFormError("");

        setMemberForm({
            full_name:
                member.full_name || "",

            email:
                member.email || "",

            phone:
                member.phone || "",

            avatar:
                member.avatar || "",

            role:
                member.role || "MEMBER",

            position:
                member.positions || "",

            role_in_project:
                "MEMBER",

            project_ids:
                getMemberProjectIds(member),

            project_names:
                member.project_names || "",
        });

        setShowFormModal(true);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setEditingMemberId(null);
        setMemberForm(initialForm);
        setFormError("");
        setSaving(false);
    };

    const handleFormChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setMemberForm(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );
    };


    const validateMemberForm = () => {
        const fullName =
            memberForm.full_name.trim();

        const email =
            memberForm.email.trim();

        const phone =
            memberForm.phone.trim();

        if (!fullName) {
            return "Vui lòng nhập họ và tên";
        }

        if (!email) {
            return "Vui lòng nhập email";
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return "Email không đúng định dạng";
        }

        if (
            phone &&
            !/^[0-9]{9,11}$/.test(phone)
        ) {
            return (
                "Số điện thoại phải gồm " +
                "từ 9 đến 11 chữ số"
            );
        }

        return "";
    };

    /*
    |--------------------------------------------------------------------------
    | Thêm hoặc cập nhật nhân sự
    |--------------------------------------------------------------------------
    */

    const typedProjectNames =
        String(memberForm.project_names || "")
            .split(",")
            .map((name) =>
                name.trim().toLowerCase()
            )
            .filter(Boolean);

    const matchedProjectIds =
        safeProjects
            .filter((project) =>
                typedProjectNames.includes(
                    String(project.name)
                        .trim()
                        .toLowerCase()
                )
            )
            .map((project) =>
                Number(project.id)
            );

    const notFoundProjectNames =
        typedProjectNames.filter(
            (typedName) =>
                !safeProjects.some(
                    (project) =>
                        String(project.name)
                            .trim()
                            .toLowerCase() ===
                        typedName
                )
        );

    if (notFoundProjectNames.length > 0) {
        setFormError(
            `Không tìm thấy dự án: ${notFoundProjectNames.join(", ")}`
        );

        setSaving(false);
        return;
    }

    const handleSaveMember = async (
        event
    ) => {
        event.preventDefault();

        if (!isAdmin) {
            setFormError(
                "Bạn không có quyền thực hiện thao tác này"
            );

            return;
        }

        const validationMessage =
            validateMemberForm();

        if (validationMessage) {
            setFormError(
                validationMessage
            );

            return;
        }

        try {
            setSaving(true);
            setFormError("");

            const payload = {
                full_name:
                    memberForm.full_name.trim(),

                email:
                    memberForm.email
                        .trim()
                        .toLowerCase(),

                phone:
                    memberForm.phone.trim() ||
                    null,

                avatar:
                    memberForm.avatar.trim() ||
                    null,

                role:
                    memberForm.role,

                position:
                    memberForm.position.trim(),

                role_in_project:
                    memberForm.role_in_project,

                project_ids:
                    matchedProjectIds
            };

            const isEditMode =
                formMode === "EDIT";

            const url = isEditMode
                ? `${MEMBER_API}/system/${editingMemberId}`
                : `${MEMBER_API}/system`;

            const response = await authFetch(
                url,
                {
                    method: isEditMode
                        ? "PUT"
                        : "POST",

                    body:
                        JSON.stringify(payload)
                }
            );

            const responseData =
                await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    responseData.message ||
                    (
                        isEditMode
                            ? "Cập nhật thành viên thất bại"
                            : "Thêm thành viên thất bại"
                    )
                );
            }

            closeFormModal();
            setSelectedMember(null);

            await Promise.all([
                loadMembers(false),
                loadProjects()
            ]);

            window.alert(
                responseData.message ||
                (
                    isEditMode
                        ? "Cập nhật thành viên thành công"
                        : "Thêm thành viên thành công"
                )
            );
        } catch (requestError) {
            console.error(
                "Lỗi lưu thành viên:",
                requestError
            );

            if (
                requestError.message !==
                "Phiên đăng nhập đã hết hạn" &&
                requestError.message !==
                "Bạn chưa đăng nhập"
            ) {
                setFormError(
                    requestError.message ||
                    "Không thể lưu thông tin thành viên"
                );
            }
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Xóa nhân sự khỏi hệ thống
    |--------------------------------------------------------------------------
    */

    const handleDeleteMember = async (
        member
    ) => {
        if (!isAdmin) {
            window.alert(
                "Chỉ Admin mới có quyền xóa nhân sự"
            );

            return;
        }

        if (!member) {
            return;
        }

        if (member.role === "ADMIN") {
            window.alert(
                "Không thể xóa tài khoản Admin"
            );

            return;
        }

        if (
            Number(member.id) ===
            Number(currentUser?.id)
        ) {
            window.alert(
                "Bạn không thể tự xóa tài khoản của mình"
            );

            return;
        }

        const confirmDelete =
            window.confirm(
                `Bạn có chắc muốn xóa thành viên "${member.full_name}" khỏi toàn bộ hệ thống không?\n\nThành viên này cũng sẽ bị xóa khỏi các dự án đang tham gia.`
            );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await authFetch(
                `${MEMBER_API}/system/${member.id}`,
                {
                    method: "DELETE"
                }
            );

            const responseData =
                await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    responseData.message ||
                    "Không thể xóa thành viên"
                );
            }

            setSelectedMember(null);
            closeFormModal();

            await loadMembers(false);

            window.alert(
                responseData.message ||
                "Xóa thành viên thành công"
            );
        } catch (requestError) {
            console.error(
                "Lỗi xóa thành viên:",
                requestError
            );

            if (
                requestError.message !==
                "Phiên đăng nhập đã hết hạn" &&
                requestError.message !==
                "Bạn chưa đăng nhập"
            ) {
                window.alert(
                    requestError.message ||
                    "Xóa thành viên thất bại"
                );
            }
        }
    };

    return (
        <div className="page-content">

            <main className="member-page">
                <div className="member-header">
                    <div>
                        <h1>Thành viên</h1>

                        <p>
                            Quản lý nhân sự và phân bổ
                            thành viên vào các dự án.
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            className="member-add-button"
                            onClick={openAddModal}
                        >
                            <FaPlus />
                            Thêm thành viên
                        </button>
                    )}
                </div>

                <section className="member-statistics">
                    <div className="member-stat-card">
                        <div className="member-stat-icon total">
                            <FaUsers />
                        </div>

                        <div className="member-stat-content">
                            <span>
                                Tổng thành viên
                            </span>

                            <b>
                                {statistics.total}
                            </b>
                        </div>
                    </div>

                    <div className="member-stat-card">
                        <div className="member-stat-icon admin">
                            <FaUserShield />
                        </div>

                        <div className="member-stat-content">
                            <span>
                                Quản trị viên
                            </span>

                            <b>
                                {statistics.admin}
                            </b>
                        </div>
                    </div>

                    <div className="member-stat-card">
                        <div className="member-stat-icon manager">
                            <FaUserTie />
                        </div>

                        <div className="member-stat-content">
                            <span>
                                Quản lý
                            </span>

                            <b>
                                {statistics.manager}
                            </b>
                        </div>
                    </div>

                    <div className="member-stat-card">
                        <div className="member-stat-icon member">
                            <FaUser />
                        </div>

                        <div className="member-stat-content">
                            <span>
                                Thành viên
                            </span>

                            <b>
                                {statistics.member}
                            </b>
                        </div>
                    </div>
                </section>

                <section className="member-toolbar">
                    <div className="member-search-box">
                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Tìm theo ID, họ tên, email, số điện thoại hoặc dự án..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <select
                        value={projectFilter}
                        onChange={(event) =>
                            setProjectFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            Tất cả dự án
                        </option>

                        {safeProjects.map(
                            (project) => (
                                <option
                                    key={project.id}
                                    value={project.id}
                                >
                                    {project.name}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(event) =>
                            setRoleFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            Tất cả vai trò
                        </option>

                        <option value="ADMIN">
                            Quản trị viên
                        </option>

                        <option value="MANAGER">
                            Quản lý
                        </option>

                        <option value="MEMBER">
                            Thành viên
                        </option>
                    </select>
                </section>

                <section className="member-table-card">
                    {loading ? (
                        <div className="member-state-message">
                            Đang tải danh sách thành viên...
                        </div>
                    ) : error ? (
                        <div className="member-state-message member-error">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={() =>
                                    loadMembers(true)
                                }
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : filteredMembers.length ===
                        0 ? (
                        <div className="member-state-message">
                            Không tìm thấy thành viên phù hợp.
                        </div>
                    ) : (
                        <div className="member-table-wrapper">
                            <table className="member-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Thành viên</th>
                                        <th>Liên hệ</th>
                                        <th>Vai trò</th>
                                        <th>
                                            Dự án tham gia
                                        </th>
                                        <th>Công việc</th>
                                        <th>Tiến độ</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredMembers.map(
                                        (member) => {
                                            const progress =
                                                calculateProgress(
                                                    member
                                                );

                                            const avatarUrl =
                                                getAvatarUrl(
                                                    member.avatar
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        member.id
                                                    }
                                                >
                                                    <td>
                                                        <span className="member-id">
                                                            #
                                                            {
                                                                member.id
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="member-profile-cell">
                                                            {avatarUrl ? (
                                                                <img
                                                                    className="member-avatar-image"
                                                                    src={
                                                                        avatarUrl
                                                                    }
                                                                    alt={
                                                                        member.full_name
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="member-avatar-text">
                                                                    {getInitial(
                                                                        member.full_name
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="member-profile-info">
                                                                <strong>
                                                                    {
                                                                        member.full_name
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {member.positions ||
                                                                        "Chưa có vị trí"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="member-contact-info">
                                                            <span>
                                                                <FaEnvelope />

                                                                {member.email ||
                                                                    "Chưa cập nhật"}
                                                            </span>

                                                            <span>
                                                                <FaPhone />

                                                                {member.phone ||
                                                                    "Chưa cập nhật"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`member-role-badge ${member.role ||
                                                                "MEMBER"
                                                                }`}
                                                        >
                                                            {roleText[
                                                                member.role
                                                            ] ||
                                                                "Thành viên"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="member-project-cell">
                                                            <strong>
                                                                {Number(
                                                                    member.project_count
                                                                ) ||
                                                                    0}{" "}
                                                                dự án
                                                            </strong>

                                                            <span
                                                                title={
                                                                    member.project_names ||
                                                                    ""
                                                                }
                                                            >
                                                                {member.project_names ||
                                                                    "Chưa tham gia dự án"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="member-task-cell">
                                                            <strong style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                                Tổng: {Number(member.total_tasks) || 0}
                                                                {Number(member.active_tasks) > 5 && (
                                                                    <span style={{
                                                                        fontSize:9, fontWeight:700, color:'#ef4444',
                                                                        background:'rgba(220,38,38,0.15)',
                                                                        padding:'1px 5px', borderRadius:4,
                                                                        border:'1px solid rgba(220,38,38,0.3)',
                                                                        letterSpacing:'0.02em'
                                                                    }}>
                                                                        ⚠ QUÁ TẢI
                                                                    </span>
                                                                )}
                                                            </strong>

                                                            <span>
                                                                Hoàn thành: {Number(member.completed_tasks) || 0}
                                                            </span>

                                                            <span style={{
                                                                color: Number(member.active_tasks) > 5 ? '#ef4444' : undefined,
                                                                fontWeight: Number(member.active_tasks) > 5 ? 600 : 400
                                                            }}>
                                                                Đang làm: {Number(member.active_tasks) || 0}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="member-progress">
                                                            <div className="member-progress-header">
                                                                <span>
                                                                    Hoàn thành
                                                                </span>

                                                                <b>
                                                                    {
                                                                        progress
                                                                    }
                                                                    %
                                                                </b>
                                                            </div>

                                                            <div className="member-progress-track">
                                                                <div
                                                                    className="member-progress-bar"
                                                                    style={{
                                                                        width: `${progress}%`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="member-action-buttons">
                                                            <button
                                                                type="button"
                                                                className="member-view-button"
                                                                onClick={() =>
                                                                    openMemberDetail(
                                                                        member
                                                                    )
                                                                }
                                                                title="Xem chi tiết"
                                                            >
                                                                <FaEye />
                                                                Xem
                                                            </button>

                                                            {isAdmin && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="member-edit-button"
                                                                        onClick={() =>
                                                                            openEditModal(
                                                                                member
                                                                            )
                                                                        }
                                                                        title="Sửa thành viên"
                                                                    >
                                                                        <FaUserEdit />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="member-delete-button"
                                                                        onClick={() =>
                                                                            handleDeleteMember(
                                                                                member
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            member.role ===
                                                                            "ADMIN" ||
                                                                            Number(
                                                                                member.id
                                                                            ) ===
                                                                            Number(
                                                                                currentUser?.id
                                                                            )
                                                                        }
                                                                        title={
                                                                            member.role ===
                                                                                "ADMIN"
                                                                                ? "Không thể xóa Admin"
                                                                                : Number(
                                                                                    member.id
                                                                                ) ===
                                                                                    Number(
                                                                                        currentUser?.id
                                                                                    )
                                                                                    ? "Không thể tự xóa tài khoản"
                                                                                    : "Xóa thành viên"
                                                                        }
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {showFormModal && isAdmin && (
                    <div
                        className="member-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeFormModal();
                            }
                        }}
                    >
                        <form
                            className="member-form-modal"
                            onSubmit={
                                handleSaveMember
                            }
                        >
                            <div className="member-form-header">
                                <div>
                                    <h2>
                                        {formMode ===
                                            "ADD"
                                            ? "Thêm thành viên"
                                            : "Cập nhật thành viên"}
                                    </h2>

                                    <p>
                                        {formMode ===
                                            "ADD"
                                            ? "Tạo nhân sự mới và phân bổ vào các dự án."
                                            : "Chỉnh sửa thông tin và dự án của thành viên."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="member-modal-close"
                                    onClick={
                                        closeFormModal
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            {formError && (
                                <div className="member-form-error">
                                    {formError}
                                </div>
                            )}

                            <div className="member-form-grid">
                                <div className="member-form-group">
                                    <label>
                                        Họ và tên{" "}
                                        <span className="required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        name="full_name"
                                        value={
                                            memberForm.full_name
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                <div className="member-form-group">
                                    <label>
                                        Email{" "}
                                        <span className="required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            memberForm.email
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="example@gmail.com"
                                    />
                                </div>

                                <div className="member-form-group">
                                    <label>
                                        Số điện thoại
                                    </label>

                                    <input
                                        type="text"
                                        name="phone"
                                        value={
                                            memberForm.phone
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div className="member-form-group">
                                    <label>
                                        Vai trò hệ thống
                                    </label>

                                    <select
                                        name="role"
                                        value={
                                            memberForm.role
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    >
                                        <option value="MEMBER">
                                            Thành viên
                                        </option>

                                        <option value="MANAGER">
                                            Quản lý
                                        </option>

                                        {formMode ===
                                            "EDIT" &&
                                            editingMemberId ===
                                            1 && (
                                                <option value="ADMIN">
                                                    Quản trị viên
                                                </option>
                                            )}
                                    </select>
                                </div>

                                <div className="member-form-group member-form-full">
                                    <label>
                                        Đường dẫn avatar
                                    </label>

                                    <input
                                        type="text"
                                        name="avatar"
                                        value={
                                            memberForm.avatar
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="/uploads/avatar.png hoặc https://..."
                                    />
                                </div>

                                <div className="member-form-group">
                                    <label>
                                        Vị trí trong dự án
                                    </label>

                                    <input
                                        type="text"
                                        name="position"
                                        value={
                                            memberForm.position
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="VD: Backend Developer"
                                    />
                                </div>

                                <div className="member-form-group">
                                    <label>
                                        Vai trò trong dự án
                                    </label>

                                    <select
                                        name="role_in_project"
                                        value={
                                            memberForm.role_in_project
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    >
                                        <option value="MEMBER">
                                            {
                                                projectRoleText.MEMBER
                                            }
                                        </option>

                                        <option value="MANAGER">
                                            {
                                                projectRoleText.MANAGER
                                            }
                                        </option>

                                        <option value="OWNER">
                                            {
                                                projectRoleText.OWNER
                                            }
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="member-project-selection">
                                <div className="member-project-selection-title">
                                    <FaFolderOpen />

                                    <div>
                                        <strong>Nhập dự án tham gia</strong>

                                        <span>
                                            Nhập tên các dự án, cách nhau bằng dấu phẩy
                                        </span>
                                    </div>
                                </div>

                                <div className="member-form-group member-form-full">
                                    <label>Tên dự án tham gia</label>

                                    <input
                                        type="text"
                                        value={memberForm.project_names || ""}
                                        onChange={(event) =>
                                            setMemberForm((previous) => ({
                                                ...previous,
                                                project_names:
                                                    event.target.value
                                            }))
                                        }
                                        placeholder="Ví dụ: Website bán hàng, Hệ thống CRM"
                                    />
                                </div>
                            </div>

                            <div className="member-form-actions">
                                <button
                                    type="button"
                                    className="member-form-cancel"
                                    onClick={
                                        closeFormModal
                                    }
                                    disabled={saving}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="member-form-save"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Đang lưu..."
                                        : formMode ===
                                            "ADD"
                                            ? "Thêm thành viên"
                                            : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {selectedMember && (
                    <div
                        className="member-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setSelectedMember(
                                    null
                                );
                            }
                        }}
                    >
                        <div className="member-modal">
                            <div className="member-modal-header">
                                <div className="member-modal-profile">
                                    {getAvatarUrl(
                                        selectedMember.avatar
                                    ) ? (
                                        <img
                                            className="member-modal-avatar-image"
                                            src={getAvatarUrl(
                                                selectedMember.avatar
                                            )}
                                            alt={
                                                selectedMember.full_name
                                            }
                                        />
                                    ) : (
                                        <div className="member-modal-avatar-text">
                                            {getInitial(
                                                selectedMember.full_name
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <h2>
                                            {selectedMember.full_name ||
                                                "Không rõ thành viên"}
                                        </h2>

                                        <p>
                                            ID người dùng:
                                            #
                                            {
                                                selectedMember.id
                                            }
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="member-modal-close"
                                    onClick={() =>
                                        setSelectedMember(
                                            null
                                        )
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            <div className="member-modal-grid">
                                <div className="member-modal-info-card">
                                    <span>Email</span>

                                    <b>
                                        {selectedMember.email ||
                                            "Chưa cập nhật"}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Số điện thoại
                                    </span>

                                    <b>
                                        {selectedMember.phone ||
                                            "Chưa cập nhật"}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Vai trò hệ thống
                                    </span>

                                    <b>
                                        {roleText[
                                            selectedMember.role
                                        ] ||
                                            "Thành viên"}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Vị trí trong dự án
                                    </span>

                                    <b>
                                        {selectedMember.positions ||
                                            "Chưa có vị trí"}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Ngày tạo
                                    </span>

                                    <b>
                                        {formatDate(
                                            selectedMember.created_at
                                        )}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Số dự án tham gia
                                    </span>

                                    <b>
                                        {Number(
                                            selectedMember.project_count
                                        ) || 0}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Tổng công việc
                                    </span>

                                    <b>
                                        {Number(
                                            selectedMember.total_tasks
                                        ) || 0}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Đang xử lý
                                    </span>

                                    <b>
                                        {Number(
                                            selectedMember.active_tasks
                                        ) || 0}
                                    </b>
                                </div>

                                <div className="member-modal-info-card">
                                    <span>
                                        Đã hoàn thành
                                    </span>

                                    <b>
                                        {Number(
                                            selectedMember.completed_tasks
                                        ) || 0}
                                    </b>
                                </div>
                            </div>

                            <div className="member-modal-projects">
                                <div className="member-modal-section-title">
                                    <FaFolderOpen />

                                    <span>
                                        Dự án tham gia
                                    </span>
                                </div>

                                <p>
                                    {selectedMember.project_names ||
                                        "Thành viên chưa tham gia dự án nào."}
                                </p>
                            </div>

                            <div className="member-modal-progress">
                                <div className="member-modal-progress-header">
                                    <div>
                                        <FaTasks />

                                        <span>
                                            Tiến độ hoàn thành công việc
                                        </span>
                                    </div>

                                    <b>
                                        {calculateProgress(
                                            selectedMember
                                        )}
                                        %
                                    </b>
                                </div>

                                <div className="member-progress-track">
                                    <div
                                        className="member-progress-bar"
                                        style={{
                                            width: `${calculateProgress(
                                                selectedMember
                                            )}%`
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="member-detail-actions">
                                <button
                                    type="button"
                                    className="member-detail-close"
                                    onClick={() =>
                                        setSelectedMember(
                                            null
                                        )
                                    }
                                >
                                    Đóng
                                </button>

                                {isAdmin && (
                                    <>
                                        <button
                                            type="button"
                                            className="member-detail-edit"
                                            onClick={() => {
                                                const member =
                                                    selectedMember;

                                                setSelectedMember(
                                                    null
                                                );

                                                openEditModal(
                                                    member
                                                );
                                            }}
                                        >
                                            <FaUserEdit />
                                            Chỉnh sửa
                                        </button>

                                        {selectedMember.role !==
                                            "ADMIN" &&
                                            Number(
                                                selectedMember.id
                                            ) !==
                                            Number(
                                                currentUser?.id
                                            ) && (
                                                <button
                                                    type="button"
                                                    className="member-detail-delete"
                                                    onClick={() =>
                                                        handleDeleteMember(
                                                            selectedMember
                                                        )
                                                    }
                                                >
                                                    <FaTrash />
                                                    Xóa
                                                </button>
                                            )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Member;