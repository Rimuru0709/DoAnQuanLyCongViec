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

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/project" element={<Project />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/task" element={<Task />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/member" element={<Member />} />
                <Route path="/report" element={<Report />} />
                <Route path="/document" element={<Document />} />
                <Route path="/notification" element={<Notification />} />
                <Route path="/setting" element={<Setting />} />

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