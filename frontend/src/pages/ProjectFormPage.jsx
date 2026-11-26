import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { projectsApi, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { toDateInputValue } from '../utils/formatters';
import DocumentManager from '../components/admin/DocumentManager';

const STATUSES = ['Completed', 'In Progress', 'Planned', 'On Hold'];

const INITIAL_FORM = {
  name: '',
  slug: '',
  date: '',
  shortDescription: '',
  detailedDescription: '',
  mainLink: '',
  githubUrl: '',
  frontendUrl: '',
  backendUrl: '',
  mongoClusterUrl: '',
  status: 'Completed',
  notes: '',
};

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [technologies, setTechnologies] = useState([]);
  const [techInput, setTechInput] = useState('');
  const [project, setProject] = useState(null);

  // Staged media for brand-new projects (uploaded right after project creation)
  const [stagedThumb, setStagedThumb] = useState(null);
  const [stagedScreenshots, setStagedScreenshots] = useState([]);
  const [stagedDocs, setStagedDocs] = useState([]);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    let active = true;
    async function loadProject() {
      try {
        setLoading(true);
        const data = await projectsApi.adminGetById(id);
        if (!active) return;
        const p = data.project;
        setProject(p);
        setForm({
          name: p.name || '',
          slug: p.slug || '',
          date: toDateInputValue(p.date),
          shortDescription: p.shortDescription || '',
          detailedDescription: p.detailedDescription || '',
          mainLink: p.mainLink || '',
          githubUrl: p.githubUrl || '',
          frontendUrl: p.frontendUrl || '',
          backendUrl: p.backendUrl || '',
          mongoClusterUrl: p.mongoClusterUrl || '',
          status: p.status || 'Completed',
          notes: p.notes || '',
        });
        setTechnologies(p.technologies || []);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Could not load project.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProject();
    return () => {
      active = false;
    };
  }, [id, isEditing]);

  const handleField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const addTechTokens = (raw) => {
    const tokens = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    setTechnologies((prev) => {
      const existing = new Set(prev.map((t) => t.toLowerCase()));
      const next = [...prev];
      for (const token of tokens) {
        if (!existing.has(token.toLowerCase())) {
          existing.add(token.toLowerCase());
          next.push(token);
        }
      }
      return next;
    });
    setTechInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Project Name is required.');
      return;
    }

    const pendingTokens = techInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const mergedTechnologies = [...technologies];
    const seen = new Set(mergedTechnologies.map((t) => t.toLowerCase()));
    for (const tok of pendingTokens) {
      if (!seen.has(tok.toLowerCase())) {
        mergedTechnologies.push(tok);
      }
    }

    const payload = {
      ...form,
      technologies: mergedTechnologies,
    };

    try {
      setSaving(true);
      if (isEditing) {
        const data = await projectsApi.update(id, payload);
        setProject(data.project);
        setTechnologies(data.project.technologies || []);
        setTechInput('');
        addToast('Project changes saved!');
      } else {
        const created = await projectsApi.create(payload);
        const createdId = created.project._id;

        if (stagedThumb) {
          await projectsApi.uploadThumbnail(createdId, stagedThumb);
        }
        if (stagedScreenshots.length > 0) {
          await projectsApi.uploadScreenshots(createdId, stagedScreenshots);
        }
        if (stagedDocs.length > 0) {
          await projectsApi.uploadDocuments(createdId, stagedDocs);
        }

        addToast('Project created successfully!');
        navigate(`/admin/projects/${createdId}/edit`, { replace: true });
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to save project.');
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Live media handlers when editing an existing project
  const handleUploadThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isEditing) {
      setStagedThumb(file);
      return;
    }
    try {
      setMediaBusy(true);
      const data = await projectsApi.uploadThumbnail(id, file);
      setProject(data.project);
      addToast('Thumbnail uploaded.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to upload thumbnail.'), 'error');
    } finally {
      setMediaBusy(false);
      e.target.value = '';
    }
  };

  const handleRemoveThumbnail = async () => {
    if (!isEditing) {
      setStagedThumb(null);
      return;
    }
    try {
      setMediaBusy(true);
      const data = await projectsApi.removeThumbnail(id);
      setProject(data.project);
      addToast('Thumbnail removed.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to remove thumbnail.'), 'error');
    } finally {
      setMediaBusy(false);
    }
  };

  const handleUploadScreenshots = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!isEditing) {
      setStagedScreenshots((prev) => [...prev, ...files]);
      e.target.value = '';
      return;
    }
    try {
      setMediaBusy(true);
      const data = await projectsApi.uploadScreenshots(id, files);
      setProject(data.project);
      addToast('Screenshots uploaded.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to upload screenshots.'), 'error');
    } finally {
      setMediaBusy(false);
      e.target.value = '';
    }
  };

  const handleDeleteScreenshot = async (shotId) => {
    try {
      setMediaBusy(true);
      const data = await projectsApi.deleteScreenshot(id, shotId);
      setProject(data.project);
      addToast('Screenshot removed.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to remove screenshot.'), 'error');
    } finally {
      setMediaBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container page-shell">
        <div className="surface-card" style={{ padding: 40, textAlign: 'center' }}>
          Loading project details...
        </div>
      </div>
    );
  }

  return (
    <div className="container page-shell">
      <div className="details-topbar">
        <Link to="/admin" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {isEditing && project?.slug && (
          <Link to={`/projects/${project.slug}`} className="btn btn-secondary btn-sm">
            <ExternalLink size={15} />
            View Public Page
          </Link>
        )}
      </div>

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: 6 }}>
          {isEditing ? `Edit Project: ${project?.name || ''}` : 'Add New Project'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.93rem' }}>
          Only Project Name is required. Empty fields are automatically hidden on the public page.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <form onSubmit={handleSubmit} className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={{ fontSize: '1.2rem' }}>Project Information</h2>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="proj-name" className="form-label">
                Project Name *
              </label>
              <input
                id="proj-name"
                type="text"
                className="field-input"
                placeholder="e.g., UNFAZED"
                value={form.name}
                onChange={handleField('name')}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="proj-slug" className="form-label">
                URL Slug (Optional)
              </label>
              <input
                id="proj-slug"
                type="text"
                className="field-input"
                placeholder="auto-generated-from-name"
                value={form.slug}
                onChange={handleField('slug')}
              />
              <span className="form-help">Used in /projects/{form.slug || 'project-slug'}</span>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="proj-date" className="form-label">
                Project Date
              </label>
              <input
                id="proj-date"
                type="date"
                className="field-input"
                value={form.date}
                onChange={handleField('date')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="proj-status" className="form-label">
                Project Status
              </label>
              <select
                id="proj-status"
                className="field-select"
                value={form.status}
                onChange={handleField('status')}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="proj-short-desc" className="form-label">
              Short Description
            </label>
            <textarea
              id="proj-short-desc"
              className="field-textarea"
              style={{ minHeight: 74 }}
              placeholder="A concise 1-2 sentence overview shown at the top of the project details page."
              value={form.shortDescription}
              onChange={handleField('shortDescription')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="proj-detailed-desc" className="form-label">
              Detailed Description
            </label>
            <textarea
              id="proj-detailed-desc"
              className="field-textarea"
              style={{ minHeight: 140 }}
              placeholder="Architecture, problem solved, key features, and implementation details..."
              value={form.detailedDescription}
              onChange={handleField('detailedDescription')}
            />
          </div>

          {/* Technologies */}
          <div className="form-field">
            <label htmlFor="proj-tech" className="form-label">
              Technologies Used
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="proj-tech"
                type="text"
                className="field-input"
                placeholder="Type technologies (e.g. React, Node.js, MongoDB) and press Add or Enter"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTechTokens(techInput);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => addTechTokens(techInput)}
              >
                <Plus size={15} />
                Add
              </button>
            </div>
            {technologies.length > 0 && (
              <div className="tech-list" style={{ marginTop: 8 }}>
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="tech-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {tech}
                    <button
                      type="button"
                      aria-label={`Remove ${tech}`}
                      onClick={() => setTechnologies((prev) => prev.filter((t) => t !== tech))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                      }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="proj-main-link" className="form-label">
                Main Project Link
              </label>
              <input
                id="proj-main-link"
                type="url"
                className="field-input"
                placeholder="https://myproject.vercel.app"
                value={form.mainLink}
                onChange={handleField('mainLink')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="proj-github" className="form-label">
                GitHub Repository Link
              </label>
              <input
                id="proj-github"
                type="url"
                className="field-input"
                placeholder="https://github.com/username/repo"
                value={form.githubUrl}
                onChange={handleField('githubUrl')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="proj-frontend" className="form-label">
                Frontend Deployment Link
              </label>
              <input
                id="proj-frontend"
                type="url"
                className="field-input"
                placeholder="https://frontend.vercel.app"
                value={form.frontendUrl}
                onChange={handleField('frontendUrl')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="proj-backend" className="form-label">
                Backend Deployment Link
              </label>
              <input
                id="proj-backend"
                type="url"
                className="field-input"
                placeholder="https://api.onrender.com"
                value={form.backendUrl}
                onChange={handleField('backendUrl')}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="proj-mongo" className="form-label">
              MongoDB Cluster Link
            </label>
            <input
              id="proj-mongo"
              type="url"
              className="field-input"
              placeholder="https://cloud.mongodb.com/v2/..."
              value={form.mongoClusterUrl}
              onChange={handleField('mongoClusterUrl')}
            />
            <span className="form-help">
              Paste your MongoDB Atlas dashboard/cluster web URL only. Never enter database passwords or connection strings here.
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="proj-notes" className="form-label">
              Extra Information / Notes
            </label>
            <textarea
              id="proj-notes"
              className="field-textarea"
              placeholder="Lessons learned, future roadmap, credits, or setup notes..."
              value={form.notes}
              onChange={handleField('notes')}
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving Project...' : isEditing ? 'Save Project Changes' : 'Create Project'}
            </button>
          </div>
        </form>

        {/* Thumbnail Section */}
        <section className="surface-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Project Thumbnail</h2>
          <p className="form-help" style={{ marginBottom: 14 }}>
            Displayed on the project card and details page overview (JPG, JPEG, PNG, WebP up to 5 MB).
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            {(isEditing ? project?.thumbnail?.url : stagedThumb) && (
              <img
                src={isEditing ? project.thumbnail.url : URL.createObjectURL(stagedThumb)}
                alt="Thumbnail preview"
                style={{
                  width: 180,
                  height: 105,
                  objectFit: 'cover',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                }}
              />
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={15} />
                {mediaBusy
                  ? 'Uploading...'
                  : (isEditing ? project?.thumbnail?.url : stagedThumb)
                    ? 'Replace Thumbnail'
                    : 'Upload Thumbnail'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  disabled={mediaBusy}
                  onChange={handleUploadThumbnail}
                />
              </label>

              {(isEditing ? project?.thumbnail?.url : stagedThumb) && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={mediaBusy}
                  onClick={handleRemoveThumbnail}
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Screenshots Section */}
        <section className="surface-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Project Screenshots</h2>
              <p className="form-help">Upload multiple screenshots to display in the gallery.</p>
            </div>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Plus size={15} />
              {mediaBusy ? 'Uploading...' : 'Add Screenshots'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                style={{ display: 'none' }}
                disabled={mediaBusy}
                onChange={handleUploadScreenshots}
              />
            </label>
          </div>

          {isEditing ? (
            (project?.screenshots || []).length === 0 ? (
              <div className="form-help">No screenshots uploaded yet.</div>
            ) : (
              <div className="screenshots-grid">
                {project.screenshots.map((shot) => (
                  <div
                    key={shot._id}
                    style={{
                      position: 'relative',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      aspectRatio: '16 / 10',
                    }}
                  >
                    <img
                      src={shot.url}
                      alt={shot.caption || 'Project screenshot'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={mediaBusy}
                      onClick={() => handleDeleteScreenshot(shot._id)}
                      style={{ position: 'absolute', top: 8, right: 8, padding: '5px 8px' }}
                      aria-label="Delete screenshot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : stagedScreenshots.length === 0 ? (
            <div className="form-help">Select screenshots to upload when you click Create Project.</div>
          ) : (
            <div className="screenshots-grid">
              {stagedScreenshots.map((file, idx) => (
                <div
                  key={`${file.name}_${idx}`}
                  style={{
                    position: 'relative',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    aspectRatio: '16 / 10',
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setStagedScreenshots((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ position: 'absolute', top: 8, right: 8, padding: '5px 8px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PDF Documents Section */}
        <section className="surface-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>PDF Documents</h2>
          {isEditing && project ? (
            <DocumentManager project={project} onProjectUpdated={setProject} />
          ) : (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className="form-help">
                  Stage PDF files here to upload automatically when you click Create Project.
                </span>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Plus size={15} />
                  Select PDFs
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setStagedDocs((prev) => [
                        ...prev,
                        ...files.map((file) => ({
                          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                          file,
                          title: file.name.replace(/\.pdf$/i, ''),
                        })),
                      ]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              {stagedDocs.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="text"
                    className="field-input"
                    style={{ flex: '1 1 220px' }}
                    placeholder="Document title"
                    value={item.title}
                    onChange={(e) =>
                      setStagedDocs((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x))
                      )
                    }
                  />
                  <span className="form-help">{item.file.name}</span>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setStagedDocs((prev) => prev.filter((x) => x.id !== item.id))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
