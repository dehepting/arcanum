import useStore from '../store/useStore';
import MapView from './MapView';
import PDFView from './PDFView';
import Sidebar from './Sidebar';
import IDEWorkspace from './IDEWorkspace';

export default function Workspace() {
  const mapView = useStore((state) => state.mapView);

  // Left Panel: Entity Explorer (placeholder for now)
  const leftPanel = (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search entities..."
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', color: '#666' }}>
          📁 Entities
        </div>
        <div style={{ paddingLeft: '12px', fontSize: '13px', lineHeight: '1.8' }}>
          <div>👤 People (0)</div>
          <div>📅 Events (0)</div>
          <div>💡 Theories (0)</div>
          <div>📍 Places (0)</div>
          <div>🏺 Artifacts (0)</div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', color: '#666' }}>
          📄 Sources
        </div>
        <div style={{ paddingLeft: '12px', fontSize: '13px', lineHeight: '1.8', color: '#999' }}>
          No sources yet
        </div>
      </div>

      <div>
        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', color: '#666' }}>
          📊 Visualize
        </div>
        <div style={{ paddingLeft: '12px', fontSize: '13px', lineHeight: '1.8' }}>
          <div>🕐 Timeline</div>
          <div>🔗 Evidence Chain</div>
          <div>🕸️ Network Graph</div>
        </div>
      </div>
    </div>
  );

  // Center Panel: Main content (Map or PDF)
  const centerPanel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          borderBottom: '1px solid #e0e0e0',
          padding: '8px 12px',
          background: '#fff',
          display: 'flex',
          gap: '4px',
        }}
      >
        <div
          style={{
            padding: '6px 12px',
            background: mapView === 'map' ? '#f0f0f0' : 'transparent',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          📑 Map
        </div>
        <div
          style={{
            padding: '6px 12px',
            background: mapView === 'source' ? '#f0f0f0' : 'transparent',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          📄 PDF
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mapView === 'map' ? <MapView /> : <PDFView />}
      </div>
    </div>
  );

  // Right Panel: Entity Details + Sidebar content
  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #e0e0e0',
          background: '#f8f9fa',
        }}
      >
        <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>No selection</div>
        <div style={{ fontSize: '13px', color: '#666' }}>Select an entity to view details</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Sidebar />
      </div>
    </div>
  );

  return (
    <div className="workspace">
      <IDEWorkspace leftPanel={leftPanel} centerPanel={centerPanel} rightPanel={rightPanel} />
    </div>
  );
}
