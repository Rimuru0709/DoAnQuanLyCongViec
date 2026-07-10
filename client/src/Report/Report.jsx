import { useEffect, useMemo, useState } from "react";
import { FaChartLine, FaFileAlt, FaFolderOpen, FaDownload } from "react-icons/fa";import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Sidebar from "../Sidebar/Sidebar";
import "./Report.css";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

function Report() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 1. Lấy trực tiếp dữ liệu báo cáo từ API Dashboard tổng hợp
    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const res = await fetch("http://localhost:5000/api/reports/dashboard", { 
                    headers: getAuthHeaders() 
                });

                if (!res.ok) throw new Error("Không thể tải dữ liệu báo cáo tổng hợp");

                const data = await res.json();
                setReportData(data);
                setError("");
            } catch (err) {
                console.error(err);
                setError("Không thể kết nối dữ liệu hệ thống. Vui lòng kiểm tra lại server.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    // 2. Format dữ liệu biểu đồ từ API (Dung lượng lưu trữ của từng dự án)
    const chartData = useMemo(() => {
        if (!reportData || !reportData.projects) return [];
        return reportData.projects.map(proj => ({
            name: proj.name.length > 15 ? `${proj.name.substring(0, 12)}...` : proj.name,
            files: proj.fileCount,
            // Sử dụng dữ liệu thô (Bytes) chia cho 1024 * 1024 để hiển thị dạng MB trên biểu đồ
            storage: parseFloat((proj.rawTotalSizeBytes || 0) / (1024 * 1024)).toFixed(2)
        }));
    }, [reportData]);

    const exportToExcel = () => {
        if (!reportData || reportData.projects.length === 0) {
            alert("Không có dữ liệu phù hợp để xuất file!");
            return;
        }
        const rows = [
            ["Mã dự án", "Tên dự án", "Số lượng tài liệu", "Dung lượng lưu trữ"],
            ...reportData.projects.map((p) => [p.id, p.name, p.fileCount, p.storageUsed])
        ];
        const csvContent = "\uFEFF" + rows.map((row) => row.map(val => `"${val}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `bao-cao-he-thong-luu-tru-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="app">
            <Sidebar />
            <main className="main">
                <header className="topbar">
                    <h1>Báo cáo tài liệu & Hệ thống</h1>
                </header>

                <div className="page-content report-page">
                    <section className="report-hero">
                        <div>
                            <p className="eyebrow">Hệ thống quản trị tài liệu</p>
                            <h2>Giám sát dung lượng và dữ liệu lưu trữ vật lý</h2>
                            <p>Phân tích phân phối file, kiểm soát tài nguyên lưu trữ của toàn doanh nghiệp.</p>
                        </div>
                        <div className="hero-actions">
                            <button className="btn-primary" onClick={() => window.print()}>In / Xuất PDF</button>
                            <button className="btn-secondary" onClick={exportToExcel}>
                                <FaDownload style={{ marginRight: 6 }} /> Xuất dữ liệu kho lưu trữ (CSV)
                            </button>
                        </div>
                    </section>

                    {error && <div className="status-banner error-banner">{error}</div>}

                    {/* Khối Card Tổng Quan */}
                    <section className="summary-grid">
                        <div className="summary-card">
                            <div className="summary-icon"><FaFolderOpen /></div>
                            <div className="summary-content">
                                <h3>{loading ? "..." : reportData?.summary?.totalProjects || 0}</h3>
                                <p>Tổng số dự án</p>
                                <span className="sub-text">Đang phân vùng lưu trữ</span>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><FaFileAlt /></div>
                            <div className="summary-content">
                                <h3>{loading ? "..." : reportData?.summary?.totalFiles || 0}</h3>
                                <p>Tổng số tài liệu</p>
                                <span className="sub-text">Đã đồng bộ MySQL</span>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><FaChartLine /></div>
                            <div className="summary-content">
                                <h3>{loading ? "..." : reportData?.summary?.formattedTotalSize || "0 Bytes"}</h3>
                                <p>Dung lượng đã dùng</p>
                                <span className="sub-text">Tính theo ổ đĩa server</span>
                            </div>
                        </div>
                    </section>

                    {/* Biểu đồ Recharts */}
                    <section className="report-grid">
                        <div className="card">
                            <div className="card-header">
                                <h3>Biểu đồ không gian lưu trữ theo Dự án</h3>
                                <span>Tính toán theo đơn vị Megabytes (MB)</span>
                            </div>
                            {loading ? (
                                <div className="empty-state">Đang nạp biểu đồ...</div>
                            ) : chartData.length > 0 ? (
                                <div className="chart-card" style={{ width: "100%", height: 240, marginTop: 15 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6c757d' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} />
                                            <Tooltip formatter={(value) => [`${value} MB`, 'Không gian chiếm dụng']} />
                                            <Bar dataKey="storage" fill="#e67e22" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="empty-state">Không có dữ liệu lập biểu đồ.</div>
                            )}
                        </div>
                    </section>

                    {/* Bảng dữ liệu thô */}
                    <section className="card">
                        <div className="card-header">
                            <h3>Phân bổ tài nguyên chi tiết</h3>
                        </div>
                        <div className="table-responsive">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Tên dự án điều hành</th>
                                        <th>Số lượng File</th>
                                        <th>Tổng dung lượng đã chiếm dùng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="3" className="empty-state">Hệ thống đang đồng bộ...</td>
                                        </tr>
                                    ) : reportData?.projects?.length > 0 ? (
                                        reportData.projects.map((row) => (
                                            <tr key={row.id}>
                                                <td><strong>{row.name}</strong></td>
                                                <td>{row.fileCount} tài liệu</td>
                                                <td>{row.storageUsed}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="empty-state">Hệ thống trống.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Report;