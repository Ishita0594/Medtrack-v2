import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <main className="container-fluid py-4 px-3 px-lg-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
