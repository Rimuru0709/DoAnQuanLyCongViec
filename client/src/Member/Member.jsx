import Sidebar from "../Sidebar/Sidebar";


function Member() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Thành viên</h1>
                <p>Danh sách các thành viên sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Member;