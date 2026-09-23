/**
 * Shell for the back-office: side navigation plus a nested route outlet.
 * Wrapping the section in one layout keeps the navigation mounted, so moving
 * between admin screens does not re-render or re-fetch the chrome.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '▤', end: true },
  { to: '/admin/products', label: 'Products', icon: '📦' },
  { to: '/admin/categories', label: 'Categories', icon: '🏷' },
  { to: '/admin/orders', label: 'Orders', icon: '🧾' },
  { to: '/admin/users', label: 'Customers', icon: '👥' },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: 2 }}>Store administration</h1>
          <p className="muted small" style={{ margin: 0 }}>Signed in as {user.name}</p>
        </div>
      </div>

      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Administration sections">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              <span aria-hidden="true">{link.icon}</span> {link.label}
            </NavLink>
          ))}
        </nav>

        <div><Outlet /></div>
      </div>
    </div>
  );
}
