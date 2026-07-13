import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

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
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Trang Home mở tự do, không cần đăng nhập */}
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />

                {/* Trang đăng nhập và đăng ký */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Các trang cần đăng nhập */}
                <Route
                    path="/project"
                    element={
                        <ProtectedRoute>
                            <Project />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/project/:id"
                    element={
                        <ProtectedRoute>
                            <ProjectDetail />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/task"
                    element={
                        <ProtectedRoute>
                            <Task />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/kanban"
                    element={
                        <ProtectedRoute>
                            <Kanban />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/calendar"
                    element={
                        <ProtectedRoute>
                            <Calendar />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/member"
                    element={
                        <ProtectedRoute>
                            <Member />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/report"
                    element={
                        <ProtectedRoute>
                            <Report />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/document"
                    element={
                        <ProtectedRoute>
                            <Document />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notification"
                    element={
                        <ProtectedRoute>
                            <Notification />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/setting"
                    element={
                        <ProtectedRoute>
                            <Setting />
                        </ProtectedRoute>
                    }
                />

                {/* Đường dẫn sai quay về Home */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>

            <ToastContainer
                position="top-right"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="dark"
            />
        </BrowserRouter>
    );
}

export default App;