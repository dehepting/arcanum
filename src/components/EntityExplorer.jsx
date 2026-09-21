import { useState } from 'react';
import useStore from '../store/useStore';
import './EntityExplorer.css';

/**
 * EntityExplorer - Left panel showing all entities in the knowledge graph
 * Features: search, entity type filtering, source list, visualization links
 */
export default function EntityExplorer() {
  const people = useStore((state) => state.people);
  const events = useStore((state) => state.events);
  const theories = useStore((state) => state.theories);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    entities: true,
    sources: true,
    visualizations: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
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
            <div className="entity-type-item">
              <span className="entity-icon">👤</span>
              <span className="entity-label">People</span>
              <span className="entity-count">
                ({searchQuery ? filteredPeople.length : people.length})
              </span>
            </div>
            {searchQuery &&
              filteredPeople.slice(0, 5).map((person) => (
                <div key={person.id} className="entity-result">
                  {person.name}
                </div>
              ))}

            <div className="entity-type-item">
              <span className="entity-icon">📅</span>
              <span className="entity-label">Events</span>
              <span className="entity-count">
                ({searchQuery ? filteredEvents.length : events.length})
              </span>
            </div>
            {searchQuery &&
              filteredEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="entity-result">
                  {event.name}
                </div>
              ))}

            <div className="entity-type-item">
              <span className="entity-icon">💡</span>
              <span className="entity-label">Theories</span>
              <span className="entity-count">
                ({searchQuery ? filteredTheories.length : theories.length})
              </span>
            </div>
            {searchQuery &&
              filteredTheories.slice(0, 5).map((theory) => (
                <div key={theory.id} className="entity-result">
                  {theory.name}
                </div>
              ))}

            <div className="entity-type-item">
              <span className="entity-icon">📍</span>
              <span className="entity-label">Places</span>
              <span className="entity-count">
                ({searchQuery ? filteredPlaces.length : places.length})
              </span>
            </div>
            {searchQuery &&
              filteredPlaces.slice(0, 5).map((place) => (
                <div key={place.id} className="entity-result">
                  {place.name}
                </div>
              ))}

            <div className="entity-type-item">
              <span className="entity-icon">🏺</span>
              <span className="entity-label">Artifacts</span>
              <span className="entity-count">
                ({searchQuery ? filteredArtifacts.length : artifacts.length})
              </span>
            </div>
            {searchQuery &&
              filteredArtifacts.slice(0, 5).map((artifact) => (
                <div key={artifact.id} className="entity-result">
                  {artifact.name}
                </div>
              ))}
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
