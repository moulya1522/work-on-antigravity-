import { CheckCircle2, Clock, Compass, PauseCircle } from 'lucide-react';

const STATUS_CONFIG = {
  Completed: { className: 'status-completed', Icon: CheckCircle2 },
  'In Progress': { className: 'status-in-progress', Icon: Clock },
  Planned: { className: 'status-planned', Icon: Compass },
  'On Hold': { className: 'status-on-hold', Icon: PauseCircle },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Completed;
  const { Icon } = cfg;
  return (
    <span className={`status-badge ${cfg.className}`}>
      <Icon size={14} />
      {status}
    </span>
  );
}
