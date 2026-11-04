import React, { useState, useEffect } from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export const DocumentViewerModal = ({ document, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!document) return;

    let active = true;
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('lifelink_token');
        const res = await fetch(api.getDocumentViewUrl(document.id), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(`Failed to load document (${res.status})`);
        }

        const blob = await res.blob();
        if (active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDoc();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document?.id]);

  if (!document) return null;

  const isPdf = document.mime_type === 'application/pdf' || document.original_name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <FileText size={18} color="var(--color-primary)" />
            <h3 className="modal-title">{document.original_name || 'Document Viewer'}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" />
              <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-slate-500)' }}>
                Loading secure document preview...
              </p>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ width: '100%' }}>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && blobUrl && (
            isPdf ? (
              <iframe
                src={blobUrl}
                title={document.original_name}
                className="doc-viewer-frame"
                style={{ width: '100%', height: '520px', border: 'none' }}
              />
            ) : (
              <img
                src={blobUrl}
                alt={document.original_name}
                style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            )
          )}
        </div>

        <div className="modal-footer">
          {blobUrl && (
            <a
              href={blobUrl}
              download={document.original_name}
              className="btn btn-outline btn-sm"
            >
              <Download size={14} />
              Download File
            </a>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

