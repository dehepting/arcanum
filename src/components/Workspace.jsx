import useStore from '../store/useStore';
import MapView from './MapView';
import PDFView from './PDFView';
import Sidebar from './Sidebar';
import IDEWorkspace from './IDEWorkspace';
import EntityExplorer from './EntityExplorer';
import EntityDetailPanel from './EntityDetailPanel';
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

  // Right Panel: Sidebar with integrated artifact details
  const selectedArtifact = useStore((state) => state.selectedArtifact);

  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Only show EntityDetailPanel if an artifact is NOT selected (future: for other entities) */}
      {!selectedArtifact && (
        <div style={{ flex: '0 0 300px', borderBottom: '1px solid var(--border-default)' }}>
          <EntityDetailPanel />
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
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
