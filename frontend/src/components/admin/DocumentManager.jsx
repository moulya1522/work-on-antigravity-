import { useRef, useState } from 'react';
import { Download, Eye, FileText, Pencil, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { projectsApi, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatBytes, formatFullDate } from '../../utils/formatters';
import ConfirmDialog from '../ConfirmDialog';
import PdfPreviewModal from '../PdfPreviewModal';

const TITLE_PRESETS = [
  'Project Report',
  'Synopsis',
  'Documentation',
  'Presentation',
  'Certificate',
  'Research Paper',
];

export default function DocumentManager({ project, onProjectUpdated }) {
  const { addToast } = useToast();
  const replaceInputRef = useRef(null);

  const [stagedItems, setStagedItems] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [replaceFile, setReplaceFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleSelectNewPdfs = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      title: file.name.replace(/\.pdf$/i, ''),
    }));
    setStagedItems((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleUploadStaged = async () => {
    if (!project?._id || stagedItems.length === 0) return;
    try {
      setUploading(true);
      const data = await projectsApi.uploadDocuments(project._id, stagedItems);
      onProjectUpdated(data.project);
      setStagedItems([]);
      addToast('PDF document(s) uploaded successfully.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to upload documents.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (doc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setReplaceFile(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    try {
      setSavingEdit(true);
      const data = await projectsApi.updateDocument(project._id, editingDoc._id, {
        title: editTitle,
        file: replaceFile,
      });
      onProjectUpdated(data.project);
      setEditingDoc(null);
      setReplaceFile(null);
      addToast('Document updated successfully.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to update document.'), 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!docToDelete) return;
    try {
      setDeleting(true);
      const data = await projectsApi.deleteDocument(project._id, docToDelete._id);
      onProjectUpdated(data.project);
      setDocToDelete(null);
      addToast('Document deleted.');
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to delete document.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const documents = project?.documents || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Upload New PDFs */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: stagedItems.length > 0 ? 14 : 0,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Upload PDF Documents</div>
            <div className="form-help">
              Add reports, synopses, documentation, presentations, certificates, or research papers (max 15 MB each).
            </div>
          </div>

          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Plus size={15} />
            Select PDFs
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              style={{ display: 'none' }}
              onChange={handleSelectNewPdfs}
            />
          </label>
        </div>

        {stagedItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stagedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                  padding: 10,
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <input
                  type="text"
                  className="field-input"
                  style={{ flex: '1 1 220px' }}
                  placeholder="Document title (e.g., Project Report)"
                  value={item.title}
                  onChange={(e) =>
                    setStagedItems((prev) =>
                      prev.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x))
                    )
                  }
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TITLE_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() =>
                        setStagedItems((prev) =>
                          prev.map((x) => (x.id === item.id ? { ...x, title: preset } : x))
                        )
                      }
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <span className="form-help" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.file.name}
                </span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setStagedItems((prev) => prev.filter((x) => x.id !== item.id))}
                >
                  Remove
                </button>
              </div>
            ))}

            <div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={uploading}
                onClick={handleUploadStaged}
              >
                <Upload size={15} />
                {uploading ? 'Uploading PDFs...' : `Upload ${stagedItems.length} PDF(s)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Documents */}
      {documents.length === 0 ? (
        <div className="form-help">No PDF documents uploaded for this project yet.</div>
      ) : (
        <div className="documents-list">
          {documents.map((doc) => {
            const downloadUrl = projectsApi.getDocumentFileUrl(project.slug, doc._id, {
              download: true,
            });
            return (
              <div key={doc._id} className="document-row">
                <div className="document-meta">
                  <span className="document-icon">
                    <FileText size={19} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{doc.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {doc.originalFilename}
                      {doc.bytes ? ` · ${formatBytes(doc.bytes)}` : ''}
                      {doc.uploadedAt ? ` · ${formatFullDate(doc.uploadedAt)}` : ''}
                    </div>
                  </div>
                </div>

                <div className="document-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(doc)}>
                    <Eye size={14} />
                    Preview
                  </button>
                  <a href={downloadUrl} className="btn btn-secondary btn-sm">
                    <Download size={14} />
                    Download
                  </a>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(doc)}>
                    <Pencil size={14} />
                    Edit / Replace
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setDocToDelete(doc)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Replace Modal */}
      {editingDoc && (
        <div className="modal-backdrop" onClick={() => setEditingDoc(null)} role="dialog" aria-modal="true">
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: 14 }}>Edit / Replace Document</h3>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="edit-doc-title">
                  Document Title
                </label>
                <input
                  id="edit-doc-title"
                  type="text"
                  className="field-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Replace PDF File (Optional)</label>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => replaceInputRef.current?.click()}
                  >
                    <RefreshCw size={14} />
                    Choose Replacement PDF
                  </button>
                  <span className="form-help">
                    {replaceFile ? replaceFile.name : `Current: ${editingDoc.originalFilename}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingDoc(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(docToDelete)}
        title="Delete Document"
        message={`Delete "${docToDelete?.title}"? This will permanently remove the PDF file.`}
        loading={deleting}
        onConfirm={handleDeleteDoc}
        onCancel={() => setDocToDelete(null)}
      />

      <PdfPreviewModal
        doc={previewDoc}
        previewUrl={previewDoc ? projectsApi.getDocumentFileUrl(project.slug, previewDoc._id) : ''}
        downloadUrl={
          previewDoc
            ? projectsApi.getDocumentFileUrl(project.slug, previewDoc._id, { download: true })
            : ''
        }
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
