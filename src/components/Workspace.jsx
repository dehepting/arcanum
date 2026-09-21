import useStore from '../store/useStore';
import MapView from './MapView';
import PDFView from './PDFView';
import Sidebar from './Sidebar';
import IDEWorkspace from './IDEWorkspace';
import EntityExplorer from './EntityExplorer';
import Tabs from './Tabs';

export default function Workspace() {
  const mapView = useStore((state) => state.mapView);

  // Center Panel: Main content (Map or PDF) with tab bar
  const centerPanel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs />
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
      <IDEWorkspace
        leftPanel={<EntityExplorer />}
        centerPanel={centerPanel}
        rightPanel={rightPanel}
      />
    </div>
  );
}
