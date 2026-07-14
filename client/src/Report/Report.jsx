import { useEffect, useMemo, useState } from "react";
import { FaChartLine, FaFileAlt, FaFolderOpen, FaDownload, FaTasks, FaFilter, FaSearch } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import Sidebar from "../Sidebar/Sidebar";
import "./Report.css";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Màu sắc trực quan cho biểu đồ trạng thái Task
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function Report() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // 1. STATE BỘ LỌC MỚI
    const [projectNameInput, setProjectNameInput] = useState(""); // Ô nhập tên dự án thực tế
    const [debouncedProjectName, setDebouncedProjectName] = useState(""); // Giá trị tên dự án sau khi delay
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Mặc định tháng hiện tại
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Mặc định năm hiện tại

    // Danh sách năm cho bộ lọc (Ví dụ lấy từ 2020 đến năm hiện tại + 1)
    const currentYear = new Date().getFullYear();
    const yearsList = useMemo(() => {
        const years = [];
        for (let y = currentYear + 1; y >= 2020; y--) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    // 2. CƠ CHẾ DEBOUNCE: Đợi người dùng gõ xong 500ms mới kích hoạt gọi API
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedProjectName(projectNameInput);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [projectNameInput]);

    // 3. GỌI API KHI THAY ĐỔI BỘ LỌC
    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                // Gửi tên dự án, tháng, năm lên Backend xử lý query
                const queryParams = new URLSearchParams({
                    projectName: debouncedProjectName,
                    month: selectedMonth,
                    year: selectedYear
                });

                const res = await fetch(`http://localhost:5000/api/reports/dashboard?${queryParams.toString()}`, { 
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
    }, [debouncedProjectName, selectedMonth, selectedYear]); 

    // 4. Format dữ liệu Biểu đồ cột (Dung lượng)
    const chartData = useMemo(() => {
        if (!reportData || !reportData.projects) return [];
        return reportData.projects.map(proj => ({
            name: proj.name.length > 15 ? `${proj.name.substring(0, 12)}...` : proj.name,
            files: proj.fileCount,
            storage: parseFloat((proj.rawTotalSizeBytes || 0) / (1024 * 1024)).toFixed(2)
        }));
    }, [reportData]);

    // 5. Format dữ liệu Biểu đồ tròn (Trạng thái Task)
    const taskStatusData = useMemo(() => {
        if (!reportData || !reportData.taskSummary) {
            return [
                { name: "Cần làm", value: 40 },
                { name: "Đang tiến hành", value: 30 },
                { name: "Hoàn thành", value: 20 },
                { name: "Trễ hạn", value: 10 }
            ];
        }
        return [
            { name: "Cần làm", value: reportData.taskSummary.todo || 0 },
            { name: "Đang tiến hành", value: reportData.taskSummary.inProgress || 0 },
            { name: "Hoàn thành", value: reportData.taskSummary.done || 0 },
            { name: "Trễ hạn", value: reportData.taskSummary.overdue || 0 }
        ];
    }, [reportData]);

    const exportToExcel = () => {
        if (!reportData || !reportData.projects || reportData.projects.length === 0) {
            alert("Không có dữ liệu phù hợp để xuất file!");
            return;
        }
        const rows = [
            ["Mã dự án", "Tên dự án", "Số lượng tài liệu", "Dung lượng lưu trữ (MB)"],
            ...reportData.projects.map((p) => [
                p.id, 
                p.name, 
                p.fileCount, 
                parseFloat((p.rawTotalSizeBytes || 0) / (1024 * 1024)).toFixed(2)
            ])
        ];
        const csvContent = "\uFEFF" + rows.map((row) => row.map(val => `"${val}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `bao-cao-tien-do-${selectedMonth}-${selectedYear}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="app">
            <Sidebar />
            <main className="main">
                <header className="topbar">
                    <h1>Báo cáo Tiến độ & Tài nguyên Hệ thống</h1>
                </header>

                <div className="page-content report-page">
                    
                    {/* BẢNG ĐIỀU KHIỂN BỘ LỌC ĐÃ ĐƯỢC CẬP NHẬT */}
                    <section className="filter-bar">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FaFilter style={{ color: "#64748b" }} />
                            <strong>Bộ lọc báo cáo:</strong>
                        </div>
                        
                        {/* 1. Ô nhập tìm kiếm dự án bằng tay */}
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <FaSearch style={{ position: "absolute", left: 12, color: "#64748b", fontSize: 13 }} />
                            <input 
                                type="text"
                                placeholder="Nhập tên dự án..."
                                value={projectNameInput}
                                onChange={(e) => setProjectNameInput(e.target.value)}
                                style={{
                                    padding: "8px 12px 8px 34px",
                                    borderRadius: "6px",
                                    border: "1px solid #14213d",
                                    backgroundColor: "#0b1329",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    outline: "none",
                                    width: "210px",
                                    transition: "all 0.2s"
                                }}
                                className="project-search-input"
                            />
                        </div>

                        {/* 2. Chọn Tháng */}
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            <option value="">Chọn tất cả tháng</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>Tháng {m}</option>
                            ))}
                        </select>

                        {/* 3. Chọn Năm */}
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            <option value="">Chọn tất cả năm</option>
                            {yearsList.map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                    </section>

                    <section className="report-hero">
                        <div>
                            <p className="eyebrow">Hệ thống quản trị điều hành</p>
                            <h2>Phân tích hiệu suất dự án & Không gian lưu trữ</h2>
                            <p>Giám sát tổng thể trạng thái xử lý công việc và phân bổ tài nguyên ổ đĩa vật lý.</p>
                        </div>
                        <div className="hero-actions">
                            <button className="btn-primary" onClick={() => window.print()}>In / Xuất PDF</button>
                            <button className="btn-secondary" onClick={exportToExcel}>
                                <FaDownload style={{ marginRight: 6 }} /> Xuất tổng hợp (CSV)
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
                                <span className="sub-text">Đang vận hành</span>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><FaTasks style={{ color: "#2ecc71" }} /></div>
                            <div className="summary-content">
                                <h3>{loading ? "..." : reportData?.summary?.totalTasks || 0}</h3>
                                <p>Tổng số công việc</p>
                                <span className="sub-text">Trên bảng Kanban</span>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><FaFileAlt /></div>
                            <div className="summary-content">
                                <h3>{loading ? "..." : reportData?.summary?.totalFiles || 0}</h3>
                                <p>Tổng số tài liệu</p>
                                <span className="sub-text">Đính kèm dự án</span>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><FaChartLine /></div>
                            <div className="summary-content">
                                <h3>{loading ? "..." : reportData?.summary?.formattedTotalSize || "0 Bytes"}</h3>
                                <p>Dung lượng đã dùng</p>
                                <span className="sub-text">Ổ đĩa cứng Server</span>
                            </div>
                        </div>
                    </section>

                    {/* Lưới 2 biểu đồ */}
                    <section className="report-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 20, marginBottom: 20 }}>
                        {/* Biểu đồ 1 */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Biểu đồ không gian lưu trữ theo Dự án</h3>
                                <span>Tính toán theo đơn vị Megabytes (MB)</span>
                            </div>
                            {loading ? (
                                <div className="empty-state">Đang nạp biểu đồ...</div>
                            ) : chartData.length > 0 ? (
                                <div className="chart-card" style={{ width: "100%", height: 260, marginTop: 15 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e294b" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#111a36', borderColor: '#1e294b', color: '#fff' }} />
                                            <Bar dataKey="storage" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="empty-state">Không có dữ liệu lập biểu đồ.</div>
                            )}
                        </div>

                        {/* Biểu đồ 2 */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Tỷ lệ Trạng thái Công việc (Tasks)</h3>
                                <span>Đo lường tiến độ vận hành nhân sự</span>
                            </div>
                            {loading ? (
                                <div className="empty-state">Đang nạp thống kê...</div>
                            ) : (
                                <div className="chart-card" style={{ width: "100%", height: 260, marginTop: 15 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={taskStatusData} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {taskStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} nhiệm vụ`, 'Số lượng']} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Bảng dữ liệu thô */}
                    <section className="card">
                        <div className="card-header">
                            <h3>Phân bổ tài nguyên chi tiết từng dự án</h3>
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
                                            <td colSpan="3" className="empty-state">Không tìm thấy dữ liệu phù hợp.</td>
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