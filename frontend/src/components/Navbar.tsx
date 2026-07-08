import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand bg-white border-bottom sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand d-lg-none fw-bold" to="/dashboard">
          MedTrack
        </Link>
        <div className="ms-auto d-flex align-items-center gap-3">
          <div className="text-end d-none d-sm-block">
            <div className="small fw-semibold">{user?.name}</div>
            <div className="small text-secondary">{user?.role}</div>
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
