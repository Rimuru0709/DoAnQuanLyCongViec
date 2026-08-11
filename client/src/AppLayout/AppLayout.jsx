import AppHeader from "../AppHeader/AppHeader";
import Sidebar from "../Sidebar/Sidebar";
import "./AppLayout.css";

/**
 * AppLayout — Three-Pane Shell
 *
 * Structure:
 *   <app-shell>
 *     <AppHeader />          ← fixed top bar
 *     <app-body>
 *       <Sidebar />          ← fixed left nav
 *       <main-workspace>     ← scrollable content
 *         {children}
 *       </main-workspace>
 *     </app-body>
 *   </app-shell>
 */
export default function AppLayout({ children }) {
    return (
        <div className="app-shell">
            <AppHeader />

            <div className="app-body">
                <Sidebar />

                <main className="main-workspace">
                    {children}
                </main>
            </div>
        </div>
    );
}
