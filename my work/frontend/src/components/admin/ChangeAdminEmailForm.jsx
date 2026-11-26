import { useState } from 'react';
import { Eye, EyeOff, KeyRound, MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ChangeAdminEmailForm({ onSuccess, onCancel }) {
  const { admin, changeAdminEmail } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const normalizedNew = newEmail.trim().toLowerCase();
    const normalizedConfirm = confirmEmail.trim().toLowerCase();

    if (!currentPassword || !normalizedNew || !normalizedConfirm) {
      setError('All fields are required.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedNew)) {
      setError('Please enter a valid new email address.');
      return;
    }

    if (normalizedNew !== normalizedConfirm) {
      setError('New email and confirmation email do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await changeAdminEmail({
        currentPassword,
        newEmail: normalizedNew,
        confirmEmail: normalizedConfirm,
      });
      const msg = data.message || 'Authorized admin email updated successfully.';
      setSuccessMsg(msg);
      addToast(msg);
      setCurrentPassword('');
      setNewEmail('');
      setConfirmEmail('');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to change admin login email.');
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
        <KeyRound size={17} color="var(--accent-cyan)" />
        <h3 style={{ fontSize: '1.05rem' }}>Change Admin Login Email</h3>
      </div>

      {admin?.email && (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Current authorized email: <strong>{admin.email}</strong>
        </p>
      )}

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

      {successMsg && (
        <div
          role="status"
          style={{
            padding: '9px 12px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            fontSize: '0.86rem',
          }}
        >
          {successMsg}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="change-email-password" className="form-label">
          Current Password *
        </label>
        <div className="input-wrap">
          <input
            id="change-email-password"
            type={showPassword ? 'text' : 'password'}
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
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="change-email-new" className="form-label">
          New Admin Email *
        </label>
        <input
          id="change-email-new"
          type="email"
          className="field-input"
          placeholder="new-admin@example.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="change-email-confirm" className="form-label">
          Confirm New Admin Email *
        </label>
        <input
          id="change-email-confirm"
          type="email"
          className="field-input"
          placeholder="Re-enter new admin email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
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
          <MailCheck size={15} />
          {submitting ? 'Updating Email...' : 'Update Admin Email'}
        </button>
      </div>
    </form>
  );
}
