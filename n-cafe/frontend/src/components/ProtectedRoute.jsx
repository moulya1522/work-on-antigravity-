import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cafe-beige-subtle)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--cafe-dark)', marginBottom: '0.5rem' }}>☕ N CAFÉ</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading application...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="cafe-card">
          <ShieldAlert size={48} color="#D97706" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--cafe-dark)' }}>
            Restricted Access
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            This section is restricted to <strong>Café Administrators</strong> only. Your current role is <strong>{user.role} ({user.jobRole || 'Staff'})</strong>.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};
