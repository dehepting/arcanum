import { useState } from 'react';
import useStore from '../store/useStore';

const CATEGORIES = [
  'All',
  'Pottery & Ceramics',
  'Coins & Currency',
  'Sculptures & Statues',
  'Paintings & Frescoes',
  'Manuscripts & Documents',
  'Jewelry & Ornaments',
  'Architecture',
  'Weaponry & Armor',
  'Textiles',
  'Religious Artifacts',
  'Other',
];

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

export default function ArtifactList({ onAddClick, onArtifactClick }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const artifacts = useStore((state) => state.artifacts);

  // Filter artifacts
  const filteredArtifacts = artifacts.filter((artifact) => {
    const matchesCategory = selectedCategory === 'All' || artifact.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      artifact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="sidebar-header">
        <span>Artifacts ({artifacts.length})</span>
        <button
          onClick={onAddClick}
          style={{
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
          }}
          title="Add new artifact"
        >
          + Add
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            padding: '6px 8px',
            borderRadius: '4px',
            marginBottom: '8px',
            font: 'inherit',
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'All' ? `${cat} Categories` : cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search artifacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            padding: '6px 8px',
            borderRadius: '4px',
            font: 'inherit',
          }}
        />
      </div>

      {/* Artifact List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', minHeight: 0 }}>
        {filteredArtifacts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}
          >
            {artifacts.length === 0 ? (
              <>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                <div>No artifacts yet</div>
                <div style={{ marginTop: '4px' }}>Click "+ Add" to create one</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div>No artifacts match your search</div>
              </>
            )}
          </div>
        ) : (
          filteredArtifacts.map((artifact) => (
            <div
              key={artifact.id}
              onClick={() => onArtifactClick(artifact)}
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)';
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ fontSize: '24px', flexShrink: 0 }}>
                  {CATEGORY_ICONS[artifact.category] || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: '13px',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {artifact.name}
                  </div>
                  {artifact.period && (
                    <div
                      style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}
                    >
                      {artifact.period}
                    </div>
                  )}
                  {artifact.current_owner && (
                    <div style={{ fontSize: '11px', color: 'var(--accent-2)' }}>
                      {artifact.current_owner}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
