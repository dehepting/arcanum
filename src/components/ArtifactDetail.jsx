import { useState } from 'react';
import useStore from '../store/useStore';
import { deleteArtifact } from '../lib/artifacts';
import ProvenanceTimeline from './ProvenanceTimeline';
import ProvenanceForm from './ProvenanceForm';
import ClaimsList from './ClaimsList';

const CATEGORY_ICONS = {
  'Pottery & Ceramics': '🏺',
  'Coins & Currency': '💰',
  'Sculptures & Statues': '🗿',
  'Paintings & Frescoes': '🎨',
  'Manuscripts & Documents': '📜',
  'Jewelry & Ornaments': '💎',
  Architecture: '🏛️',
  'Weaponry & Armor': '⚔️',
  Textiles: '🧵',
  'Religious Artifacts': '✝️',
  Other: '📦',
};

export default function ArtifactDetail({ artifact, onBack, onEdit }) {
  const [activeTab, setActiveTab] = useState('details');
  const [showProvenanceForm, setShowProvenanceForm] = useState(false);
  const [editingProvenance, setEditingProvenance] = useState(null);

  const removeArtifact = useStore((state) => state.removeArtifact);
  const setMapView = useStore((state) => state.setMapView);

  const handleDelete = async () => {
    if (!confirm(`Delete artifact "${artifact.name}"?`)) return;

    try {
      await deleteArtifact(artifact.id, artifact.image_urls);
      removeArtifact(artifact.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete artifact:', err);
      alert(`Failed to delete artifact: ${err.message}`);
    }
  };

  const handleViewOnMap = () => {
    if (!artifact.findspot) return;

    setMapView('map');
    // Store findspot for MapView to fly to
    useStore.getState().flyToPlace = artifact.findspot;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '16px',
          }}
        >
          ←
        </button>
        <span style={{ flex: 1 }}>Artifact Details</span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)',
        }}
      >
        {['details', 'provenance', 'claims'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === tab ? 'var(--panel-2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {tab}
            {tab === 'claims' && artifact.has_disputed_ownership && (
              <span style={{ marginLeft: '4px', color: 'var(--accent)' }}>⚠️</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'details' && (
          <div style={{ padding: '16px' }}>
            {/* Images */}
            {artifact.image_urls && artifact.image_urls.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid var(--line)',
                  }}
                >
                  <img
                    src={artifact.image_urls[0]}
                    alt={artifact.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                {artifact.image_urls.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px', overflowX: 'auto' }}>
                    {artifact.image_urls.slice(1).map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--line)',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={url}
                          alt={`${artifact.name} ${idx + 2}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div
              style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '16px' }}
            >
              <div style={{ fontSize: '32px', flexShrink: 0 }}>
                {CATEGORY_ICONS[artifact.category] || '📦'}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: '0 0 4px',
                    fontSize: '16px',
                    fontFamily: 'IBM Plex Serif, serif',
                  }}
                >
                  {artifact.name}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {artifact.category}
                </div>
              </div>
            </div>

            {/* Period & Age */}
            {(artifact.period || artifact.estimated_age) && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'var(--panel)',
                  borderRadius: '6px',
                }}
              >
                {artifact.period && (
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Period:</span> {artifact.period}
                  </div>
                )}
                {artifact.estimated_age && (
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Age:</span>{' '}
                    {artifact.estimated_age}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {artifact.description && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  Description
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{artifact.description}</div>
              </div>
            )}

            {/* Findspot */}
            {artifact.findspot && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  Findspot
                </div>
                <button
                  onClick={handleViewOnMap}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>📍</span>
                  <span style={{ flex: 1 }}>{artifact.findspot.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    View on map →
                  </span>
                </button>
              </div>
            )}

            {/* Current Status */}
            {(artifact.current_owner || artifact.current_location) && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  Current Status
                </div>
                <div style={{ fontSize: '13px' }}>
                  {artifact.current_owner && (
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: 'var(--accent-2)' }}>{artifact.current_owner}</span>
                      {artifact.owner_type && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {' '}
                          ({artifact.owner_type})
                        </span>
                      )}
                    </div>
                  )}
                  {artifact.current_location && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {artifact.current_location}
                    </div>
                  )}
                  {artifact.accession_number && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                      Acc. No.: {artifact.accession_number}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Physical Properties */}
            {(artifact.material || artifact.dimensions || artifact.condition) && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  Physical Properties
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.8 }}>
                  {artifact.material && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Material:</span>{' '}
                      {artifact.material}
                    </div>
                  )}
                  {artifact.dimensions && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Dimensions:</span>{' '}
                      {artifact.dimensions}
                    </div>
                  )}
                  {artifact.condition && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Condition:</span>{' '}
                      <span style={{ textTransform: 'capitalize' }}>{artifact.condition}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {artifact.notes && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  Notes
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  {artifact.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'provenance' && (
          <ProvenanceTimeline
            artifactId={artifact.id}
            onEdit={(entry) => {
              setEditingProvenance(entry);
              setShowProvenanceForm(true);
            }}
          />
        )}

        {activeTab === 'claims' && <ClaimsList artifactId={artifact.id} />}
      </div>

      {/* Actions */}
      <div
        style={{ padding: '12px', borderTop: '1px solid var(--line)', display: 'flex', gap: '8px' }}
      >
        <button onClick={onEdit} className="btn" style={{ flex: 1 }}>
          Edit
        </button>
        <button
          onClick={handleDelete}
          style={{
            flex: 1,
            background: 'var(--panel)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>

      {/* Provenance Form Modal */}
      <ProvenanceForm
        artifactId={artifact.id}
        entry={editingProvenance}
        isOpen={showProvenanceForm}
        onClose={() => {
          setShowProvenanceForm(false);
          setEditingProvenance(null);
        }}
        onSaved={() => {
          window.location.reload(); // Quick reload for now
        }}
      />
    </div>
  );
}
