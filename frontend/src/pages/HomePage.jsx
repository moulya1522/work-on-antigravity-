import { useEffect, useState } from 'react';
import { ArrowDown, Search, Sparkles } from 'lucide-react';
import { projectsApi } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import AnimatedCounter from '../components/AnimatedCounter';

const STATUS_OPTIONS = ['All', 'Completed', 'In Progress', 'Planned', 'On Hold'];

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, planned: 0 });
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [technology, setTechnology] = useState('All');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const data = await projectsApi.list({
          search: search.trim() || undefined,
          status: status !== 'All' ? status : undefined,
          technology: technology !== 'All' ? technology : undefined,
          sort,
        });
        if (!active) return;
        setProjects(data.projects || []);
        setStats(data.stats || { total: 0, completed: 0, inProgress: 0, planned: 0 });
        setTechnologies(data.technologies || []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || 'Unable to load projects right now.');
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, status, technology, sort]);

  useEffect(() => {
    if (window.location.hash === '#projects') {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Compact Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="container hero-content">
          <div>
            <div className="hero-kicker">
              <Sparkles size={14} />
              Personal Engineering Archive
            </div>
            <h1 className="hero-title">My Projects. My Journey. My Progress.</h1>
            <p className="hero-subtitle">
              A collection of projects I&apos;ve built, explored, and developed throughout my learning
              journey.
            </p>
            <div className="hero-cta-row">
              <button type="button" className="btn btn-primary" onClick={scrollToProjects}>
                Explore Projects
                <ArrowDown size={16} />
              </button>
            </div>
          </div>

          <div className="hero-stats-grid" aria-label="Project statistics">
            <div className="hero-stat-card">
              <div className="hero-stat-value">
                <AnimatedCounter value={stats.total} />
              </div>
              <div className="hero-stat-label">Total Projects</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-value" style={{ color: 'var(--success)' }}>
                <AnimatedCounter value={stats.completed} />
              </div>
              <div className="hero-stat-label">Completed</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-value" style={{ color: 'var(--accent-cyan)' }}>
                <AnimatedCounter value={stats.inProgress} />
              </div>
              <div className="hero-stat-label">In Progress</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-value" style={{ color: 'var(--highlight-purple)' }}>
                <AnimatedCounter value={technologies.length} />
              </div>
              <div className="hero-stat-label">Technologies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Collection */}
      <section id="projects" className="projects-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Project Collection</h2>
              <p className="section-subtitle">
                Click any project card to inspect full documentation, screenshots, links, and PDFs.
              </p>
            </div>
          </div>

          <div className="controls-bar" aria-label="Search, filter, and sort projects">
            <div className="input-wrap">
              <Search size={16} className="input-icon" />
              <input
                id="project-search-input"
                type="search"
                className="field-input input-with-icon"
                placeholder="Search by project name or technology..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              aria-label="Filter by status"
              className="field-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  Status: {opt}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by technology"
              className="field-select"
              value={technology}
              onChange={(e) => setTechnology(e.target.value)}
            >
              <option value="All">Tech: All</option>
              {technologies.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort projects"
              className="field-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="alpha">Sort: Alphabetical (A–Z)</option>
            </select>
          </div>

          {error && (
            <div className="empty-state" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <p style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          {!error && loading && (
            <div className="projects-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: 170, borderRadius: 0 }} />
                  <div style={{ padding: 20 }}>
                    <div className="skeleton" style={{ height: 22, width: '70%', marginBottom: 14 }} />
                    <div className="skeleton" style={{ height: 16, width: '45%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!error && !loading && projects.length === 0 && (
            <div className="empty-state">
              <h3 style={{ marginBottom: 8 }}>No projects found</h3>
              <p>
                {search || status !== 'All' || technology !== 'All'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Projects added by the administrator will appear here.'}
              </p>
            </div>
          )}

          {!error && !loading && projects.length > 0 && (
            <div className="projects-grid">
              {projects.map((project, idx) => (
                <ProjectCard key={project._id} project={project} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
