import Sidebar from "../Sidebar/Sidebar";


function Calendar() {
    return (
        <div className="app">
            <Sidebar />

            <main className="main">
                <h1>Lịch</h1>
                <p>Lịch biểu sẽ hiển thị ở đây.</p>
            </main>
        </div>
    );
}

export default Calendar;