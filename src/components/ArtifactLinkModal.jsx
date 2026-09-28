import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { linkArtifactToAnnotation } from '../lib/artifact-sources';
import ArtifactForm from './ArtifactForm';

/**
 * Modal for linking an annotation to an artifact
 * Two modes: link to existing artifact or create new artifact
 */
export default function ArtifactLinkModal({ annotation, onClose, onLink }) {
  const { artifacts, currentProject } = useStore();
  const [mode, setMode] = useState('select'); // 'select' or 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtifactId, setSelectedArtifactId] = useState(null);
  const [context, setContext] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState(null);

  // Get quote from annotation
  const quote = annotation.text || annotation.content || '';

  // Filter artifacts by search term
  const projectArtifacts = artifacts.filter((a) => a.project_id === currentProject?.id);
  const filteredArtifacts = projectArtifacts.filter(
    (artifact) =>
      artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkExisting = async () => {
    if (!selectedArtifactId) {
      setError('Please select an artifact');
      return;
    }

    setIsLinking(true);
    setError(null);

    const result = await linkArtifactToAnnotation(
      selectedArtifactId,
      annotation.id,
      quote,
      context
    );

    setIsLinking(false);

    if (result.success) {
      onLink?.(result.data);
      onClose();
    } else {
      setError(result.error || 'Failed to link artifact');
    }
  };

  const handleArtifactCreated = async (newArtifact) => {
    // Link the newly created artifact to this annotation
    const result = await linkArtifactToAnnotation(newArtifact.id, annotation.id, quote, context);

    if (result.success) {
      onLink?.(result.data);
      onClose();
    } else {
      setError(result.error || 'Failed to link new artifact');
    }
  };

  if (mode === 'create') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content artifact-link-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Create New Artifact from Source</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="quote-display">
            <strong>Source Quote:</strong>
            <div className="quote-text">{quote}</div>
          </div>

          <ArtifactForm
            initialData={{ description: quote }}
            onSave={handleArtifactCreated}
            onCancel={() => setMode('select')}
          />

          <style jsx>{`
            .quote-display {
              background: #f7fafc;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 16px;
              border-left: 3px solid #667eea;
            }

            .quote-text {
              margin-top: 8px;
              font-style: italic;
              color: #4a5568;
              max-height: 100px;
              overflow-y: auto;
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content artifact-link-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Link Annotation to Artifact</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="quote-section">
            <label>Quote from PDF:</label>
            <div className="quote-display">{quote || '(No text content)'}</div>
          </div>

          <div className="mode-section">
            <div className="mode-option">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={mode === 'select'}
                  onChange={() => setMode('select')}
                />
                <span>Link to Existing Artifact</span>
              </label>
            </div>

            {mode === 'select' && (
              <div className="select-artifact-section">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search artifacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="artifact-list">
                  {filteredArtifacts.length === 0 ? (
                    <div className="no-artifacts">
                      {projectArtifacts.length === 0
                        ? 'No artifacts in this project yet.'
                        : 'No artifacts match your search.'}
                    </div>
                  ) : (
                    filteredArtifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className={`artifact-item ${selectedArtifactId === artifact.id ? 'selected' : ''}`}
                        onClick={() => setSelectedArtifactId(artifact.id)}
                      >
                        <div className="artifact-icon">{getCategoryEmoji(artifact.category)}</div>
                        <div className="artifact-info">
                          <div className="artifact-name">{artifact.name}</div>
                          {artifact.category && (
                            <div className="artifact-category">{artifact.category}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="mode-option">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={mode === 'create'}
                  onChange={() => setMode('create')}
                />
                <span>Create New Artifact</span>
              </label>
            </div>
          </div>

          <div className="context-section">
            <label htmlFor="context">Additional Context (optional):</label>
            <textarea
              id="context"
              className="context-input"
              placeholder="Add notes about this reference..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={handleLinkExisting}
            disabled={isLinking || !selectedArtifactId}
          >
            {isLinking ? 'Linking...' : 'Link Artifact'}
          </button>
        </div>

        <style jsx>{`
          .artifact-link-modal {
            max-width: 500px;
            width: 100%;
          }

          .modal-body {
            padding: 20px;
          }

          .error-message {
            background: #fed7d7;
            color: #c53030;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
          }

          .quote-section {
            margin-bottom: 20px;
          }

          .quote-section label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #2d3748;
          }

          .quote-display {
            background: #f7fafc;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            font-style: italic;
            color: #4a5568;
            max-height: 120px;
            overflow-y: auto;
          }

          .mode-section {
            margin-bottom: 20px;
          }

          .mode-option {
            margin-bottom: 16px;
          }

          .radio-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-weight: 500;
            color: #2d3748;
          }

          .radio-label input[type='radio'] {
            cursor: pointer;
          }

          .select-artifact-section {
            margin: 16px 0 16px 24px;
          }

          .search-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 12px;
          }

          .search-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .artifact-list {
            max-height: 250px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
          }

          .no-artifacts {
            padding: 32px;
            text-align: center;
            color: #a0aec0;
            font-style: italic;
          }

          .artifact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            cursor: pointer;
            border-bottom: 1px solid #e2e8f0;
            transition: background 0.15s;
          }

          .artifact-item:last-child {
            border-bottom: none;
          }

          .artifact-item:hover {
            background: #f7fafc;
          }

          .artifact-item.selected {
            background: #ebf4ff;
            border-left: 3px solid #667eea;
          }

          .artifact-icon {
            font-size: 24px;
          }

          .artifact-info {
            flex: 1;
          }

          .artifact-name {
            font-weight: 500;
            color: #2d3748;
            margin-bottom: 2px;
          }

          .artifact-category {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .context-section label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #2d3748;
          }

          .context-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
          }

          .context-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}

function getCategoryEmoji(category) {
  const emojiMap = {
    pottery: '🏺',
    sculpture: '🗿',
    jewelry: '💍',
    weapon: '⚔️',
    tool: '🔨',
    coin: '💰',
    textile: '🧵',
    inscription: '📜',
    architecture: '🏛️',
    other: '📦',
  };
  return emojiMap[category] || emojiMap.other;
}
