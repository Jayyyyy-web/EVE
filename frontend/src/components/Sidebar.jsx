import { NavLink } from 'react-router-dom';
import {
  Home,
  SlidersHorizontal,
  Car,
  Database,
  Sparkles,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Home', to: '/dashboard', icon: Home, enabled: true },
  { label: 'Configurator', to: '/vehicles/new', icon: SlidersHorizontal, enabled: true },
  { label: 'Garage', to: '/vehicles', icon: Car, enabled: true },
  { label: 'Database', to: '#', icon: Database, enabled: false },
  { label: 'AI Assistant', to: '#', icon: Sparkles, enabled: false },
  { label: 'Community', to: '#', icon: Users, enabled: false },
  { label: 'Settings', to: '#', icon: Settings, enabled: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand">EVE</span>
        <span className="sidebar-tagline">Enhance Vehicle Environment</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ label, to, icon: Icon, enabled }) =>
          enabled ? (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </NavLink>
          ) : (
            <div key={label} className="sidebar-link disabled" title="Coming soon">
              <Icon size={18} strokeWidth={1.8} />
              {label}
              <span className="soon-tag">Soon</span>
            </div>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initial}</div>
          <div>
            <div className="sidebar-username">{user?.username}</div>
            <div className="sidebar-role">{user?.role === 'admin' ? 'Admin' : 'Member'}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Log out">
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
