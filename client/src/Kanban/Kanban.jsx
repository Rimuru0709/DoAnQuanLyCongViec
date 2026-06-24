import Sidebar from "../Sidebar/Sidebar";


function Kanban() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Kanban</h1>
                <p>Bảng Kanban sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Kanban;