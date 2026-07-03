import { useEffect, useRef, useState } from "react";
import "./Document.css";

function Document({ projectId }) {
    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");
    const [file, setFile] = useState(null);
    const [uploadedBy, setUploadedBy] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const fileInputRef = useRef(null);

    const itemsPerPage = 5;
    const API_URL = "http://localhost:5000";

    const loadDocuments = async () => {
        try {
            const res = await fetch(`${API_URL}/api/documents/${projectId}`);
            const data = await res.json();
            setDocuments(data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [projectId]);

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const formatSize = (bytes) => {
        if (!bytes) return "0 KB";

        if (bytes < 1024 * 1024) {
            return `${Math.round(bytes / 1024)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileType = (name) => {
        if (!name) return "FILE";
        const ext = name.split(".").pop().toUpperCase();
        return ext || "FILE";
    };

    const canPreview = (name) => {
        if (!name) return false;
        const ext = name.split(".").pop().toLowerCase();
        return ["pdf", "png", "jpg", "jpeg", "webp", "gif"].includes(ext);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            alert("Vui lòng chọn tài liệu");
            return;
        }

        const formData = new FormData();
        formData.append("document", file);
        formData.append("project_id", projectId);
        formData.append("uploaded_by", uploadedBy || "Duy");

        try {
            const res = await fetch(`${API_URL}/api/documents`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                alert("Tải tài liệu thất bại");
                return;
            }

            setFile(null);
            setUploadedBy("");
            setCurrentPage(1);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            loadDocuments();
        } catch (err) {
            console.log(err);
        }
    };

    const handleDelete = async (id) => {

        try {
            const res = await fetch(`${API_URL}/api/documents/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                alert("Xóa tài liệu thất bại");
                return;
            }

            loadDocuments();
        } catch (err) {
            console.log(err);
        }
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.file_name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

    const paginatedDocuments = filteredDocuments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="document-page">
            <div className="document-header">
                <div>
                    <h2>Tài liệu dự án</h2>
                    <p>Quản lý tài liệu, file đính kèm và phiên bản của dự án.</p>
                </div>
            </div>

            <form className="document-upload" onSubmit={handleUpload}>
                <div>
                    <label>Chọn tài liệu</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                </div>

                <div>
                    <label>Người tải</label>
                    <input
                        type="text"
                        value={uploadedBy}
                        onChange={(e) => setUploadedBy(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                    />
                </div>

                <button type="submit">Tải tài liệu lên</button>
            </form>

            <div className="document-toolbar">
                <input
                    type="text"
                    placeholder="Tìm kiếm tài liệu..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
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
                        {paginatedDocuments.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-document">
                                    Chưa có tài liệu nào
                                </td>
                            </tr>
                        ) : (
                            paginatedDocuments.map((doc) => (
                                <tr key={doc.id}>
                                    <td>{doc.file_name}</td>

                                    <td>
                                        <span className="file-type">
                                            {doc.file_type || getFileType(doc.file_name)}
                                        </span>
                                    </td>

                                    <td>{doc.uploaded_by || "Không rõ"}</td>
                                    <td>{formatDate(doc.created_at)}</td>
                                    <td>{doc.version || "v1.0"}</td>
                                    <td>{formatSize(doc.file_size)}</td>

                                    <td>
                                        <div className="document-actions">
                                            {canPreview(doc.file_name) && (
                                                <a
                                                    href={`${API_URL}/${doc.file_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Xem
                                                </a>
                                            )}

                                            <a href={`${API_URL}/${doc.file_path}`} download>
                                                Tải
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(doc.id)}
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

            <div className="document-pagination">
                <span>
                    Hiển thị {paginatedDocuments.length} / {filteredDocuments.length} tài liệu
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
        </div>
    );
}

export default Document;