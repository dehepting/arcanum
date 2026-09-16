import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { createOverlay, uploadOverlay } from '../lib/overlays';

export default function OverlayGeoreference() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [overlayName, setOverlayName] = useState('');
  const [corners, setCorners] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const currentProject = useStore((state) => state.currentProject);
  const overlayMode = useStore((state) => state.overlayMode);
  const closeOverlayMode = useStore((state) => state.closeOverlayMode);
  const addMapOverlay = useStore((state) => state.addMapOverlay);

  useEffect(() => {
    if (!overlayMode) {
      // Reset state when modal closes
      setFile(null);
      setPreviewUrl(null);
      setOverlayName('');
      setCorners([]);
    }
  }, [overlayMode]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setFile(selectedFile);
    setOverlayName(selectedFile.name.replace(/\.[^/.]+$/, ''));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleMapClick = (lngLat) => {
    if (corners.length >= 4) return;

    const newCorner = {
      lng: lngLat.lng,
      lat: lngLat.lat,
      order: corners.length,
    };

    setCorners([...corners, newCorner]);
  };

  const handleSave = async () => {
    if (!file || corners.length !== 4 || !overlayName.trim()) {
      alert('Please upload an image, name it, and place all 4 corner markers');
      return;
    }

    setUploading(true);
    try {
      // Upload image
      const { publicUrl } = await uploadOverlay(file, currentProject.id);

      // Create overlay record
      const overlayData = {
        project_id: currentProject.id,
        name: overlayName.trim(),
        image_url: publicUrl,
        top_left_lat: corners[0].lat,
        top_left_lng: corners[0].lng,
        top_right_lat: corners[1].lat,
        top_right_lng: corners[1].lng,
        bottom_right_lat: corners[2].lat,
        bottom_right_lng: corners[2].lng,
        bottom_left_lat: corners[3].lat,
        bottom_left_lng: corners[3].lng,
        opacity: 0.7,
        visible: true,
      };

      const overlay = await createOverlay(overlayData);
      addMapOverlay(overlay);

      alert('Map overlay created successfully!');
      closeOverlayMode();
    } catch (err) {
      console.error('Failed to create overlay:', err);
      alert(`Failed to create overlay: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!overlayMode) return null;

  // Expose handleMapClick to parent MapView
  useStore.getState().onOverlayMapClick = handleMapClick;

  const cornerLabels = ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'];

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        background: 'var(--panel-2)',
        border: '1px solid var(--line)',
        borderRadius: '8px',
        padding: '16px',
        width: '340px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: '16px',
          fontFamily: 'IBM Plex Serif, serif',
        }}
      >
        Georeference Map Overlay
      </h3>

      {!file ? (
        <>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Upload a historic map image and place corner markers to align it with the modern map.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginBottom: '8px' }}
          >
            Select Map Image
          </button>
          <button
            onClick={closeOverlayMode}
            className="btn"
            style={{ width: '100%', padding: '10px' }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              marginBottom: '12px',
              border: '1px solid var(--line)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <img
              src={previewUrl}
              alt="Overlay preview"
              style={{ width: '100%', display: 'block' }}
            />
          </div>

          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Overlay Name
          </label>
          <input
            type="text"
            value={overlayName}
            onChange={(e) => setOverlayName(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--line)',
              padding: '8px',
              borderRadius: '4px',
              marginBottom: '12px',
              font: 'inherit',
            }}
          />

          <div style={{ marginBottom: '12px' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--accent-2)',
              }}
            >
              Click on the map to place corners:
            </p>
            {cornerLabels.map((label, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 8px',
                  background: corners[idx] ? 'var(--accent)' : 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {idx + 1}. {label}
                </span>
                {corners[idx] ? (
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>
                    {corners[idx].lat.toFixed(4)}, {corners[idx].lng.toFixed(4)}
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>Click map</span>
                )}
              </div>
            ))}
          </div>

          {corners.length > 0 && (
            <button
              onClick={() => setCorners([])}
              style={{
                width: '100%',
                padding: '6px',
                marginBottom: '8px',
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              Reset Corners
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={closeOverlayMode}
              className="btn"
              style={{ flex: 1 }}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={uploading || corners.length !== 4 || !overlayName.trim()}
            >
              {uploading ? 'Uploading...' : 'Save Overlay'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
