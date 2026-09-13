import React, { useState } from 'react';

/**
 * Badge overlay showing that an annotation is linked to an artifact
 * Displays artifact icon and shows preview on hover
 */
export default function ArtifactBadge({ artifact, onClick }) {
  const [showPreview, setShowPreview] = useState(false);

  if (!artifact) return null;

  const categoryEmoji = {
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

  const emoji = categoryEmoji[artifact.category] || categoryEmoji.other;

  return (
    <div
      className="artifact-badge"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(artifact);
      }}
    >
      <div className="artifact-badge-icon">{emoji}</div>

      {showPreview && (
        <div className="artifact-badge-preview">
          <div className="artifact-preview-header">
            <span className="artifact-preview-emoji">{emoji}</span>
            <span className="artifact-preview-name">{artifact.name}</span>
          </div>
          {artifact.category && (
            <div className="artifact-preview-category">{artifact.category}</div>
          )}
          {artifact.description && (
            <div className="artifact-preview-description">
              {artifact.description.length > 100
                ? artifact.description.substring(0, 100) + '...'
                : artifact.description}
            </div>
          )}
          <div className="artifact-preview-hint">Click to view artifact details</div>
        </div>
      )}

      <style jsx>{`
        .artifact-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          z-index: 10;
          cursor: pointer;
        }

        .artifact-badge-icon {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        .artifact-badge-icon:hover {
          transform: scale(1.15);
        }

        .artifact-badge-preview {
          position: absolute;
          top: 30px;
          right: 0;
          width: 250px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          pointer-events: none;
        }

        .artifact-preview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .artifact-preview-emoji {
          font-size: 20px;
        }

        .artifact-preview-name {
          font-weight: 600;
          color: #1a202c;
          font-size: 14px;
          flex: 1;
        }

        .artifact-preview-category {
          display: inline-block;
          background: #edf2f7;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .artifact-preview-description {
          color: #4a5568;
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .artifact-preview-hint {
          color: #a0aec0;
          font-size: 11px;
          font-style: italic;
          text-align: center;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
}
