import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function Settings() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all your links.')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deleteAccount();
      navigate('/');
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr.error?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <Navbar variant="app" />

      <main className="app-main">
        <div className="container">
          <div className="page-header">
            <div>
              <span className="caption-uppercase">Account</span>
              <h1 className="display-sm">Settings</h1>
            </div>
            <Link to="/dashboard" className="btn-secondary">← Back to dashboard</Link>
          </div>

          <div className="settings-grid">
            <div className="surface-card">
              <h2 className="title-md" style={{ marginBottom: 16 }}>Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span className="caption-uppercase">Username</span>
                  <p className="title-sm" style={{ marginTop: 4 }}>{user?.username}</p>
                </div>
                <div>
                  <span className="caption-uppercase">Member since</span>
                  <p className="body-md" style={{ marginTop: 4 }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="danger-card">
              <h2>Delete account</h2>
              <p className="body-sm">
                Permanently delete your account and all associated links. This action cannot be undone.
              </p>
              {error && <div className="alert-error">{error}</div>}
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
