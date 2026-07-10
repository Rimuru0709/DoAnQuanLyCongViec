import { useState, useEffect } from "react";
import "./Document.css";
import Sidebar from "../Sidebar/Sidebar";
import { 
    FaFileWord, FaFilePdf, FaFileExcel, FaFileImage, FaFileAlt,
    FaDownload, FaTrash, FaUpload, FaSearch, FaPlus, FaTimes 
} from "react-icons/fa";
import { toast } from "react-toastify";

function Document() {
    const [documents, setDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const maxStorage = 100; // 100 MB
    const currentUsedStorage = documents.reduce((sum, doc) => sum + (parseFloat(doc.size) || 0), 0);
    const storagePercentage = maxStorage > 0 ? (currentUsedStorage / maxStorage) * 100 : 0;

    const API_URL = "http://localhost:5000/api/documents";

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const getStoredUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user")) || null;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    // Hàm phụ trợ tải nhanh dữ liệu để tái sử dụng trong các nút bấm hành động
    const refreshDocumentsList = async () => {
        try {
            const res = await fetch(API_URL, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setDocuments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Lỗi làm mới danh sách:", error);
        }
    };

    // 1. Dùng useEffect chuẩn hóa
    useEffect(() => {
        let isMounted = true;

        const loadDocumentsOnMount = async () => {
            try {
                const res = await fetch(API_URL, { headers: getAuthHeaders() });
                if (!res.ok) throw new Error("Failed to fetch documents");
                const data = await res.json();
                
                if (isMounted) {
                    setDocuments(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error(error);
                if (isMounted) {
                    toast.error("Không thể kết nối danh sách tài liệu từ server!");
                }
            }
        };

        loadDocumentsOnMount();

        return () => {
            isMounted = false; // Hủy tác vụ ngầm khi chuyển trang
        };
    }, []); 

    // Tự động nhận diện định dạng đuôi file thực tế từ ổ đĩa
    const getFileIcon = (type) => {
        if (!type) return <FaFileAlt className="icon-doc info" />;
        const cleanType = type.toLowerCase();
        
        if (cleanType.includes("pdf")) return <FaFilePdf className="icon-doc pdf" />;
        if (cleanType.includes("doc") || cleanType.includes("word")) return <FaFileWord className="icon-doc word" />;
        if (cleanType.includes("xls") || cleanType.includes("excel") || cleanType.includes("csv")) return <FaFileExcel className="icon-doc excel" />;
        if (cleanType.match(/(jpg|jpeg|png|gif|webp|svg)/)) return <FaFileImage className="icon-doc image" />;
        
        return <FaFileAlt className="icon-doc info" />;
    };

    // 2. Hàm gọi API Upload file thật lên Backend
    const handleUploadFile = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Vui lòng chọn một tệp tin trước!");
            return;
        }

        const loggedInUser = getStoredUser();
        const uploaderName = loggedInUser ? (loggedInUser.full_name || loggedInUser.name) : "Thành viên nhóm";

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("uploader", uploaderName);

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData
            });

            if (res.ok) {
                toast.success("Tải lên tệp tin thành công!");
                await refreshDocumentsList(); // Làm mới danh sách ngay lập tức
                setIsModalOpen(false);
                setSelectedFile(null);
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.message || "Upload thất bại!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi kết nối server!");
        }
    };

    // 3. Hàm gọi API Xóa file
    const handleDeleteDocument = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu: ${name}?`)) {
            try {
                const res = await fetch(`${API_URL}/${id}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    toast.success("Đã xóa tài liệu!");
                    await refreshDocumentsList(); // Làm mới danh sách ngay lập tức
                } else {
                    toast.error("Xóa tài liệu thất bại.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Không thể xóa file!");
            }
        }
    };

    // Bộ lọc thông minh phân nhóm tài liệu
    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.name ? doc.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        if (!matchesSearch) return false;

        if (filterType === "all") return true;
        const ext = doc.type ? doc.type.toLowerCase() : "";
        
        switch (filterType) {
            case "pdf": return ext.includes("pdf");
            case "word": return ext.includes("doc") || ext.includes("word");
            case "excel": return ext.includes("xls") || ext.includes("excel") || ext.includes("csv");
            case "image": return ext.match(/(jpg|jpeg|png|gif|webp|svg)/);
            default: return false;
        }
    });

    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <header className="topbar">
                    <h1>Tài liệu hệ thống</h1>
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu theo tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                <div className="page-content document-page">
                    <div className="document-stats">
                        <div className="storage-card">
                            <div className="storage-info">
                                <h3>Dung lượng bộ nhớ đã dùng</h3>
                                <span>{currentUsedStorage.toFixed(2)} MB / {maxStorage} MB</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${Math.min(storagePercentage, 100)}%` }}></div>
                            </div>
                        </div>

                        <button className="upload-btn" onClick={() => setIsModalOpen(true)}>
                            <FaPlus /> Tải lên tài liệu mới
                        </button>
                    </div>

                    <div className="filter-tabs">
                        <button className={`tab-btn ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>Tất cả</button>
                        <button className={`tab-btn ${filterType === "pdf" ? "active" : ""}`} onClick={() => setFilterType("pdf")}>PDF</button>
                        <button className={`tab-btn ${filterType === "word" ? "active" : ""}`} onClick={() => setFilterType("word")}>Word</button>
                        <button className={`tab-btn ${filterType === "excel" ? "active" : ""}`} onClick={() => setFilterType("excel")}>Excel</button>
                        <button className={`tab-btn ${filterType === "image" ? "active" : ""}`} onClick={() => setFilterType("image")}>Hình ảnh</button>
                    </div>

                    <div className="card document-card">
                        <div className="card-header">
                            <h3>Danh sách tệp tin ({filteredDocs.length})</h3>
                        </div>
                        
                        <div className="table-responsive">
                            {filteredDocs.length === 0 ? (
                                <div className="empty-document">Không tìm thấy tài liệu nào.</div>
                            ) : (
                                <table className="document-table">
                                    <thead>
                                        <tr>
                                            <th>Tên tài liệu</th>
                                            <th>Dung lượng</th>
                                            <th>Người tải lên</th>
                                            <th>Ngày cập nhật</th>
                                            <th style={{ textAlign: "center" }}>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDocs.map((doc) => (
                                            <tr key={doc.id || doc._id}>
                                                <td className="file-name-cell">
                                                    {getFileIcon(doc.type)}
                                                    <span className="file-text-name" title={doc.name}>{doc.name}</span>
                                                </td>
                                                <td>{parseFloat(doc.size || 0).toFixed(2)} MB</td>
                                                <td>{doc.uploader || "Ẩn danh"}</td>
                                                <td>{doc.date || new Date(doc.createdAt || doc.created_at).toLocaleDateString("vi-VN")}</td>
                                                <td className="actions-cell">
                                                    <a 
                                                        href={doc.url?.startsWith("http") ? doc.url : `http://localhost:5000${doc.url}`} 
                                                        download={doc.name}
                                                        className="action-btn download" 
                                                        title="Tải xuống"
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                    >
                                                        <FaDownload />
                                                    </a>
                                                    <button className="action-btn delete" title="Xóa tài liệu" onClick={() => handleDeleteDocument(doc.id || doc._id, doc.name)}>
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL POPUP */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Tải lên tệp tin mới</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleUploadFile}>
                            <div className="form-group-doc">
                                <label style={{ cursor: 'pointer', display: 'block' }}>
                                    <div className="upload-dropzone">
                                        <FaUpload size={24} style={{ marginBottom: 8, color: '#0d6efd' }} />
                                        <p>{selectedFile ? `Đã chọn: ${selectedFile.name}` : "Click để chọn tệp từ thiết bị"}</p>
                                        <span style={{ fontSize: 12, color: '#5c728d' }}>Chấp nhận .pdf, .docx, .xlsx, .png, .jpg</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        style={{ display: "none" }}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn-submit" disabled={!selectedFile}>Xác nhận tải lên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Document;