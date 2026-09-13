import { useState } from 'react';
import useStore from '../store/useStore';
import { uploadPDF, deleteSource } from '../lib/upload';

export default function Tabs() {
  const [uploading, setUploading] = useState(false);
  const sources = useStore((state) => state.sources);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const mapView = useStore((state) => state.mapView);
  const currentProject = useStore((state) => state.currentProject);
  const setActiveSource = useStore((state) => state.setActiveSource);
  const setMapView = useStore((state) => state.setMapView);
  const removeSource = useStore((state) => state.removeSource);
  const addSource = useStore((state) => state.addSource);

  const handleAddPDF = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      try {
        const source = await uploadPDF(file, currentProject.id);
        addSource(source);
        setMapView('source');
      } catch (err) {
        console.error('Upload error:', err);
        alert(`Failed to upload PDF: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleDeleteSource = async (source) => {
    if (!confirm(`Delete "${source.title}"?`)) return;

    try {
      await deleteSource(source.id, source.file_url);
      removeSource(source.id);
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Failed to delete PDF: ${err.message}`);
    }
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
              handleDeleteSource(source);
            }}
          >
            ×
          </button>
        </button>
      ))}

      <button className="add-tab" onClick={handleAddPDF} disabled={uploading}>
        {uploading ? '⏳ Uploading...' : '+ PDF'}
      </button>
    </div>
  );
}
