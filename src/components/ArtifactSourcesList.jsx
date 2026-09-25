import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { getSourcesForArtifact, unlinkArtifactFromAnnotation } from '../lib/artifact-sources';

/**
 * Displays list of source references (linked annotations) for an artifact
 * Shown in the "Sources" tab of ArtifactDetail
 */
export default function ArtifactSourcesList({ artifactId }) {
  const { setMapView, setActiveSource, setCurrentPage } = useStore();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSources = async () => {
      setLoading(true);
      setError(null);

      const result = await getSourcesForArtifact(artifactId);

      if (result.success) {
        setSources(result.data);
      } else {
        setError(result.error);
      }

      setLoading(false);
    };

    loadSources();
  }, [artifactId]);

  const handleUnlink = async (linkId, annotationId) => {
    if (!confirm('Remove this source reference?')) return;

    const result = await unlinkArtifactFromAnnotation(artifactId, annotationId);

    if (result.success) {
      // Remove from local state
      setSources(sources.filter((s) => s.id !== linkId));
    } else {
      alert('Failed to unlink source: ' + result.error);
    }
  };

  const handleViewInPdf = (source) => {
    const annotation = source.annotations;
    if (!annotation || !annotation.sources) return;

    // Navigate to the PDF page
    setMapView('sources');
    setActiveSource(annotation.sources.id);
    setCurrentPage(annotation.page_number || 1);
  };

  if (loading) {
    return <div className="sources-list-loading">Loading sources...</div>;
  }

  if (error) {
    return <div className="sources-list-error">Error loading sources: {error}</div>;
  }

  if (sources.length === 0) {
    return (
      <div className="sources-list-empty">
        <div className="empty-icon">📄</div>
        <h3>No Source References</h3>
        <p>This artifact hasn't been linked to any PDF annotations yet.</p>
        <p className="hint">
          To link this artifact to a source, open a PDF and create an annotation, then use "Link to
          Artifact" to connect it.
        </p>
      </div>
    );
  }

  return (
    <div className="sources-list">
      <div className="sources-header">
        <h3>Source References ({sources.length})</h3>
      </div>

      <div className="sources-items">
        {sources.map((source) => {
          const annotation = source.annotations;
          const pdfSource = annotation?.sources;

          return (
            <div key={source.id} className="source-item">
              <div className="source-header">
                <div className="source-title">
                  <span className="source-icon">📄</span>
                  <span className="source-name">
                    {pdfSource?.title || pdfSource?.filename || 'Unknown Source'}
                  </span>
                </div>
                {annotation?.page_number && (
                  <div className="source-page">Page {annotation.page_number}</div>
                )}
              </div>

              {source.quote && <div className="source-quote">"{source.quote}"</div>}

              {source.context && (
                <div className="source-context">
                  <strong>Context:</strong> {source.context}
                </div>
              )}

              {annotation?.text && annotation.text !== source.quote && (
                <div className="source-annotation-text">
                  <strong>Annotation:</strong> {annotation.text}
                </div>
              )}

              <div className="source-actions">
                <button
                  className="source-action-button view-button"
                  onClick={() => handleViewInPdf(source)}
                  title="Jump to this reference in the PDF"
                >
                  <span>📖</span> View in PDF
                </button>
                <button
                  className="source-action-button unlink-button"
                  onClick={() => handleUnlink(source.id, annotation.id)}
                  title="Remove this source reference"
                >
                  <span>🔗</span> Unlink
                </button>
              </div>

              <div className="source-meta">
                Linked {new Date(source.created_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .sources-list {
          padding: 20px;
        }

        .sources-list-loading,
        .sources-list-error {
          padding: 40px;
          text-align: center;
          color: #718096;
        }

        .sources-list-error {
          color: #c53030;
        }

        .sources-list-empty {
          padding: 60px 40px;
          text-align: center;
          color: #718096;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .sources-list-empty h3 {
          color: #2d3748;
          margin-bottom: 8px;
        }

        .sources-list-empty p {
          margin: 8px 0;
          line-height: 1.6;
        }

        .hint {
          font-size: 13px;
          font-style: italic;
          margin-top: 16px;
          padding: 12px;
          background: #f7fafc;
          border-radius: 6px;
        }

        .sources-header {
          margin-bottom: 20px;
        }

        .sources-header h3 {
          color: #2d3748;
          font-size: 18px;
          margin: 0;
        }

        .sources-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .source-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          transition: box-shadow 0.2s;
        }

        .source-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .source-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .source-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .source-icon {
          font-size: 20px;
        }

        .source-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 15px;
        }

        .source-page {
          background: #edf2f7;
          color: #4a5568;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
        }

        .source-quote {
          background: #f7fafc;
          border-left: 3px solid #667eea;
          padding: 12px;
          border-radius: 4px;
          font-style: italic;
          color: #2d3748;
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .source-context,
        .source-annotation-text {
          color: #4a5568;
          font-size: 14px;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .source-context strong,
        .source-annotation-text strong {
          color: #2d3748;
        }

        .source-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .source-action-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          background: white;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .source-action-button:hover {
          background: #f7fafc;
        }

        .view-button {
          color: #667eea;
          border-color: #667eea;
        }

        .view-button:hover {
          background: #ebf4ff;
        }

        .unlink-button {
          color: #e53e3e;
          border-color: #fc8181;
        }

        .unlink-button:hover {
          background: #fff5f5;
        }

        .source-meta {
          font-size: 12px;
          color: #a0aec0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
