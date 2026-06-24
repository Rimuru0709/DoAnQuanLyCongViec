import Sidebar from "../Sidebar/Sidebar";


function Project() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Dự án</h1>
                <p>Danh sách các dự án sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Project;