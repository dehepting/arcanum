import { useState } from 'react';
import useStore from '../store/useStore';
import './EntityExplorer.css';

/**
 * EntityExplorer - Left panel showing all entities in the knowledge graph
 * Features:
 * - Search entities across all types
 * - Click entities to open in tabs
 * - Create new entities
 * - Entity type filtering
 */
export default function EntityExplorer() {
  const people = useStore((state) => state.people);
  const events = useStore((state) => state.events);
  const theories = useStore((state) => state.theories);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);
  const addTab = useStore((state) => state.addTab);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    entities: true,
    sources: true,
    visualizations: true,
  });
  const [expandedEntityTypes, setExpandedEntityTypes] = useState({
    people: false,
    events: false,
    theories: false,
    places: false,
    artifacts: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleEntityType = (type) => {
    setExpandedEntityTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Filter entities based on search query
  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTheories = theories.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredArtifacts = artifacts.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalResults =
    filteredPeople.length +
    filteredEvents.length +
    filteredTheories.length +
    filteredPlaces.length +
    filteredArtifacts.length;

  // Handle entity click - opens entity in tab
  const handleEntityClick = (entity, entityType) => {
    addTab({
      type: entityType,
      title: entity.name,
      data: {
        entityId: entity.id,
        entityType,
      },
    });
  };

  // Handle create new entity
  const handleCreateEntity = (entityType) => {
    const titles = {
      person: 'New Person',
      event: 'New Event',
      theory: 'New Theory',
      place: 'New Place',
      artifact: 'New Artifact',
    };

    addTab({
      type: entityType,
      title: titles[entityType],
      data: {
        entityId: null, // Will be created on first save
        entityType,
      },
    });
  };

  return (
    <div className="entity-explorer">
      {/* Search Bar */}
      <div className="explorer-search">
        <input
          type="text"
          placeholder="Search entities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && <div className="search-results-count">{totalResults} results</div>}
      </div>

      {/* Entities Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('entities')}>
          <span className="section-icon">{expandedSections.entities ? '▼' : '▶'}</span>
          <span className="section-title">📁 Entities</span>
        </div>
        {expandedSections.entities && (
          <div className="section-content">
            {/* People */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('people')}
            >
              <span className="section-icon">{expandedEntityTypes.people ? '▼' : '▶'}</span>
              <span className="entity-icon">👤</span>
              <span className="entity-label">People</span>
              <span className="entity-count">
                ({searchQuery ? filteredPeople.length : people.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.people) && (
              <>
                {(searchQuery ? filteredPeople.slice(0, 10) : filteredPeople).map((person) => (
                  <div
                    key={person.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(person, 'person')}
                    title={`Open ${person.name}`}
                  >
                    <span className="entity-result-icon">👤</span>
                    <span className="entity-result-name">{person.name}</span>
                  </div>
                ))}
                {!searchQuery && (
                  <button
                    className="create-entity-btn"
                    onClick={() => handleCreateEntity('person')}
                  >
                    + Create Person
                  </button>
                )}
              </>
            )}

            {/* Events */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('events')}
            >
              <span className="section-icon">{expandedEntityTypes.events ? '▼' : '▶'}</span>
              <span className="entity-icon">📅</span>
              <span className="entity-label">Events</span>
              <span className="entity-count">
                ({searchQuery ? filteredEvents.length : events.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.events) && (
              <>
                {(searchQuery ? filteredEvents.slice(0, 10) : filteredEvents).map((event) => (
                  <div
                    key={event.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(event, 'event')}
                    title={`Open ${event.name}`}
                  >
                    <span className="entity-result-icon">📅</span>
                    <span className="entity-result-name">{event.name}</span>
                  </div>
                ))}
                {!searchQuery && (
                  <button className="create-entity-btn" onClick={() => handleCreateEntity('event')}>
                    + Create Event
                  </button>
                )}
              </>
            )}

            {/* Theories */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('theories')}
            >
              <span className="section-icon">{expandedEntityTypes.theories ? '▼' : '▶'}</span>
              <span className="entity-icon">💡</span>
              <span className="entity-label">Theories</span>
              <span className="entity-count">
                ({searchQuery ? filteredTheories.length : theories.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.theories) && (
              <>
                {(searchQuery ? filteredTheories.slice(0, 10) : filteredTheories).map((theory) => (
                  <div
                    key={theory.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(theory, 'theory')}
                    title={`Open ${theory.name}`}
                  >
                    <span className="entity-result-icon">💡</span>
                    <span className="entity-result-name">{theory.name}</span>
                  </div>
                ))}
                {!searchQuery && (
                  <button
                    className="create-entity-btn"
                    onClick={() => handleCreateEntity('theory')}
                  >
                    + Create Theory
                  </button>
                )}
              </>
            )}

            {/* Places */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('places')}
            >
              <span className="section-icon">{expandedEntityTypes.places ? '▼' : '▶'}</span>
              <span className="entity-icon">📍</span>
              <span className="entity-label">Places</span>
              <span className="entity-count">
                ({searchQuery ? filteredPlaces.length : places.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.places) && (
              <>
                {(searchQuery ? filteredPlaces.slice(0, 10) : filteredPlaces).map((place) => (
                  <div
                    key={place.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(place, 'place')}
                    title={`Open ${place.name}`}
                  >
                    <span className="entity-result-icon">📍</span>
                    <span className="entity-result-name">{place.name}</span>
                  </div>
                ))}
                {!searchQuery && (
                  <button className="create-entity-btn" onClick={() => handleCreateEntity('place')}>
                    + Create Place
                  </button>
                )}
              </>
            )}

            {/* Artifacts */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('artifacts')}
            >
              <span className="section-icon">{expandedEntityTypes.artifacts ? '▼' : '▶'}</span>
              <span className="entity-icon">🏺</span>
              <span className="entity-label">Artifacts</span>
              <span className="entity-count">
                ({searchQuery ? filteredArtifacts.length : artifacts.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.artifacts) && (
              <>
                {(searchQuery ? filteredArtifacts.slice(0, 10) : filteredArtifacts).map(
                  (artifact) => (
                    <div
                      key={artifact.id}
                      className="entity-result"
                      onClick={() => handleEntityClick(artifact, 'artifact')}
                      title={`Open ${artifact.name}`}
                    >
                      <span className="entity-result-icon">🏺</span>
                      <span className="entity-result-name">{artifact.name}</span>
                    </div>
                  )
                )}
                {!searchQuery && (
                  <button
                    className="create-entity-btn"
                    onClick={() => handleCreateEntity('artifact')}
                  >
                    + Create Artifact
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Sources Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('sources')}>
          <span className="section-icon">{expandedSections.sources ? '▼' : '▶'}</span>
          <span className="section-title">📄 Sources</span>
        </div>
        {expandedSections.sources && (
          <div className="section-content">
            <div className="placeholder-text">No sources yet</div>
            <button className="add-source-btn">+ Add Source</button>
          </div>
        )}
      </div>

      {/* Visualizations Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('visualizations')}>
          <span className="section-icon">{expandedSections.visualizations ? '▼' : '▶'}</span>
          <span className="section-title">📊 Visualize</span>
        </div>
        {expandedSections.visualizations && (
          <div className="section-content">
            <div className="viz-item">
              <span className="viz-icon">🕐</span>
              <span className="viz-label">Timeline</span>
            </div>
            <div className="viz-item">
              <span className="viz-icon">🔗</span>
              <span className="viz-label">Evidence Chain</span>
            </div>
            <div className="viz-item">
              <span className="viz-icon">🕸️</span>
              <span className="viz-label">Network Graph</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
