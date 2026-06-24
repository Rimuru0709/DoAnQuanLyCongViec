import Sidebar from "../Sidebar/Sidebar";


function Task() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Công việc</h1>
                <p>Danh sách các công việc sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Task;