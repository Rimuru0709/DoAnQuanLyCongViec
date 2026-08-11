import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Home           from "./Home/Home";
import Project        from "./Project/Project";
import ProjectDetail  from "./Project/ProjectDetail/ProjectDetail";
import Task           from "./Task/Task";
import Kanban         from "./Kanban/Kanban";
import Calendar       from "./Calendar/Calendar";
import Member         from "./Member/Member";
import Report         from "./Report/Report";
import Document       from "./Document/Document";
import Notification   from "./Notification/Notification";
import Setting        from "./Setting/Setting";
import Automation     from "./Automation/Automation";
import Login          from "./Login/Login";
import Register       from "./Register/Register";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import AppLayout      from "./AppLayout/AppLayout";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ── Auth pages — no layout ── */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ── App pages — with AppLayout (Header + Sidebar) ── */}
                <Route path="/" element={
                    <AppLayout><Home /></AppLayout>
                } />
                <Route path="/home" element={
                    <AppLayout><Home /></AppLayout>
                } />

                <Route path="/project" element={
                    <ProtectedRoute>
                        <AppLayout><Project /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/project/:id" element={
                    <ProtectedRoute>
                        <AppLayout><ProjectDetail /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/task" element={
                    <ProtectedRoute>
                        <AppLayout><Task /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/kanban" element={
                    <ProtectedRoute>
                        <AppLayout><Kanban /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/calendar" element={
                    <ProtectedRoute>
                        <AppLayout><Calendar /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/member" element={
                    <ProtectedRoute>
                        <AppLayout><Member /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/report" element={
                    <ProtectedRoute>
                        <AppLayout><Report /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/document" element={
                    <ProtectedRoute>
                        <AppLayout><Document /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/notification" element={
                    <ProtectedRoute>
                        <AppLayout><Notification /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/setting" element={
                    <ProtectedRoute>
                        <AppLayout><Setting /></AppLayout>
                    </ProtectedRoute>
                } />

                <Route path="/automation" element={
                    <ProtectedRoute>
                        <AppLayout><Automation /></AppLayout>
                    </ProtectedRoute>
                } />

                {/* ── Fallback ── */}
                <Route path="*" element={<Navigate to="/" replace />} />
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