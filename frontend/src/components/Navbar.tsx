import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  variant?: 'public' | 'app';
}

export default function Navbar({ variant = 'public' }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="top-nav">
      <div className="container nav-inner">
        <Link to={user ? '/dashboard' : '/'} className="nav-logo">
          <span className="nav-logo-mark">◆</span>
          Snip
        </Link>

        {variant === 'public' ? (
          <div className="nav-actions">
            <Link to="/login" className="btn-text-link">Sign in</Link>
            <Link to="/signup" className="btn-primary">Get started</Link>
          </div>
        ) : (
          <div className="nav-actions">
            <span className="nav-username">{user?.username}</span>
            <Link to="/dashboard" className="btn-text-link">Dashboard</Link>
            <Link to="/settings" className="btn-text-link">Settings</Link>
            <button type="button" onClick={logout} className="btn-secondary btn-sm">
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
