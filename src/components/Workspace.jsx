import useStore from '../store/useStore';
import MapView from './MapView';
import PDFView from './PDFView';
import Sidebar from './Sidebar';

export default function Workspace() {
  const mapView = useStore((state) => state.mapView);

  return (
    <div className="workspace">
      <div className="main-pane">
        {mapView === 'map' ? <MapView /> : <PDFView />}
      </div>
      <Sidebar />
    </div>
  );
}
