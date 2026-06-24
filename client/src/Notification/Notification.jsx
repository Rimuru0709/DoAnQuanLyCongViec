import Sidebar from "../Sidebar/Sidebar";


function Notification() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Thông báo</h1>
                <p>Danh sách các thông báo sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Notification;