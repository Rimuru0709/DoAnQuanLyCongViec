import {
    useEffect,
    useRef,
    useState
} from "react";
import { useNavigate } from "react-router-dom";
import "./Document.css";

const API_URL = "http://localhost:5000";

function Document({ projectId }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");
    const [file, setFile] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
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

    const canManageDocuments =
        currentUser?.role === "ADMIN" ||
        currentUser?.role === "MANAGER";

    const showMessage = (text) => {
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

    const loadDocuments = async () => {
        if (!token) {
            logoutAndRedirect();
            return;
        }

        setLoading(true);

        try {
            const response = await authFetch(
                `${API_URL}/api/documents/${projectId}`
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                showMessage(
                    data.message ||
                    "Không thể tải danh sách tài liệu"
                );

                setDocuments([]);
                return;
            }

            setDocuments(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.documents)
                        ? data.documents
                        : []
            );
        } catch (error) {
            console.error(
                "Lỗi tải tài liệu:",
                error
            );

            if (
                error.message !==
                "Phiên đăng nhập đã hết hạn"
            ) {
                showMessage(
                    "Không thể kết nối đến server"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadDocuments();
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

    const formatSize = (bytes) => {
        const size = Number(bytes) || 0;

        if (size === 0) {
            return "0 KB";
        }

        if (size < 1024) {
            return `${size} B`;
        }

        if (size < 1024 * 1024) {
            return `${Math.round(size / 1024)} KB`;
        }

        return `${(
            size /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    };

    const getFileType = (name) => {
        if (!name || !name.includes(".")) {
            return "FILE";
        }

        return (
            name
                .split(".")
                .pop()
                ?.toUpperCase() || "FILE"
        );
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!canManageDocuments) {
            showMessage(
                "Bạn không có quyền tải tài liệu lên"
            );

            return;
        }

        if (!file) {
            showMessage(
                "Vui lòng chọn tài liệu"
            );

            return;
        }

        if (!token) {
            logoutAndRedirect();
            return;
        }

        const formData = new FormData();

        formData.append(
            "document",
            file
        );

        formData.append(
            "project_id",
            projectId
        );

        formData.append(
            "uploaded_by",
            currentUser?.full_name ||
            "Không rõ"
        );

        setUploading(true);

        try {
            const response = await authFetch(
                `${API_URL}/api/documents`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                showMessage(
                    data.message ||
                    "Tải tài liệu thất bại"
                );

                return;
            }

            showMessage(
                data.message ||
                "Tải tài liệu thành công"
            );

            setFile(null);
            setCurrentPage(1);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            loadDocuments();
        } catch (error) {
            console.error(
                "Lỗi tải tài liệu:",
                error
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentId) => {
        if (!canManageDocuments) {
            showMessage(
                "Bạn không có quyền xóa tài liệu"
            );

            return;
        }

        try {
            const response = await authFetch(
                `${API_URL}/api/documents/${documentId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await parseResponse(response);

            if (!response.ok) {
                showMessage(
                    data.message ||
                    "Xóa tài liệu thất bại"
                );

                return;
            }

            showMessage(
                data.message ||
                "Xóa tài liệu thành công"
            );

            loadDocuments();
        } catch (error) {
            console.error(
                "Lỗi xóa tài liệu:",
                error
            );
        }
    };

    const filteredDocuments = documents.filter(
        (document) => {
            const keyword =
                search.trim().toLowerCase();

            const fileName =
                document.file_name
                    ?.toLowerCase() || "";

            const uploader =
                document.uploaded_by
                    ?.toLowerCase() || "";

            return (
                fileName.includes(keyword) ||
                uploader.includes(keyword)
            );
        }
    );

    const totalPages = Math.ceil(
        filteredDocuments.length /
        itemsPerPage
    );

    const paginatedDocuments =
        filteredDocuments.slice(
            (currentPage - 1) *
                itemsPerPage,
            currentPage *
                itemsPerPage
        );

    return (
        <div className="document-page">
            {message && (
                <div className="toast-success">
                    {message}
                </div>
            )}

            <div className="document-header">
                <div>
                    <h2>Tài liệu dự án</h2>

                    <p>
                        Quản lý tài liệu, file đính kèm
                        và phiên bản của dự án.
                    </p>
                </div>
            </div>

            {canManageDocuments && (
                <form
                    className="document-upload"
                    onSubmit={handleUpload}
                >
                    <div>
                        <label>
                            Chọn tài liệu
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(event) =>
                                setFile(
                                    event.target
                                        .files?.[0] ||
                                    null
                                )
                            }
                        />
                    </div>

                    <div>
                        <label>
                            Người tải
                        </label>

                        <input
                            type="text"
                            value={
                                currentUser?.full_name ||
                                ""
                            }
                            readOnly
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                    >
                        {uploading
                            ? "Đang tải..."
                            : "Tải tài liệu lên"}
                    </button>
                </form>
            )}

            <div className="document-toolbar">
                <input
                    type="text"
                    placeholder="Tìm kiếm tài liệu..."
                    value={search}
                    onChange={(event) => {
                        setSearch(
                            event.target.value
                        );

                        setCurrentPage(1);
                    }}
                />
            </div>

            <div className="document-table">
                <table>
                    <thead>
                        <tr>
                            <th>Tên tài liệu</th>
                            <th>Loại</th>
                            <th>Người tải</th>
                            <th>Ngày tải</th>
                            <th>Phiên bản</th>
                            <th>Dung lượng</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="empty-document"
                                >
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : paginatedDocuments.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="empty-document"
                                >
                                    Chưa có tài liệu nào
                                </td>
                            </tr>
                        ) : (
                            paginatedDocuments.map(
                                (document) => (
                                    <tr
                                        key={document.id}
                                    >
                                        <td>
                                            {
                                                document.file_name
                                            }
                                        </td>

                                        <td>
                                            <span className="file-type">
                                                {document.file_type ||
                                                    getFileType(
                                                        document.file_name
                                                    )}
                                            </span>
                                        </td>

                                        <td>
                                            {document.uploaded_by ||
                                                "Không rõ"}
                                        </td>

                                        <td>
                                            {formatDate(
                                                document.created_at
                                            )}
                                        </td>

                                        <td>
                                            {document.version ||
                                                "v1.0"}
                                        </td>

                                        <td>
                                            {formatSize(
                                                document.file_size
                                            )}
                                        </td>

                                        <td>
                                            <div className="document-actions">
                                                <a
                                                    href={`${API_URL}/${document.file_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    download={
                                                        document.file_name
                                                    }
                                                >
                                                    Tải
                                                </a>

                                                {canManageDocuments && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                document.id
                                                            )
                                                        }
                                                    >
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </div>

            <div className="document-pagination">
                <span>
                    Hiển thị{" "}
                    {paginatedDocuments.length} /{" "}
                    {filteredDocuments.length} tài liệu
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
        </div>
    );
}

export default Document;