import useStore from '../store/useStore';

export default function Sidebar() {
  const annotations = useStore((state) => state.annotations);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);

  return (
    <div className="sidebar">
      {/* Linked Marks Section */}
      <div className="sidebar-section">
        <div className="sidebar-header">Linked Marks</div>
        <div className="sidebar-content">
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

      {/* Artifacts Section */}
      <div
        className="sidebar-section"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div className="sidebar-header">Artifacts</div>
        <div className="sidebar-content">
          {artifacts.length === 0 ? (
            <div className="empty-state-text" style={{ padding: '20px 8px' }}>
              Add artifact records with findspot locations.
            </div>
          ) : (
            <div>
              {artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--line)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{artifact.title}</div>
                  {artifact.location_name && (
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                      📍 {artifact.location_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
