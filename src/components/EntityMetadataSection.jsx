import { getEntityTypeConfig } from '../config/entityTypes';
import LocationEditor from './LocationEditor';
import './EntityMetadataSection.css';

/**
 * EntityMetadataSection - Displays metadata for any entity type
 * Uses entity type configuration to show appropriate fields
 */
export default function EntityMetadataSection({
  entityType,
  entityData,
  entityId,
  entityTitle,
  onLocationChange,
  onSetOnMap,
  saving,
}) {
  if (!entityData) return null;

  const config = getEntityTypeConfig(entityType);

  return (
    <div className="entity-metadata">
      {/* Render metadata fields based on entity type config */}
      {config.metadataFields.map((field) => {
        const value = entityData[field.key];
        if (!value) return null;

        return (
          <div key={field.key} className="metadata-field">
            <strong>{field.label}:</strong> {value}
          </div>
        );
      })}

      {/* Location editor if entity type supports it */}
      {config.hasLocation && (
        <div className="metadata-field location-field">
          <LocationEditor
            lat={entityData.lat}
            lng={entityData.lng}
            entityId={entityId}
            entityType={entityType}
            entityTitle={entityTitle}
            onLocationChange={onLocationChange}
            onSetOnMap={onSetOnMap}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}
