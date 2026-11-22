import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Clock,
  Coffee,
  Boxes,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  Plus,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Point of Sale (POS)', path: '/pos', icon: ShoppingBag, highlight: true },
    { name: 'Orders Management', path: '/orders', icon: Clock },
    { name: 'Menu & Beverages', path: '/menu', icon: Coffee },
    { name: 'Inventory Stock', path: '/inventory', icon: Boxes },
    { name: 'Staff Directory', path: '/staff', icon: Users, adminOnly: true },
    { name: 'Customer Base', path: '/customers', icon: UserCheck },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'Café Settings', path: '/settings', icon: Settings, adminOnly: true }
  ];

  return (
    <div className="cafe-app-container">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 15, 8, 0.5)',
            zIndex: 90,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={{
          width: 270,
          background: '#1A0F08',
          color: '#FAF7F2',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #2B1810',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 100,
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          ...(window.innerWidth <= 1024
            ? {
                position: 'fixed',
                transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                boxShadow: mobileMenuOpen ? '0 0 40px rgba(0,0,0,0.5)' : 'none'
              }
            : {})
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.75rem 1.5rem',
            borderBottom: '1px solid #2B1810',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
              }}
            >
              <Coffee size={22} color="#FFFFFF" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: '#FAF7F2',
                  lineHeight: 1.1
                }}
              >
                {settings.cafeName || 'N CAFÉ'}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: '#A8998C',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: '0.2rem'
                }}
              >
                Artisan Management
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: window.innerWidth <= 1024 ? 'flex' : 'none',
              color: '#A8998C',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Action: New Order */}
        <div style={{ padding: '1.15rem 1.25rem 0.5rem' }}>
          <button
            onClick={() => {
              navigate('/pos');
              setMobileMenuOpen(false);
            }}
            className="btn btn-amber"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)'
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Create New Order</span>
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav
          style={{
            flex: 1,
            padding: '0.75rem 0.85rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.7rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FAF7F2' : '#B8A89A',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.22) 0%, rgba(217, 119, 6, 0.08) 100%)'
                      : 'transparent',
                    borderLeft: isActive ? '3px solid #D97706' : '3px solid transparent',
                    transition: 'var(--transition)'
                  })}
                >
                  <Icon size={19} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.adminOnly && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: '#3D2314',
                        color: '#FBBF24',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px'
                      }}
                    >
                      Admin
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* User Profile Card in Footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #2B1810',
            background: '#140B06',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#3D2314',
                border: '1.5px solid #6F4E37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#FBBF24',
                fontSize: '0.9rem',
                flexShrink: 0
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#FAF7F2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.name || 'User'}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: user?.role === 'admin' ? '#FBBF24' : '#B8A89A',
                  textTransform: 'capitalize'
                }}
              >
                {user?.jobRole || user?.role || 'Staff'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            style={{
              padding: '0.5rem',
              color: '#B8A89A',
              borderRadius: '8px',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#B8A89A')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="cafe-main-content">
        {/* Top Navbar */}
        <header
          style={{
            background: 'var(--cafe-white)',
            borderBottom: '1px solid var(--cafe-border)',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 80,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--cafe-dark)',
                padding: '0.35rem'
              }}
            >
              <MenuIcon size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, color: 'var(--cafe-dark)' }}>{settings.cafeName}</span>
              <ChevronRight size={14} color="var(--text-muted)" />
              <span style={{ textTransform: 'capitalize' }}>
                {window.location.pathname.replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Top Header Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.78rem',
                color: '#059669',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 6px #10B981'
                }}
              />
              <span>System Live</span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'none' }}>
              Welcome back, <strong style={{ color: 'var(--cafe-dark)' }}>{user?.name}</strong>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
