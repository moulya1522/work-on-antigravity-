import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function AdminLoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    const dest = location.state?.from?.pathname || '/admin';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Please enter your authorized email and password.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      await login(normalizedEmail, password);
      addToast('Welcome back to PROJECT VAULT.');
      const dest = location.state?.from?.pathname || '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Unauthorized email or invalid credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-shell" style={{ display: 'flex', justifyContent: 'center', paddingTop: 56 }}>
      <div className="surface-card" style={{ width: '100%', maxWidth: 440, padding: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span className="brand-mark" style={{ width: 42, height: 42 }}>
            <Lock size={20} />
          </span>
          <div>
            <h1 style={{ fontSize: '1.45rem' }}>Administrator Login</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Only the authorized administrator email can sign in.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.9rem',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label htmlFor="admin-email" className="form-label">
              Authorized Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="field-input"
              placeholder="Enter authorized admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="admin-password" className="form-label">
              Password
            </label>
            <div className="input-wrap">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="field-input"
                style={{ paddingRight: 42 }}
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
            <LogIn size={17} />
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
