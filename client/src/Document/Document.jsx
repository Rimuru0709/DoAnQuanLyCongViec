import { useState, useEffect, useCallback, useRef } from "react";
import "./Document.css";
import Sidebar from "../Sidebar/Sidebar";
import { 
    FaFileWord, FaFilePdf, FaFileExcel, FaFileImage, FaFileAlt,
    FaDownload, FaTrash, FaUpload, FaSearch, FaPlus, FaTimes, FaChevronDown 
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

    // State phục vụ việc tìm kiếm dự án (Searchable Select)
    const [projectSearchInput, setProjectSearchInput] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // State phục vụ hộp thoại xác nhận xóa tự chế (Custom Confirm Modal)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        docId: null,
        docName: ""
    });

    const maxStorage = 100; // 100 MB
    const storagePercentage = maxStorage > 0 ? (totalStorageUsed / maxStorage) * 100 : 0;

    const API_BASE_URL = "http://localhost:5000/api/documents";
    const PROJECTS_API_URL = "http://localhost:5000/api/projects"; 

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

    // Đóng dropdown tìm kiếm dự án khi click ra ngoài vùng hiển thị
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                await fetchStorageStats(); 
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

    // Hàm kích hoạt mở Custom Confirm Modal xác nhận xóa
    const triggerDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            docId: id,
            docName: name
        });
    };

    // Hàm thực thi hành động xóa khi người dùng click xác nhận trong Custom Modal
    const handleConfirmDelete = async () => {
        const { docId } = confirmModal;
        try {
            const res = await fetch(`${API_BASE_URL}/${docId}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                toast.success("Đã xóa tài liệu!");
                await refreshDocumentsList();
                await fetchStorageStats(); 
            } else {
                toast.error("Xóa tài liệu thất bại.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Không thể xóa file!");
        } finally {
            // Đóng modal xác nhận xóa
            setConfirmModal({ isOpen: false, docId: null, docName: "" });
        }
    };

    const filteredProjects = projects.filter(proj => 
        proj.name.toLowerCase().includes(projectSearchInput.toLowerCase())
    );

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

    const currentProjectName = projects.find(p => p.id === selectedProject)?.name || "";

    const handleDownloadFile = (doc) => {
        if (!doc || !doc.url) {
            toast.error("Đường dẫn file không hợp lệ hoặc không tồn tại!");
            return;
        }

    const cleanUrl = doc.url.startsWith("http") 
        ? doc.url 
        : `http://localhost:5000/${doc.url.replace(/^\//, "")}`;

    const link = document.createElement("a");
    link.href = cleanUrl;
    link.setAttribute("download", doc.name || "download");
    
    link.rel = "noopener noreferrer";
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    };

    return (
        <div className="app">
            <Sidebar />
            <main className="main">
                <header className="topbar">
                    <h1>Tài liệu hệ thống</h1>
                    
                    <div className="topbar-controls">
                        {/* CUSTOM SEARCHABLE SELECT DỰ ÁN */}
                        <div className="project-searchable-select" ref={dropdownRef}>
                            <div className="searchable-input-wrapper" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <input 
                                    type="text"
                                    placeholder="Nhập & tìm tên dự án..."
                                    value={isDropdownOpen ? projectSearchInput : (currentProjectName || projectSearchInput)}
                                    onChange={(e) => {
                                        setProjectSearchInput(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                />
                                <FaChevronDown className={`arrow-icon ${isDropdownOpen ? "open" : ""}`} />
                            </div>

                            {isDropdownOpen && (
                                <ul className="searchable-dropdown-list">
                                    <li onClick={() => {
                                        setSelectedProject("");
                                        setProjectSearchInput("");
                                        setIsDropdownOpen(false);
                                    }}>
                                        -- Bỏ chọn dự án --
                                    </li>
                                    {filteredProjects.length > 0 ? (
                                        filteredProjects.map(proj => (
                                            <li 
                                                key={proj.id} 
                                                className={selectedProject === proj.id ? "selected" : ""}
                                                onClick={() => {
                                                    setSelectedProject(proj.id);
                                                    setProjectSearchInput(proj.name);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {proj.name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="no-result">Không tìm thấy dự án phù hợp</li>
                                    )}
                                </ul>
                            )}
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

                        <button className="upload-btn" onClick={() => {
                            setProjectSearchInput(currentProjectName);
                            setIsModalOpen(true);
                        }}>
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
                                <div className="empty-document">Vui lòng nhập và chọn một dự án ở thanh trên để xem tài liệu.</div>
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
                                                    <button 
                                                        type="button"
                                                        className="action-btn download" 
                                                        title="Tải xuống"
                                                        onClick={() => handleDownloadFile(doc)} // Gọi hàm tải file an toàn tại đây
                                                    >
                                                        <FaDownload />
                                                    </button>
                                                    <button 
                                                        className="action-btn delete" 
                                                        title="Xóa tài liệu" 
                                                        onClick={() => triggerDeleteConfirm(doc.id, doc.name)}
                                                    >
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

            {/* MODAL UPLOAD TÀI LIỆU */}
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
                                <div style={{ 
                                    padding: "10px", 
                                    borderRadius: "6px", 
                                    backgroundColor: "#1e293b", 
                                    color: "#fff", 
                                    border: "1px solid #334155",
                                    fontSize: "14px"
                                }}>
                                    {currentProjectName || <span style={{color: '#dc3545'}}>Chưa chọn dự án ở thanh công cụ ngoài!</span>}
                                </div>
                                <small style={{color: '#94a3b8', marginTop: '4px', display: 'block'}}>
                                    * Mẹo: Để đổi dự án khác, vui lòng thay đổi ở thanh công cụ phía ngoài màn hình chính.
                                </small>
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

            {/* CUSTOM CONFIRM MODAL XÁC NHẬN XÓA TỰ CHẾ */}
            {confirmModal.isOpen && (
                <div className="modal-overlay delete-confirm-overlay">
                    <div className="confirm-modal-content">
                        <div className="confirm-modal-icon">
                            <FaTrash />
                        </div>
                        <h3>Xác nhận xóa tài liệu</h3>
                        <p>
                            Bạn có chắc chắn muốn xóa tài liệu này? <br />
                            <strong className="confirm-doc-name" title={confirmModal.docName}>
                                {confirmModal.docName}
                            </strong>
                        </p>
                        <div className="confirm-modal-actions">
                            <button 
                                type="button" 
                                className="btn-confirm-cancel" 
                                onClick={() => setConfirmModal({ isOpen: false, docId: null, docName: "" })}
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                type="button" 
                                className="btn-confirm-danger" 
                                onClick={handleConfirmDelete}
                            >
                                Đồng ý xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Document;