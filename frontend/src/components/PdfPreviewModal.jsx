import { useEffect } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';

export default function PdfPreviewModal({ doc, previewUrl, downloadUrl, onClose }) {
  useEffect(() => {
    if (!doc) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc, onClose]);

  if (!doc) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="PDF preview">
      <div className="modal-panel modal-panel-lg" style={{ padding: 18 }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>{doc.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{doc.originalFilename}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <ExternalLink size={15} />
              New Tab
            </a>
            <a href={downloadUrl} className="btn btn-primary btn-sm">
              <Download size={15} />
              Download
            </a>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close PDF preview">
              <X size={18} />
            </button>
          </div>
        </div>

        <iframe
          title={doc.title}
          src={previewUrl}
          style={{
            width: '100%',
            height: '72vh',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            background: '#fff',
          }}
        />
      </div>
    </div>
  );
}
