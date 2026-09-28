import { useCallback } from 'react';
import './LocationEditor.css';

/**
 * LocationEditor - Reusable location editing component
 * Handles latitude/longitude input with validation and map integration
 */
export default function LocationEditor({
  lat,
  lng,
  entityId,
  entityType,
  entityTitle,
  onLocationChange,
  onSetOnMap,
  saving,
}) {
  const validateCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;

    if (type === 'lat') {
      return Math.max(-90, Math.min(90, num));
    } else {
      return Math.max(-180, Math.min(180, num));
    }
  };

  const handleChange = useCallback(
    (field, value) => {
      const validated = validateCoordinate(value, field);
      onLocationChange(field, validated);
    },
    [onLocationChange]
  );

  return (
    <div className="location-editor">
      <strong>Location:</strong>
      <div className="location-inputs">
        <input
          type="number"
          step="0.0001"
          placeholder="Latitude (-90 to 90)"
          value={lat || ''}
          onChange={(e) => handleChange('lat', e.target.value)}
          disabled={saving}
          min="-90"
          max="90"
          title="Latitude must be between -90 and 90"
        />
        <input
          type="number"
          step="0.0001"
          placeholder="Longitude (-180 to 180)"
          value={lng || ''}
          onChange={(e) => handleChange('lng', e.target.value)}
          disabled={saving}
          min="-180"
          max="180"
          title="Longitude must be between -180 and 180"
        />
        <button
          onClick={() => onSetOnMap()}
          className="set-on-map-btn"
          disabled={saving}
          title="Click on the map to set location"
        >
          📍 Set on Map
        </button>
      </div>
    </div>
  );
}
