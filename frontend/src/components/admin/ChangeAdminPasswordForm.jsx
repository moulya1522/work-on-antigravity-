import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';

export default function ChangeAdminPasswordForm({ onSuccess, onCancel }) {
  const { changeAdminPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('New password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      const msg = data.message || 'Password updated successfully. Please sign in with your new password.';
      addToast(msg);
      if (onSuccess) onSuccess(data);
      navigate('/admin/login', { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to change admin password.');
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        textAlign: 'left',
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={17} color="var(--accent-cyan)" />
        <h3 style={{ fontSize: '1.05rem' }}>Change Admin Password</h3>
      </div>

      <p className="form-help">
        Minimum 8 characters with uppercase, lowercase, and a number. You will be signed out to log in with the new password.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            padding: '9px 12px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.86rem',
          }}
        >
          {error}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="change-pass-current" className="form-label">
          Current Password *
        </label>
        <div className="input-wrap">
          <input
            id="change-pass-current"
            type={showCurrent ? 'text' : 'password'}
            className="field-input"
            style={{ paddingRight: 40 }}
            placeholder="Verify your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent((prev) => !prev)}
            aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            style={{
              position: 'absolute',
              right: 10,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="change-pass-new" className="form-label">
          New Password *
        </label>
        <div className="input-wrap">
          <input
            id="change-pass-new"
            type={showNew ? 'text' : 'password'}
            className="field-input"
            style={{ paddingRight: 40 }}
            placeholder="Enter strong new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew((prev) => !prev)}
            aria-label={showNew ? 'Hide new password' : 'Show new password'}
            style={{
              position: 'absolute',
              right: 10,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="change-pass-confirm" className="form-label">
          Confirm New Password *
        </label>
        <input
          id="change-pass-confirm"
          type={showNew ? 'text' : 'password'}
          className="field-input"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            Close
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
          <ShieldCheck size={15} />
          {submitting ? 'Updating Password...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}
