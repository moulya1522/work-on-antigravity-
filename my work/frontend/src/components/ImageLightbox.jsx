import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ImageLightbox({ images, activeIndex, onClose, onChangeIndex }) {
  useEffect(() => {
    if (activeIndex === null) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChangeIndex((activeIndex + 1) % images.length);
      if (e.key === 'ArrowLeft') onChangeIndex((activeIndex - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, images.length, onClose, onChangeIndex]);

  if (activeIndex === null || !images[activeIndex]) return null;

  const current = images[activeIndex];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Screenshot preview">
      <div
        className="modal-panel modal-panel-lg"
        style={{ padding: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Screenshot {activeIndex + 1} of {images.length}
          </span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </div>

        <div style={{ position: 'relative', background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden' }}>
          <img
            src={current.url}
            alt={current.caption || `Screenshot ${activeIndex + 1}`}
            style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', margin: '0 auto' }}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChangeIndex((activeIndex - 1 + images.length) % images.length)}
                aria-label="Previous screenshot"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChangeIndex((activeIndex + 1) % images.length)}
                aria-label="Next screenshot"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
        {current.caption && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 10, textAlign: 'center' }}>
            {current.caption}
          </p>
        )}
      </div>
    </div>
  );
}
