import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Globe,
  Layers,
  Server,
  Share2,
} from 'lucide-react';
import { projectsApi, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatBytes, formatFullDate, formatProjectDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import ImageLightbox from '../components/ImageLightbox';
import PdfPreviewModal from '../components/PdfPreviewModal';

export default function ProjectDetailsPage() {
  const { slug } = useParams();
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activePdf, setActivePdf] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await projectsApi.getBySlug(slug);
        if (active) {
          setProject(data.project);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Project not found.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleShareProject = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast('Project link copied!');
    } catch {
      addToast('Unable to copy project URL.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container page-shell">
        <div className="surface-card">
          <div className="skeleton" style={{ height: 32, width: '45%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 220, width: '100%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 18, width: '80%' }} />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container page-shell">
        <div className="empty-state">
          <h2 style={{ marginBottom: 10 }}>Project Unavailable</h2>
          <p style={{ marginBottom: 20 }}>{error || 'This project could not be found.'}</p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const projectLinks = [
    { label: 'Main Project Link', url: project.mainLink, Icon: Globe },
    { label: 'GitHub Repository', url: project.githubUrl, Icon: Github },
    { label: 'Frontend Deployment', url: project.frontendUrl, Icon: Layers },
    { label: 'Backend Deployment', url: project.backendUrl, Icon: Server },
    { label: 'MongoDB Cluster Link', url: project.mongoClusterUrl, Icon: Database },
  ].filter((item) => Boolean(item.url));

  const screenshots = project.screenshots || [];
  const documents = project.documents || [];
  const technologies = project.technologies || [];
  const formattedDate = formatProjectDate(project.date || project.createdAt);

  return (
    <div className="container page-shell">
      <div className="details-topbar">
        <Link to="/" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          Back to Projects
        </Link>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isAuthenticated && (
            <Link to={`/admin/projects/${project._id}/edit`} className="btn btn-secondary btn-sm">
              Edit Project
            </Link>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={handleShareProject}>
            <Share2 size={15} />
            Share Project
          </button>
        </div>
      </div>

      <div className="details-grid">
        {/* Project Overview */}
        <section className="surface-card">
          <div className={project.thumbnail?.url ? 'details-overview-grid' : ''}>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <StatusBadge status={project.status} />
                {formattedDate && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Calendar size={14} />
                    {formattedDate}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.45rem)', marginBottom: 12 }}>
                {project.name}
              </h1>

              {project.shortDescription && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.65 }}>
                  {project.shortDescription}
                </p>
              )}

              {project.mainLink && (
                <div style={{ marginTop: 20 }}>
                  <a
                    href={project.mainLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Open Live Project
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </div>

            {project.thumbnail?.url && (
              <div className="details-thumb">
                <img src={project.thumbnail.url} alt={`${project.name} thumbnail`} />
              </div>
            )}
          </div>
        </section>

        {/* Detailed Description */}
        {project.detailedDescription && (
          <section className="surface-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Description</h2>
            <div
              style={{
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-line',
                lineHeight: 1.75,
              }}
            >
              {project.detailedDescription}
            </div>
          </section>
        )}

        {/* Technologies Used */}
        {technologies.length > 0 && (
          <section className="surface-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: 14 }}>Technologies Used</h2>
            <div className="tech-list">
              {technologies.map((tech) => (
                <span key={tech} className="tech-pill">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Project Links */}
        {projectLinks.length > 0 && (
          <section className="surface-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: 14 }}>Project Links</h2>
            <div className="links-grid">
              {projectLinks.map(({ label, url, Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-tile"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Icon size={18} color="var(--accent-cyan)" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{label}</div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {url}
                      </div>
                    </div>
                  </div>
                  <ExternalLink size={15} color="var(--text-secondary)" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Screenshots / Gallery */}
        {screenshots.length > 0 && (
          <section className="surface-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: 14 }}>Screenshots / Gallery</h2>
            <div className="screenshots-grid">
              {screenshots.map((shot, idx) => (
                <button
                  key={shot._id || shot.url}
                  type="button"
                  className="screenshot-item"
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`View screenshot ${idx + 1}`}
                >
                  <img src={shot.url} alt={shot.caption || `${project.name} screenshot ${idx + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Documents / PDFs */}
        {documents.length > 0 && (
          <section className="surface-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: 14 }}>Documents / PDFs</h2>
            <div className="documents-list">
              {documents.map((doc) => {
                const previewUrl = projectsApi.getDocumentFileUrl(project.slug, doc._id);
                const downloadUrl = projectsApi.getDocumentFileUrl(project.slug, doc._id, {
                  download: true,
                });
                return (
                  <div key={doc._id} className="document-row">
                    <div className="document-meta">
                      <span className="document-icon">
                        <FileText size={20} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{doc.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {doc.originalFilename}
                          {doc.bytes ? ` · ${formatBytes(doc.bytes)}` : ''}
                          {doc.uploadedAt ? ` · Uploaded ${formatFullDate(doc.uploadedAt)}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="document-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActivePdf(doc)}
                      >
                        <Eye size={15} />
                        Preview PDF
                      </button>
                      <a href={downloadUrl} className="btn btn-primary btn-sm">
                        <Download size={15} />
                        Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Additional Notes */}
        {project.notes && (
          <section className="surface-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Additional Notes</h2>
            <div
              style={{
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-line',
                lineHeight: 1.75,
              }}
            >
              {project.notes}
            </div>
          </section>
        )}
      </div>

      <ImageLightbox
        images={screenshots}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />

      <PdfPreviewModal
        doc={activePdf}
        previewUrl={activePdf ? projectsApi.getDocumentFileUrl(project.slug, activePdf._id) : ''}
        downloadUrl={
          activePdf
            ? projectsApi.getDocumentFileUrl(project.slug, activePdf._id, { download: true })
            : ''
        }
        onClose={() => setActivePdf(null)}
      />
    </div>
  );
}
