import useStore from '../store/useStore';
import './EntityDetailPanel.css';

/**
 * EntityDetailPanel - Right panel showing details of selected entity
 * Displays properties for people, events, theories, places, and artifacts
 */
export default function EntityDetailPanel() {
  const selectedArtifact = useStore((state) => state.selectedArtifact);

  // For Phase 4, we'll start with artifact details
  // Future: Add selectedEntity state for all entity types

  if (!selectedArtifact) {
    return (
      <div className="entity-detail-panel">
        <div className="no-selection">
          <div className="no-selection-icon">📋</div>
          <div className="no-selection-title">No Selection</div>
          <div className="no-selection-text">
            Select an entity from the explorer to view details
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="entity-detail-panel">
      <div className="entity-detail-header">
        <div className="entity-detail-type">{selectedArtifact.category || 'Artifact'}</div>
        <div className="entity-detail-name">{selectedArtifact.name}</div>
      </div>

      <div className="entity-detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <div className="detail-section-title">Basic Information</div>

          {selectedArtifact.category && (
            <div className="detail-field">
              <div className="detail-label">Category</div>
              <div className="detail-value">{selectedArtifact.category}</div>
            </div>
          )}

          {selectedArtifact.material && (
            <div className="detail-field">
              <div className="detail-label">Material</div>
              <div className="detail-value">{selectedArtifact.material}</div>
            </div>
          )}

          {selectedArtifact.period && (
            <div className="detail-field">
              <div className="detail-label">Period</div>
              <div className="detail-value">{selectedArtifact.period}</div>
            </div>
          )}

          {selectedArtifact.dimensions && (
            <div className="detail-field">
              <div className="detail-label">Dimensions</div>
              <div className="detail-value">{selectedArtifact.dimensions}</div>
            </div>
          )}
        </div>

        {/* Description */}
        {selectedArtifact.description && (
          <div className="detail-section">
            <div className="detail-section-title">Description</div>
            <div className="detail-description">{selectedArtifact.description}</div>
          </div>
        )}

        {/* Current Location */}
        {selectedArtifact.current_location && (
          <div className="detail-section">
            <div className="detail-section-title">Current Location</div>
            <div className="detail-value">{selectedArtifact.current_location}</div>
          </div>
        )}

        {/* Metadata */}
        <div className="detail-section">
          <div className="detail-section-title">Metadata</div>

          {selectedArtifact.created_at && (
            <div className="detail-field">
              <div className="detail-label">Added</div>
              <div className="detail-value">
                {new Date(selectedArtifact.created_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {selectedArtifact.updated_at && (
            <div className="detail-field">
              <div className="detail-label">Last Modified</div>
              <div className="detail-value">
                {new Date(selectedArtifact.updated_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
