import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Share2,
  Sun,
  Moon,
  Lock,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar({ profile, onOpenProfile }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleGoProjects = () => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/#projects');
      return;
    }
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFocusSearch = () => {
    setMobileOpen(false);
    const focusInput = () => {
      const el = document.getElementById('project-search-input');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.focus(), 250);
      }
    };
    if (location.pathname !== '/') {
      navigate('/#projects');
      setTimeout(focusInput, 300);
    } else {
      focusInput();
    }
  };

  const handleShareWebsite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      addToast('Website link copied!');
    } catch {
      addToast('Could not copy link automatically.', 'error');
    }
  };

  const ownerName = profile?.name || 'Profile';
  const initials = ownerName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand-logo" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark">
            <FolderKanban size={18} />
          </span>
          <span>PROJECT VAULT</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <button type="button" className="nav-link" onClick={handleGoProjects}>
            Projects
          </button>
          <button type="button" className="nav-link" onClick={onOpenProfile}>
            About
          </button>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn desktop-only"
            onClick={handleFocusSearch}
            title="Search projects"
            aria-label="Search projects"
          >
            <Search size={17} />
          </button>

          <button
            type="button"
            className="icon-btn desktop-only"
            onClick={handleShareWebsite}
            title="Share website"
            aria-label="Share website"
          >
            <Share2 size={17} />
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            className="profile-pill desktop-only"
            onClick={onOpenProfile}
            title="View owner profile"
          >
            <span className="avatar-sm">
              {profile?.photoUrl ? <img src={profile.photoUrl} alt={ownerName} /> : initials}
            </span>
            <span>{ownerName.split(' ')[0]}</span>
          </button>

          <Link
            to={isAuthenticated ? '/admin' : '/admin/login'}
            className="admin-discreet-link desktop-only"
            title={isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
          >
            {isAuthenticated ? <ShieldCheck size={15} /> : <Lock size={14} />}
            <span>{isAuthenticated ? 'Admin' : 'Login'}</span>
          </Link>

          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-drawer">
          <Link to="/" className="nav-link" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          <button type="button" className="nav-link" style={{ textAlign: 'left' }} onClick={handleGoProjects}>
            Projects
          </button>
          <button
            type="button"
            className="nav-link"
            style={{ textAlign: 'left' }}
            onClick={() => {
              setMobileOpen(false);
              onOpenProfile();
            }}
          >
            About / Profile ({ownerName})
          </button>
          <button type="button" className="nav-link" style={{ textAlign: 'left' }} onClick={handleFocusSearch}>
            Search Projects
          </button>
          <button
            type="button"
            className="nav-link"
            style={{ textAlign: 'left' }}
            onClick={() => {
              setMobileOpen(false);
              handleShareWebsite();
            }}
          >
            Share Website
          </button>
          <Link
            to={isAuthenticated ? '/admin' : '/admin/login'}
            className="nav-link"
            onClick={() => setMobileOpen(false)}
          >
            {isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
          </Link>
        </div>
      )}
    </header>
  );
}
