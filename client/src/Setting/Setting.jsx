import Sidebar from "../Sidebar/Sidebar";


function Setting() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Cài đặt</h1>
                <p>Các tùy chọn cài đặt sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Setting;