import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A0F08 0%, #26160C 50%, #3D2314 100%)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Ambient Decorative Circles */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200, 100, 50, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FCFAF7',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          zIndex: 10
        }}
      >
        {/* Brand Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2B1810 0%, #1A0F08 100%)',
            padding: '2.25rem 2rem 1.75rem',
            textAlign: 'center',
            borderBottom: '2px solid #D97706',
            color: '#FAF7F2'
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 6px 16px rgba(217, 119, 6, 0.35)'
            }}
          >
            <Coffee size={28} color="#FFFFFF" strokeWidth={2.2} />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              color: '#FFFFFF'
            }}
          >
            N CAFÉ
          </h1>
          <p
            style={{
              fontSize: '0.82rem',
              color: '#D5C7B7',
              marginTop: '0.35rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            Artisan Management System
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} color="var(--cafe-amber)" /> Email Address
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. admin@ncafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} color="var(--cafe-amber)" /> Password
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-amber"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.98rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)'
              }}
            >
              {loading ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Quick Demo Access */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #E8DFD5' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginBottom: '0.85rem'
              }}
            >
              Quick Test Credentials
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@ncafe.com', 'admin123')}
                style={{
                  padding: '0.65rem 0.5rem',
                  background: '#F5EFEB',
                  border: '1px solid #D5C7B7',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--cafe-dark)',
                  transition: 'var(--transition)'
                }}
              >
                <ShieldCheck size={16} color="#D97706" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff@ncafe.com', 'staff123')}
                style={{
                  padding: '0.65rem 0.5rem',
                  background: '#F5EFEB',
                  border: '1px solid #D5C7B7',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--cafe-dark)',
                  transition: 'var(--transition)'
                }}
              >
                <UserCheck size={16} color="#4A2E1B" />
                <span>Staff Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
