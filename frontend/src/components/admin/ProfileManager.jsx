import { useEffect, useRef, useState } from 'react';
import { KeyRound, Save, Trash2, Upload, User } from 'lucide-react';
import { profileApi, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ChangeAdminEmailForm from './ChangeAdminEmailForm';

export default function ProfileManager({ profile, onProfileUpdated }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(profile?.name || '');
  const [introduction, setIntroduction] = useState(profile?.introduction || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);

  useEffect(() => {
    setName(profile?.name || '');
    setIntroduction(profile?.introduction || '');
    setLinkedinUrl(profile?.linkedinUrl || '');
    setGithubUrl(profile?.githubUrl || '');
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = await profileApi.update({
        name,
        introduction,
        linkedinUrl,
        githubUrl,
      });
      onProfileUpdated(data.profile);
      addToast('Profile updated successfully.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to update profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const data = await profileApi.uploadPhoto(file);
      onProfileUpdated(data.profile);
      addToast('Profile photograph updated.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to upload profile photo.'), 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);
      const data = await profileApi.deletePhoto();
      onProfileUpdated(data.profile);
      addToast('Profile photograph removed.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to remove profile photo.'), 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="surface-card">
      <h2 style={{ fontSize: '1.3rem', marginBottom: 6 }}>Profile Management</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 22 }}>
        Update your public profile details shown in the header profile popup.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 18,
          padding: 16,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          marginBottom: 22,
        }}
      >
        {profile?.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={profile.name || 'Profile'}
            style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--highlight-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <User size={30} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Profile Photograph</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} />
              {uploadingPhoto ? 'Uploading...' : profile?.photoUrl ? 'Replace Photo' : 'Upload Photo'}
            </button>
            {profile?.photoUrl && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={uploadingPhoto}
                onClick={handleRemovePhoto}
              >
                <Trash2 size={15} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-field">
          <label htmlFor="profile-name" className="form-label">
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="profile-intro" className="form-label">
            Short Introduction
          </label>
          <textarea
            id="profile-intro"
            className="field-textarea"
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            placeholder="Tell visitors briefly about your engineering journey..."
          />
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="profile-linkedin" className="form-label">
              LinkedIn Profile Link
            </label>
            <input
              id="profile-linkedin"
              type="url"
              className="field-input"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="profile-github" className="form-label">
              GitHub Profile Link
            </label>
            <input
              id="profile-github"
              type="url"
              className="field-input"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 26, paddingTop: 22 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Administrator Login Email</h3>
            <p className="form-help">
              Change the single authorized email address used to sign in to the Admin Dashboard.
            </p>
          </div>
          {!showEmailChange && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowEmailChange(true)}
            >
              <KeyRound size={15} />
              Change Admin Login Email
            </button>
          )}
        </div>

        {showEmailChange && <ChangeAdminEmailForm onCancel={() => setShowEmailChange(false)} />}
      </div>
    </div>
  );
}
