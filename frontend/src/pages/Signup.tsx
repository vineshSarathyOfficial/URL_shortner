import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(username, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr.error?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="caption-uppercase">Get started</span>
            <h1 className="display-sm">Create account</h1>
            <p className="body-sm">Start shortening URLs in seconds.</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="text-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="text-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
