import useStore from '../store/useStore';

export default function Tabs() {
  const sources = useStore((state) => state.sources);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const mapView = useStore((state) => state.mapView);
  const setActiveSource = useStore((state) => state.setActiveSource);
  const setMapView = useStore((state) => state.setMapView);
  const removeSource = useStore((state) => state.removeSource);

  const handleAddPDF = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // TODO: Upload to Supabase Storage and add to sources
      console.log('Upload PDF:', file.name);
    };
    input.click();
  };

  return (
    <div className="tabs">
      <button
        className={`tab ${mapView === 'map' ? 'active' : ''}`}
        onClick={() => setMapView('map')}
      >
        🗺️ Map
      </button>

      {sources.map((source) => (
        <button
          key={source.id}
          className={`tab ${activeSourceId === source.id && mapView === 'source' ? 'active' : ''}`}
          onClick={() => {
            setActiveSource(source.id);
            setMapView('source');
          }}
        >
          {source.title}
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              removeSource(source.id);
            }}
          >
            ×
          </button>
        </button>
      ))}

      <button className="add-tab" onClick={handleAddPDF}>
        + PDF
      </button>
    </div>
  );
}
