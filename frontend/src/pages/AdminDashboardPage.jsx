import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  FileText,
  FolderPlus,
  LogOut,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  UserCog,
  LayoutDashboard,
} from 'lucide-react';
import { projectsApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatProjectDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import ProfileManager from '../components/admin/ProfileManager';
import DocumentManager from '../components/admin/DocumentManager';

export default function AdminDashboardPage({ profile, onProfileUpdated }) {
  const { admin, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('projects');
  const [overview, setOverview] = useState({
    stats: { total: 0, completed: 0, inProgress: 0, planned: 0, onHold: 0 },
    recentProjects: [],
    projects: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDocProjectId, setSelectedDocProjectId] = useState('');

  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectsApi.adminOverview();
      setOverview(data);
      if (data.projects?.length > 0) {
        setSelectedDocProjectId((prev) =>
          prev && data.projects.some((p) => p._id === prev) ? prev : data.projects[0]._id
        );
      } else {
        setSelectedDocProjectId('');
      }
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to load admin dashboard.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await projectsApi.remove(projectToDelete._id);
      setProjectToDelete(null);
      addToast('Project deleted permanently.');
      await loadOverview();
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to delete project.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedSample = async () => {
    try {
      setSeeding(true);
      await projectsApi.seedSample();
      addToast('Sample project UNFAZED added.');
      await loadOverview();
    } catch (err) {
      addToast(getErrorMessage(err, 'Could not add sample project.'), 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast('Signed out.');
    navigate('/');
  };

  const filteredProjects = (overview.projects || []).filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.technologies || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const selectedDocProject = (overview.projects || []).find((p) => p._id === selectedDocProjectId);

  const handleDocProjectUpdated = (updatedProject) => {
    setOverview((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p._id === updatedProject._id ? updatedProject : p)),
      recentProjects: prev.recentProjects.map((p) =>
        p._id === updatedProject._id ? updatedProject : p
      ),
    }));
  };

  return (
    <div className="container page-shell">
      {/* Top Bar */}
      <div className="details-topbar">
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Signed in as <strong>{admin?.email || admin?.username}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link to="/admin/projects/new" className="btn btn-primary btn-sm">
            <FolderPlus size={16} />
            Quick Add Project
          </Link>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="surface-card" style={{ padding: 18 }}>
          <div className="hero-stat-value">{overview.stats.total}</div>
          <div className="hero-stat-label">Total Projects</div>
        </div>
        <div className="surface-card" style={{ padding: 18 }}>
          <div className="hero-stat-value" style={{ color: 'var(--success)' }}>
            {overview.stats.completed}
          </div>
          <div className="hero-stat-label">Completed Projects</div>
        </div>
        <div className="surface-card" style={{ padding: 18 }}>
          <div className="hero-stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {overview.stats.inProgress}
          </div>
          <div className="hero-stat-label">In-Progress Projects</div>
        </div>
        <div className="surface-card" style={{ padding: 18 }}>
          <div className="hero-stat-value" style={{ color: 'var(--highlight-purple)' }}>
            {overview.stats.planned}
          </div>
          <div className="hero-stat-label">Planned Projects</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'projects'}
          className={`btn btn-sm ${tab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('projects')}
        >
          <LayoutDashboard size={15} />
          Manage Projects
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'documents'}
          className={`btn btn-sm ${tab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('documents')}
        >
          <FileText size={15} />
          Document Management
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'profile'}
          className={`btn btn-sm ${tab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('profile')}
        >
          <UserCog size={15} />
          Manage Profile
        </button>
      </div>

      {tab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Recently Added */}
          {overview.recentProjects.length > 0 && (
            <section className="surface-card">
              <h2 style={{ fontSize: '1.15rem', marginBottom: 14 }}>Recently Added Projects</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {overview.recentProjects.map((p) => (
                  <Link
                    key={p._id}
                    to={`/admin/projects/${p._id}/edit`}
                    className="link-tile"
                    style={{ flex: '1 1 210px' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="form-help">
                        {formatProjectDate(p.date || p.createdAt) || 'Undated'}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Manage All Projects */}
          <section className="surface-card">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: '1.25rem' }}>All Projects ({filteredProjects.length})</h2>
              <div className="input-wrap" style={{ minWidth: 260 }}>
                <Search size={15} className="input-icon" />
                <input
                  type="search"
                  className="field-input input-with-icon"
                  placeholder="Filter projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="form-help">Loading projects...</div>
            ) : overview.projects.length === 0 ? (
              <div className="empty-state">
                <h3 style={{ marginBottom: 8 }}>Your vault is currently empty</h3>
                <p style={{ marginBottom: 18 }}>
                  Add your first engineering project or optionally load the sample UNFAZED project.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                  <Link to="/admin/projects/new" className="btn btn-primary btn-sm">
                    <FolderPlus size={15} />
                    Add First Project
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={seeding}
                    onClick={handleSeedSample}
                  >
                    <Sparkles size={15} />
                    {seeding ? 'Adding Sample...' : 'Load Sample Project (UNFAZED)'}
                  </button>
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state">No projects match your filter.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredProjects.map((project) => (
                  <div key={project._id} className="document-row">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.03rem' }}>{project.name}</span>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className="form-help" style={{ marginTop: 4 }}>
                        /{project.slug} · {formatProjectDate(project.date || project.createdAt) || 'Undated'} ·{' '}
                        {(project.documents || []).length} PDF(s) · {(project.screenshots || []).length} screenshot(s)
                      </div>
                    </div>

                    <div className="document-actions">
                      <Link to={`/projects/${project.slug}`} className="btn btn-secondary btn-sm">
                        <ExternalLink size={14} />
                        View
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedDocProjectId(project._id);
                          setTab('documents');
                        }}
                      >
                        <FileText size={14} />
                        Docs
                      </button>
                      <Link to={`/admin/projects/${project._id}/edit`} className="btn btn-primary btn-sm">
                        <Pencil size={14} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setProjectToDelete(project)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'documents' && (
        <section className="surface-card">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>Document Management</h2>
              <p className="form-help">
                Organize, preview, upload, replace, or delete PDF documents per project.
              </p>
            </div>

            {overview.projects.length > 0 && (
              <select
                aria-label="Select project for document management"
                className="field-select"
                style={{ maxWidth: 320 }}
                value={selectedDocProjectId}
                onChange={(e) => setSelectedDocProjectId(e.target.value)}
              >
                {overview.projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({(p.documents || []).length} PDFs)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedDocProject ? (
            <DocumentManager
              project={selectedDocProject}
              onProjectUpdated={handleDocProjectUpdated}
            />
          ) : (
            <div className="empty-state">
              Create a project first to attach and manage PDF documents.
            </div>
          )}
        </section>
      )}

      {tab === 'profile' && (
        <ProfileManager profile={profile} onProfileUpdated={onProfileUpdated} />
      )}

      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete Project"
        loading={deleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
