import { useState } from 'react';
import useStore from '../store/useStore';
import ArtifactList from './ArtifactList';
import ArtifactDetail from './ArtifactDetail';
import ArtifactForm from './ArtifactForm';

export default function Sidebar() {
  const [showArtifactForm, setShowArtifactForm] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState(null);

  const annotations = useStore((state) => state.annotations);
  const selectedArtifact = useStore((state) => state.selectedArtifact);
  const setSelectedArtifact = useStore((state) => state.setSelectedArtifact);

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Linked Marks Section - Only show when NOT viewing artifact detail */}
      {!selectedArtifact && (
        <div
          className="sidebar-section"
          style={{
            flex: '0 0 auto',
            maxHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div className="sidebar-header">Linked Marks</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
            {annotations.length === 0 ? (
              <div className="empty-state-text" style={{ padding: '20px 8px' }}>
                Highlight text on a PDF page, add a note, then link it to a map pin.
              </div>
            ) : (
              <div>
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid var(--line)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="text-accent" style={{ fontSize: '12px' }}>
                      {ann.text || '(highlight)'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                      Page {ann.page_number}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Artifacts Section */}
      <div
        className="sidebar-section"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {selectedArtifact ? (
          <ArtifactDetail
            artifact={selectedArtifact}
            onBack={() => setSelectedArtifact(null)}
            onEdit={() => {
              setEditingArtifact(selectedArtifact);
              setShowArtifactForm(true);
            }}
          />
        ) : (
          <ArtifactList
            onAddClick={() => {
              setEditingArtifact(null);
              setShowArtifactForm(true);
            }}
            onArtifactClick={(artifact) => setSelectedArtifact(artifact)}
          />
        )}
      </div>

      {/* Artifact Form Modal */}
      <ArtifactForm
        artifact={editingArtifact}
        isOpen={showArtifactForm}
        onClose={() => {
          setShowArtifactForm(false);
          setEditingArtifact(null);
        }}
      />
    </div>
  );
}
