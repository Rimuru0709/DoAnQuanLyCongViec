import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home/Home";
import Project from "./Project/Project";
import ProjectDetail from "./Project/ProjectDetail/ProjectDetail";
import Task from "./Task/Task";
import Kanban from "./Kanban/Kanban";
import Calendar from "./Calendar/Calendar";
import Member from "./Member/Member";
import Report from "./Report/Report";
import Document from "./Document/Document";
import Notification from "./Notification/Notification";
import Setting from "./Setting/Setting";
import Login from "./Login/Login";
import Register from "./Register/Register";

// Wrapper Component để bảo vệ các Router yêu cầu Đăng Nhập (Cài đặt, Thông báo...)
function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    if (!token) {
        // Nếu chưa đăng nhập, đưa về trang đăng nhập
        return <Navigate to="/login" replace />;
    }
    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Các Route Công Cộng (Không cần đăng nhập) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Home />} />
                <Route path="/project" element={<Project />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/task" element={<Task />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/member" element={<Member />} />
                <Route path="/report" element={<Report />} />
                <Route path="/document" element={<Document />} />

                {/* Các Route Riêng Tư (Cần đăng nhập) */}
                <Route path="/notification" element={
                    <ProtectedRoute>
                        <Notification />
                    </ProtectedRoute>
                } />
                
                <Route path="/setting" element={
                    <ProtectedRoute>
                        <Setting />
                    </ProtectedRoute>
                } />

                {/* Chuyển hướng các Route không khớp về Trang Chủ */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;