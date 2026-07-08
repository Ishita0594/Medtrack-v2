import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/medications', label: 'Medications' },
  { to: '/adherence', label: 'Adherence' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/caregivers', label: 'Caregivers' },
  { to: '/prescriptions', label: 'Prescriptions' },
  { to: '/profile', label: 'Profile' },
];

export function Sidebar() {
  return (
    <aside className="sidebar border-end bg-white">
      <div className="sidebar-brand px-4 py-4">
        <span className="brand-mark">M</span>
        <span className="fw-bold ms-2">MedTrack</span>
      </div>
      <nav className="nav flex-column gap-1 px-3">
        {links.map((link) => (
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
