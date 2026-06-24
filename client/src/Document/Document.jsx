import Sidebar from "../Sidebar/Sidebar";


function Document() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Tài liệu</h1>
                <p>Danh sách các tài liệu sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Document;