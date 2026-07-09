import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', roles: ['PATIENT', 'CAREGIVER', 'ADMIN'] },
  { to: '/medications', label: 'Medications', roles: ['PATIENT', 'ADMIN'] },
  { to: '/adherence', label: 'Adherence', roles: ['PATIENT', 'ADMIN'] },
  { to: '/reminders', label: 'Reminders', roles: ['PATIENT', 'ADMIN'] },
  { to: '/caregivers', label: 'Caregivers', roles: ['PATIENT', 'CAREGIVER', 'ADMIN'] },
  { to: '/prescriptions', label: 'Prescriptions', roles: ['PATIENT', 'ADMIN'] },
  { to: '/profile', label: 'Profile', roles: ['PATIENT', 'CAREGIVER', 'ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const visibleLinks = links.filter(
    (link) => user?.role && link.roles.includes(user.role),
  );

  return (
    <aside className="sidebar border-end bg-white">
      <div className="sidebar-brand px-4 py-4">
        <span className="brand-mark">M</span>
        <span className="fw-bold ms-2">MedTrack</span>
      </div>
      <nav className="nav flex-column gap-1 px-3">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-link sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
