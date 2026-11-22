import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Percent,
  Lock,
  User,
  Shield,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const { settings, refreshSettings } = useSettings();
  const { user, updateUser } = useAuth();
  const toast = useToast();

  // Café Config Form State
  const [cafeForm, setCafeForm] = useState({
    cafeName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    currency: 'INR',
    currencySymbol: '₹',
    taxRate: 5,
    orderPrefix: 'NC-'
  });
  const [savingCafe, setSavingCafe] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    jobRole: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (settings) {
      setCafeForm({
        cafeName: settings.cafeName || 'N CAFÉ',
        tagline: settings.tagline || 'Artisan Brews & Gourmet Moments',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        currency: settings.currency || 'INR',
        currencySymbol: settings.currencySymbol || '₹',
        taxRate: settings.taxRate || 5,
        orderPrefix: settings.orderPrefix || 'NC-'
      });
    }

    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        jobRole: user.jobRole || ''
      });
    }
  }, [settings, user]);

  const handleSaveCafeSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingCafe(true);
      const res = await api.put('/settings', cafeForm);
      if (res.data.success) {
        toast.success('Café settings updated successfully!');
        refreshSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSavingCafe(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.put('/auth/profile', profileForm);
      if (res.data.success) {
        toast.success('Admin profile updated!');
        updateUser(res.data.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="cafe-page-wrapper" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Café Settings & Administration</h1>
          <p className="page-subtitle">Configure branding, tax compliance, bill headers, and manager credentials</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Café Identity & Billing Configuration */}
        <div className="cafe-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} color="#D97706" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
                General Café Information & Branding
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Displayed on customer receipts, invoices, and the dashboard header
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveCafeSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Café Brand Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={cafeForm.cafeName}
                  onChange={(e) => setCafeForm({ ...cafeForm, cafeName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tagline</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Artisan Brews & Gourmet Moments"
                  value={cafeForm.tagline}
                  onChange={(e) => setCafeForm({ ...cafeForm, tagline: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Café Outlet Address (Printed on Bill)</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={cafeForm.address}
                onChange={(e) => setCafeForm({ ...cafeForm, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={cafeForm.phone}
                  onChange={(e) => setCafeForm({ ...cafeForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={cafeForm.email}
                  onChange={(e) => setCafeForm({ ...cafeForm, email: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={cafeForm.currencySymbol}
                  onChange={(e) => setCafeForm({ ...cafeForm, currencySymbol: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GST / Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="form-input"
                  value={cafeForm.taxRate}
                  onChange={(e) => setCafeForm({ ...cafeForm, taxRate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order ID Prefix</label>
                <input
                  type="text"
                  className="form-input"
                  value={cafeForm.orderPrefix}
                  onChange={(e) => setCafeForm({ ...cafeForm, orderPrefix: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-amber" disabled={savingCafe}>
                <Save size={16} />
                <span>{savingCafe ? 'Saving Changes...' : 'Save Café Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Profile & Security Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Admin Profile */}
          <div className="cafe-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
                  Administrator Profile
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Your personal identity and contact info
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation / Role Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.jobRole}
                  onChange={(e) => setProfileForm({ ...profileForm, jobRole: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-secondary" disabled={savingProfile} style={{ width: '100%' }}>
                {savingProfile ? 'Updating...' : 'Update Admin Info'}
              </button>
            </form>
          </div>

          {/* Security & Password */}
          <div className="cafe-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="#7C3AED" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--cafe-dark)' }}>
                  Security & Password
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Update your authentication credentials
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingPassword} style={{ width: '100%' }}>
                {savingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
