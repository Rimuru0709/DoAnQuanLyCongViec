import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./Home/Home";
import Project from "./Project/Project";
import ProjectDetail from "./Project/ProjectDetail";
import Task from "./Task/Task";
import Kanban from "./Kanban/Kanban";
import Calendar from "./Calendar/Calendar";
import Member from "./Member/Member";
import Report from "./Report/Report";
import Document from "./Document/Document";
import Notification from "./Notification/Notification";
import Setting from "./Setting/Setting";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
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
            </Routes>
        </BrowserRouter>
    );
}

export default App;