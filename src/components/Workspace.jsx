import useStore from '../store/useStore';
import MapView from './MapView';
import PDFView from './PDFView';
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

  return (
    <div className="workspace">
      <IDEWorkspace leftPanel={<EntityExplorer />} centerPanel={centerPanel} />
    </div>
  );
}
