import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const NAV = [
  { to: '/',          icon: '🏠', label: 'Главная'   },
  { to: '/wardrobe',  icon: '👗', label: 'Гардероб'  },
  { to: '/accessories', icon: '👜', label: 'Аксессуары' },
  { to: '/tips',      icon: '💬', label: 'Ассистент' },
  { to: '/ai-generate', icon: '🪄', label: 'AI Примерка' },
  { to: '/looks',     icon: '✨', label: 'Образы'    },
  { to: '/profile',   icon: '👤', label: 'Профиль'   },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const handleLogout = () => {
    logout();
    toast('До свидания! 👋', 'default');
    navigate('/login');
    onClose?.();
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          AU<span>RA</span>
          {/* Mobile close button */}
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Закрыть меню">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={handleNavClick}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div style={{ padding: '0 4px 12px', fontSize: 13, color: 'var(--muted)' }}>
              <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                {user.first_name || user.username}
              </div>
              <div style={{ fontSize: 11, letterSpacing: '0.5px' }}>{user.email}</div>
            </div>
          )}
          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--sage-deep)' }}>
            <span className="nav-icon">🚪</span>
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
