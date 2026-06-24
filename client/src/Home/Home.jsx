import "./Home.css";
import Sidebar from "../Sidebar/Sidebar";

function Home() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <header className="topbar">
                    <h1>Tổng quan</h1>
                    <input
                        type="text"
                        placeholder="Tìm kiếm dự án, công việc, thành viên..."
                    />
                </header>

                <section className="stats">
                    <div className="stat-card">
                        <p>Tổng dự án</p>
                        <h2>16</h2>
                        <span>↑ 23% so với tháng trước</span>
                    </div>

                    <div className="stat-card">
                        <p>Tổng công việc</p>
                        <h2>342</h2>
                        <span>↑ 18% so với tháng trước</span>
                    </div>

                    <div className="stat-card">
                        <p>Đang thực hiện</p>
                        <h2>128</h2>
                        <span>↑ 12% so với tháng trước</span>
                    </div>

                    <div className="stat-card">
                        <p>Hoàn thành</p>
                        <h2>189</h2>
                        <span>↑ 27% so với tháng trước</span>
                    </div>

                    <div className="stat-card danger">
                        <p>Quá hạn</p>
                        <h2>25</h2>
                        <span>↓ 8% so với tháng trước</span>
                    </div>
                </section>

                <section className="dashboard-grid">
                    <div className="card progress-card">
                        <h3>Tiến độ dự án</h3>
                        <div className="circle">78%</div>
                        <p>Tiến độ trung bình</p>
                    </div>

                    <div className="card chart-card">
                        <h3>Công việc theo trạng thái</h3>

                        <div className="bars">
                            <div>
                                <span style={{ height: "85%" }}></span>
                                <p>Hoàn thành</p>
                            </div>

                            <div>
                                <span style={{ height: "60%" }}></span>
                                <p>Đang làm</p>
                            </div>

                            <div>
                                <span style={{ height: "35%" }}></span>
                                <p>Chưa làm</p>
                            </div>

                            <div>
                                <span style={{ height: "25%" }}></span>
                                <p>Quá hạn</p>
                            </div>
                        </div>
                    </div>

                    <div className="card activity-card">
                        <h3>Hoạt động gần đây</h3>

                        <ul>
                            <li>Nguyễn Văn A cập nhật tiến độ dự án</li>
                            <li>Trần Thị B tạo công việc mới</li>
                            <li>Lê Văn C hoàn thành công việc</li>
                            <li>Phạm Thị D đã bình luận</li>
                            <li>Hoàng Văn E đính kèm tài liệu</li>
                        </ul>
                    </div>
                </section>

                <section className="content-grid">
                    <div className="card kanban">
                        <h3>Bảng công việc Kanban</h3>

                        <div className="kanban-board">
                            <div className="column">
                                <h4>Việc cần làm</h4>
                                <div className="task">Nghiên cứu yêu cầu hệ thống</div>
                                <div className="task">Thiết kế giao diện trang chủ</div>
                                <div className="task">Xây dựng tài liệu hướng dẫn</div>
                                <button>+ Thêm công việc</button>
                            </div>

                            <div className="column">
                                <h4>Đang thực hiện</h4>
                                <div className="task">Xây dựng API người dùng</div>
                                <div className="task">Tích hợp thanh toán</div>
                                <div className="task">Phát triển chức năng giỏ hàng</div>
                                <button>+ Thêm công việc</button>
                            </div>

                            <div className="column">
                                <h4>Đang review</h4>
                                <div className="task">Thiết kế cơ sở dữ liệu</div>
                                <div className="task">Kiểm thử đăng nhập</div>
                                <div className="task">Review giao diện sản phẩm</div>
                                <button>+ Thêm công việc</button>
                            </div>

                            <div className="column">
                                <h4>Hoàn thành</h4>
                                <div className="task">Phân tích đối thủ</div>
                                <div className="task">Xây dựng mô hình hệ thống</div>
                                <div className="task">Thiết kế wireframe</div>
                                <button>+ Thêm công việc</button>
                            </div>
                        </div>
                    </div>

                    <div className="right-panel">
                        <div className="card">
                            <h3>Dự án sắp đến hạn</h3>
                            <p>Website thương mại điện tử - 75%</p>
                            <p>Ứng dụng quản lý nhân sự - 60%</p>
                            <p>Hệ thống quản lý bán hàng - 40%</p>
                            <p>Ứng dụng đặt lịch hẹn - 20%</p>
                        </div>

                        <div className="card">
                            <h3>Tiến độ dự án</h3>
                            <div className="line-chart"></div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;