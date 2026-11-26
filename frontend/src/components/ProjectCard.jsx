import { useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink } from 'lucide-react';
import { formatProjectDate } from '../utils/formatters';

export default function ProjectCard({ project, index = 0 }) {
  const navigate = useNavigate();
  const displayDate = formatProjectDate(project.date || project.createdAt);

  const handleOpenDetails = () => {
    navigate(`/projects/${project.slug}`);
  };

  return (
    <article
      className="project-card"
      style={{ animationDelay: `${Math.min(index * 45, 320)}ms` }}
      onClick={handleOpenDetails}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenDetails();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open ${project.name} details`}
    >
      {project.thumbnail?.url && (
        <div className="project-card-thumb">
          <img src={project.thumbnail.url} alt={`${project.name} thumbnail`} loading="lazy" />
        </div>
      )}

      <div className="project-card-body">
        <h3 className="project-card-name">{project.name}</h3>

        <div className="project-card-footer">
          <span className="project-card-date">
            <Calendar size={14} />
            {displayDate || 'Undated'}
          </span>

          {project.mainLink && (
            <a
              href={project.mainLink}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card-link"
              onClick={(e) => e.stopPropagation()}
            >
              Visit
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
