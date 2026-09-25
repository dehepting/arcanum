import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import useStore from '../store/useStore';
import './AdvancedSearch.css';

export default function AdvancedSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [entityTypes, setEntityTypes] = useState({
    people: true,
    events: true,
    theories: true,
    places: true,
    artifacts: true,
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const currentProject = useStore((state) => state.currentProject);
  const addTab = useStore((state) => state.addTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !currentProject) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const selectedTypes = Object.entries(entityTypes)
          .filter(([_, enabled]) => enabled)
          .map(([type, _]) => type);

        if (selectedTypes.length === 0) {
          setResults([]);
          setIsSearching(false);
          return;
        }

        const searchResults = await invoke('search_entities', {
          input: {
            project_id: currentProject.id,
            query: query.trim(),
            entity_types: selectedTypes,
            limit: 50,
          },
        });

        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, entityTypes, currentProject]);

  const handleOpenEntity = (result) => {
    // Map entity type to singular form for tab type
    const typeMapping = {
      people: 'person',
      events: 'event',
      theories: 'theory',
      places: 'place',
      artifacts: 'artifact',
    };

    const tabType = typeMapping[result.entity_type] || result.entity_type;

    addTab({
      type: tabType,
      title: result.name,
      data: {
        entityId: result.id,
        entityType: result.entity_type,
      },
    });
    onClose();
  };

  const handleToggleEntityType = (type) => {
    setEntityTypes({
      ...entityTypes,
      [type]: !entityTypes[type],
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasAnyTypeEnabled = Object.values(entityTypes).some((enabled) => enabled);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content advanced-search-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2>Advanced Search</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Search Input */}
          <input
            type="text"
            className="search-input"
            placeholder="Search across all entities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          {/* Entity Type Filters */}
          <div className="filter-section">
            <label className="filter-label">Entity Types:</label>
            <div className="filter-checkboxes">
              {Object.keys(entityTypes).map((type) => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={entityTypes[type]}
                    onChange={() => handleToggleEntityType(type)}
                  />
                  <span className="entity-type-name">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="search-results">
            {isSearching && <div className="loading">Searching...</div>}

            {!isSearching && !hasAnyTypeEnabled && (
              <div className="no-results">Please select at least one entity type</div>
            )}

            {!isSearching && hasAnyTypeEnabled && results.length === 0 && query && (
              <div className="no-results">No results found</div>
            )}

            {!isSearching && hasAnyTypeEnabled && results.length === 0 && !query && (
              <div className="no-results">Enter a search query to find entities</div>
            )}

            {!isSearching &&
              results.map((result) => (
                <div
                  key={`${result.entity_type}-${result.id}`}
                  className="search-result-item"
                  onClick={() => handleOpenEntity(result)}
                >
                  <div className="result-header">
                    <span className={`entity-type-badge ${result.entity_type}`}>
                      {result.entity_type}
                    </span>
                    <span className="result-name">{result.name}</span>
                  </div>
                  <div
                    className="result-snippet"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="modal-footer">
          <div className="keyboard-hint">Press ESC to close</div>
        </div>
      </div>
    </div>
  );
}
