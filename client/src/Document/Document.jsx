import { useState, useEffect, useCallback } from "react";
import "./Document.css";
import Sidebar from "../Sidebar/Sidebar";
import { 
    FaFileWord, FaFilePdf, FaFileExcel, FaFileImage, FaFileAlt,
    FaDownload, FaTrash, FaUpload, FaSearch, FaPlus, FaTimes 
} from "react-icons/fa";
import { toast } from "react-toastify";

function Document() {
    const [documents, setDocuments] = useState([]);
    const [projects, setProjects] = useState([]); 
    const [selectedProject, setSelectedProject] = useState(""); 
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [totalStorageUsed, setTotalStorageUsed] = useState(0); 

    const maxStorage = 100; // 100 MB
    const storagePercentage = maxStorage > 0 ? (totalStorageUsed / maxStorage) * 100 : 0;

    const API_BASE_URL = "http://localhost:5000/api/documents";
    const PROJECTS_API_URL = "http://localhost:5000/api/projects"; 

    // Giữ nguyên tham chiếu hàm lấy token
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const getStoredUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user")) || null;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    // Hàm lấy thông số dung lượng độc lập
    const fetchStorageStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/storage/stats`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                const sizeInMB = data.usedSize ? data.usedSize / (1024 * 1024) : 0;
                setTotalStorageUsed(sizeInMB);
            }
        } catch (error) {
            console.error("Lỗi lấy stats bộ nhớ:", error);
        }
    }, [getAuthHeaders]);

    // Hàm cập nhật danh sách tài liệu
    const refreshDocumentsList = useCallback(async () => {
        if (!selectedProject) return; 
        try {
            const res = await fetch(`${API_BASE_URL}/${selectedProject}`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                const normalizedData = (Array.isArray(data) ? data : []).map(doc => ({
                    id: doc.id,
                    name: doc.file_name || "Tên tệp không xác định",
                    size: doc.file_size ? doc.file_size / (1024 * 1024) : 0, 
                    type: doc.file_type || "",
                    uploader: doc.uploaded_by || "Thành viên",
                    url: doc.file_path || "",
                    createdAt: doc.created_at
                }));
                setDocuments(normalizedData);
            }
        } catch (error) {
            console.error("Lỗi làm mới danh sách:", error);
        }
    }, [selectedProject, getAuthHeaders]); 

    // Tự động tải lại dữ liệu khi người dùng chuyển đổi dự án
    useEffect(() => {
        const handleProjectChange = async () => {
            if (selectedProject) {
                await refreshDocumentsList();
                await fetchStorageStats();
            } else {
                setDocuments([]); 
            }
        };

        handleProjectChange(); 
    }, [selectedProject, refreshDocumentsList, fetchStorageStats]);

    // Khởi tạo danh sách dự án khi vào trang lần đầu
    useEffect(() => {
        let isMounted = true;

        const initProjects = async () => {
            try {
                const resProj = await fetch(PROJECTS_API_URL, { headers: getAuthHeaders() });
                if (resProj.ok) {
                    const dataProj = await resProj.json();
                    if (isMounted) setProjects(Array.isArray(dataProj) ? dataProj : []);
                }
                if (isMounted) {
                    await fetchStorageStats();
                }
            } catch (error) {
                console.error(error);
                if (isMounted) toast.error("Không thể kết nối dữ liệu từ server!");
            }
        };

        initProjects();
        return () => { isMounted = false; };
    }, [getAuthHeaders, fetchStorageStats]); 

    const getFileIcon = (type) => {
        if (!type) return <FaFileAlt className="icon-doc info" />;
        const cleanType = type.toLowerCase();
        if (cleanType.includes("pdf")) return <FaFilePdf className="icon-doc pdf" />;
        if (cleanType.includes("doc") || cleanType.includes("word")) return <FaFileWord className="icon-doc word" />;
        if (cleanType.includes("xls") || cleanType.includes("excel") || cleanType.includes("csv")) return <FaFileExcel className="icon-doc excel" />;
        if (cleanType.match(/(jpg|jpeg|png|gif|webp|svg)/)) return <FaFileImage className="icon-doc image" />;
        return <FaFileAlt className="icon-doc info" />;
    };

    const handleUploadFile = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Vui lòng chọn một tệp tin trước!");
            return;
        }
        if (!selectedProject) {
            toast.error("Vui lòng lựa chọn dự án đích để lưu tài liệu!");
            return;
        }

        const fileSizeMB = selectedFile.size / (1024 * 1024);
        if (totalStorageUsed + fileSizeMB > maxStorage) {
            toast.error(`Vượt quá dung lượng giới hạn! File này chiếm ${fileSizeMB.toFixed(2)} MB.`);
            return;
        }

        const loggedInUser = getStoredUser();
        const uploaderName = loggedInUser ? (loggedInUser.full_name || loggedInUser.name) : "Thành viên nhóm";

        const formData = new FormData();
        formData.append("document", selectedFile);
        formData.append("uploader", uploaderName);
        formData.append("project_id", selectedProject); 

        try {
            const res = await fetch(API_BASE_URL, {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData
            });

            if (res.ok) {
                toast.success("Tải lên tệp tin thành công!");
                await refreshDocumentsList(); 
                await fetchStorageStats(); // SỬA TẠI ĐÂY: Cập nhật lại thanh dung lượng tổng sau khi upload thành công
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

    const handleDeleteDocument = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu: ${name}?`)) {
            try {
                const res = await fetch(`${API_BASE_URL}/${id}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    toast.success("Đã xóa tài liệu!");
                    await refreshDocumentsList();
                    await fetchStorageStats(); // SỬA TẠI ĐÂY: Cập nhật lại thanh dung lượng tổng sau khi xóa thành công
                } else {
                    toast.error("Xóa tài liệu thất bại.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Không thể xóa file!");
            }
        }
    };

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
                    
                    {/* Bọc cụm này lại để CSS căn chỉnh sang bên phải */}
                    <div className="topbar-controls">
                        <div className="project-selector-top">
                            <select 
                                value={selectedProject} 
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="">-- Chọn dự án xem tài liệu --</option>
                                {projects.map(proj => (
                                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="search-box">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tài liệu theo tên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={!selectedProject}
                            />
                        </div>
                    </div>
                </header>

                <div className="page-content document-page">
                    <div className="document-stats">
                        <div className="storage-card">
                            <div className="storage-info">
                                <h3>Dung lượng bộ nhớ toàn hệ thống</h3>
                                <span>{totalStorageUsed.toFixed(2)} MB / {maxStorage} MB</span>
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
                            {!selectedProject ? (
                                <div className="empty-document">Vui lòng chọn một dự án ở thanh trên để xem tài liệu.</div>
                            ) : filteredDocs.length === 0 ? (
                                <div className="empty-document">Không tìm thấy tài liệu nào trong dự án này.</div>
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
                                            <tr key={doc.id}>
                                                <td className="file-name-cell">
                                                    {getFileIcon(doc.type)}
                                                    <span className="file-text-name" title={doc.name}>{doc.name}</span>
                                                </td>
                                                <td>{doc.size.toFixed(2)} MB</td>
                                                <td>{doc.uploader}</td>
                                                <td>{new Date(doc.createdAt).toLocaleDateString("vi-VN")}</td>
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
                                                    <button className="action-btn delete" title="Xóa tài liệu" onClick={() => handleDeleteDocument(doc.id, doc.name)}>
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
                            <div className="form-group-doc" style={{ marginBottom: "15px" }}>
                                <label style={{ fontWeight: "600", marginBottom: "6px", display: "block" }}>Thuộc dự án (*):</label>
                                <select 
                                    value={selectedProject} 
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", backgroundColor: "#1e293b", color: "#fff", border: "1px solid #334155" }}
                                >
                                    <option value="">-- Chọn dự án tải lên --</option>
                                    {projects.map(proj => (
                                        <option key={proj.id} value={proj.id}>{proj.name}</option>
                                    ))}
                                </select>
                            </div>

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
                                <button type="submit" className="btn-submit" disabled={!selectedFile || !selectedProject}>Xác nhận tải lên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Document;