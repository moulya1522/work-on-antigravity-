import { useEffect, useState } from 'react';
import { X, Github, Linkedin, User, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChangeAdminEmailForm from './admin/ChangeAdminEmailForm';

export default function ProfileModal({ open, onClose, profile }) {
  const { isAuthenticated } = useAuth();
  const [showEmailChange, setShowEmailChange] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowEmailChange(false);
      return;
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const displayName = profile?.name || 'Project Vault Owner';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Owner Profile">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close profile"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, paddingTop: 8 }}>
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={displayName}
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--accent-cyan)',
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--highlight-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {initials || <User size={36} />}
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 6 }}>{displayName}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.6 }}>
              {profile?.introduction ||
                'Engineering builder archiving projects, experiments, and technical milestones.'}
            </p>
          </div>

          {(profile?.linkedinUrl || profile?.githubUrl) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 6 }}>
              {profile?.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <Linkedin size={16} />
                  LinkedIn
                </a>
              )}
              {profile?.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <Github size={16} />
                  GitHub
                </a>
              )}
            </div>
          )}

          {isAuthenticated && (
            <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 6 }}>
              {!showEmailChange ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowEmailChange(true)}
                >
                  <KeyRound size={15} />
                  Change Admin Login Email
                </button>
              ) : (
                <ChangeAdminEmailForm onCancel={() => setShowEmailChange(false)} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
