import { useState, useEffect } from 'react';
import { createPerson } from '../lib/people';
import { createEvent } from '../lib/events';
import { createTheory } from '../lib/theories';
import { createPlace } from '../lib/places';
import useStore from '../store/useStore';
import './EntityReview.css';

/**
 * EntityReview - Review and approve entities before adding to knowledge graph
 * Can be used standalone or with pre-filled data from Claude's analysis
 */
export default function EntityReview({
  annotationId,
  annotationText,
  initialEntities = null,
  onClose,
  onApproved,
}) {
  const currentProject = useStore((state) => state.currentProject);
  const addPerson = useStore((state) => state.addPerson);
  const addEvent = useStore((state) => state.addEvent);
  const addTheory = useStore((state) => state.addTheory);
  const addPlace = useStore((state) => state.addPlace);

  // Entity state
  const [entities, setEntities] = useState({
    people: initialEntities?.people || [],
    events: initialEntities?.events || [],
    theories: initialEntities?.theories || [],
    places: initialEntities?.places || [],
  });

  // Selection state
  const [selectedPeople, setSelectedPeople] = useState(new Set());
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [selectedTheories, setSelectedTheories] = useState(new Set());
  const [selectedPlaces, setSelectedPlaces] = useState(new Set());

  // Editing state
  const [editingEntity, setEditingEntity] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  // Auto-select all entities on load
  useEffect(() => {
    setSelectedPeople(new Set(entities.people.map((_, i) => i)));
    setSelectedEvents(new Set(entities.events.map((_, i) => i)));
    setSelectedTheories(new Set(entities.theories.map((_, i) => i)));
    setSelectedPlaces(new Set(entities.places.map((_, i) => i)));
  }, [entities]);

  const handleAddPerson = () => {
    setEntities((prev) => ({
      ...prev,
      people: [
        ...prev.people,
        {
          name: '',
          role: 'historical_figure',
          birth_year: null,
          death_year: null,
          bio: '',
          relationship_type: 'mentions',
        },
      ],
    }));
  };

  const handleAddEvent = () => {
    setEntities((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          name: '',
          date_year: null,
          date_precision: 'year',
          event_type: 'discovery',
          description: '',
          relationship_type: 'mentions',
        },
      ],
    }));
  };

  const handleAddTheory = () => {
    setEntities((prev) => ({
      ...prev,
      theories: [
        ...prev.theories,
        {
          name: '',
          description: '',
          status: 'active',
          confidence_level: 3,
          relationship_type: 'supports',
        },
      ],
    }));
  };

  const handleAddPlace = () => {
    setEntities((prev) => ({
      ...prev,
      places: [
        ...prev.places,
        {
          name: '',
          lng: 0,
          lat: 0,
          note: '',
        },
      ],
    }));
  };

  const handleRemoveEntity = (type, index) => {
    setEntities((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));

    // Remove from selection
    if (type === 'people')
      setSelectedPeople((prev) => new Set([...prev].filter((i) => i !== index)));
    if (type === 'events')
      setSelectedEvents((prev) => new Set([...prev].filter((i) => i !== index)));
    if (type === 'theories')
      setSelectedTheories((prev) => new Set([...prev].filter((i) => i !== index)));
    if (type === 'places')
      setSelectedPlaces((prev) => new Set([...prev].filter((i) => i !== index)));
  };

  const handleUpdateEntity = (type, index, field, value) => {
    setEntities((prev) => ({
      ...prev,
      [type]: prev[type].map((entity, i) => (i === index ? { ...entity, [field]: value } : entity)),
    }));
  };

  const toggleSelection = (type, index) => {
    const setters = {
      people: setSelectedPeople,
      events: setSelectedEvents,
      theories: setSelectedTheories,
      places: setSelectedPlaces,
    };

    const setter = setters[type];
    setter((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleApprove = async () => {
    if (!currentProject) {
      setError('No project selected');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const createdEntities = {
        people: [],
        events: [],
        theories: [],
        places: [],
      };

      // Create selected people
      for (const index of selectedPeople) {
        const person = entities.people[index];
        if (!person.name.trim()) continue;

        const created = await createPerson(
          {
            project_id: currentProject.id,
            name: person.name,
            role: person.role,
            birth_year: person.birth_year,
            death_year: person.death_year,
            bio: person.bio,
          },
          annotationId,
          person.relationship_type
        );
        createdEntities.people.push(created);
        addPerson(created);
      }

      // Create selected events
      for (const index of selectedEvents) {
        const event = entities.events[index];
        if (!event.name.trim()) continue;

        const created = await createEvent(
          {
            project_id: currentProject.id,
            name: event.name,
            date_year: event.date_year,
            date_precision: event.date_precision,
            event_type: event.event_type,
            description: event.description,
          },
          annotationId,
          event.relationship_type
        );
        createdEntities.events.push(created);
        addEvent(created);
      }

      // Create selected theories
      for (const index of selectedTheories) {
        const theory = entities.theories[index];
        if (!theory.name.trim()) continue;

        const created = await createTheory(
          {
            project_id: currentProject.id,
            name: theory.name,
            description: theory.description,
            status: theory.status,
            confidence_level: theory.confidence_level,
          },
          annotationId,
          theory.relationship_type
        );
        createdEntities.theories.push(created);
        addTheory(created);
      }

      // Create selected places
      for (const index of selectedPlaces) {
        const place = entities.places[index];
        if (!place.name.trim()) continue;

        const created = await createPlace(
          {
            project_id: currentProject.id,
            name: place.name,
            lng: place.lng,
            lat: place.lat,
            note: place.note,
          },
          annotationId
        );
        createdEntities.places.push(created);
        addPlace(created);
      }

      if (onApproved) {
        onApproved(createdEntities);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const totalSelected =
    selectedPeople.size + selectedEvents.size + selectedTheories.size + selectedPlaces.size;

  return (
    <div className="entity-review-overlay" onClick={onClose}>
      <div className="entity-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="entity-review-header">
          <h2>Review Entities</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {annotationText && (
          <div className="annotation-context">
            <strong>From annotation:</strong>
            <p>{annotationText.substring(0, 200)}...</p>
          </div>
        )}

        <div className="entity-review-content">
          {/* People Section */}
          <div className="entity-section">
            <div className="section-header">
              <h3>People ({entities.people.length})</h3>
              <button className="add-btn" onClick={handleAddPerson}>
                + Add Person
              </button>
            </div>
            {entities.people.map((person, index) => (
              <div key={index} className="entity-item">
                <input
                  type="checkbox"
                  checked={selectedPeople.has(index)}
                  onChange={() => toggleSelection('people', index)}
                />
                <div className="entity-fields">
                  <input
                    type="text"
                    placeholder="Name"
                    value={person.name}
                    onChange={(e) => handleUpdateEntity('people', index, 'name', e.target.value)}
                  />
                  <select
                    value={person.role}
                    onChange={(e) => handleUpdateEntity('people', index, 'role', e.target.value)}
                  >
                    <option value="author">Author</option>
                    <option value="historical_figure">Historical Figure</option>
                    <option value="researcher">Researcher</option>
                    <option value="owner">Owner</option>
                    <option value="collector">Collector</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Birth Year"
                    value={person.birth_year || ''}
                    onChange={(e) =>
                      handleUpdateEntity(
                        'people',
                        index,
                        'birth_year',
                        parseInt(e.target.value) || null
                      )
                    }
                  />
                  <select
                    value={person.relationship_type}
                    onChange={(e) =>
                      handleUpdateEntity('people', index, 'relationship_type', e.target.value)
                    }
                  >
                    <option value="mentions">Mentions</option>
                    <option value="authored_by">Authored By</option>
                    <option value="about">About</option>
                  </select>
                </div>
                <button className="remove-btn" onClick={() => handleRemoveEntity('people', index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Events Section */}
          <div className="entity-section">
            <div className="section-header">
              <h3>Events ({entities.events.length})</h3>
              <button className="add-btn" onClick={handleAddEvent}>
                + Add Event
              </button>
            </div>
            {entities.events.map((event, index) => (
              <div key={index} className="entity-item">
                <input
                  type="checkbox"
                  checked={selectedEvents.has(index)}
                  onChange={() => toggleSelection('events', index)}
                />
                <div className="entity-fields">
                  <input
                    type="text"
                    placeholder="Event Name"
                    value={event.name}
                    onChange={(e) => handleUpdateEntity('events', index, 'name', e.target.value)}
                  />
                  <select
                    value={event.event_type}
                    onChange={(e) =>
                      handleUpdateEntity('events', index, 'event_type', e.target.value)
                    }
                  >
                    <option value="disaster">Disaster</option>
                    <option value="discovery">Discovery</option>
                    <option value="publication">Publication</option>
                    <option value="battle">Battle</option>
                    <option value="expedition">Expedition</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Year"
                    value={event.date_year || ''}
                    onChange={(e) =>
                      handleUpdateEntity(
                        'events',
                        index,
                        'date_year',
                        parseInt(e.target.value) || null
                      )
                    }
                  />
                  <select
                    value={event.relationship_type}
                    onChange={(e) =>
                      handleUpdateEntity('events', index, 'relationship_type', e.target.value)
                    }
                  >
                    <option value="mentions">Mentions</option>
                    <option value="describes">Describes</option>
                    <option value="occurred_during">Occurred During</option>
                  </select>
                </div>
                <button className="remove-btn" onClick={() => handleRemoveEntity('events', index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Theories Section */}
          <div className="entity-section">
            <div className="section-header">
              <h3>Theories ({entities.theories.length})</h3>
              <button className="add-btn" onClick={handleAddTheory}>
                + Add Theory
              </button>
            </div>
            {entities.theories.map((theory, index) => (
              <div key={index} className="entity-item">
                <input
                  type="checkbox"
                  checked={selectedTheories.has(index)}
                  onChange={() => toggleSelection('theories', index)}
                />
                <div className="entity-fields">
                  <input
                    type="text"
                    placeholder="Theory Name"
                    value={theory.name}
                    onChange={(e) => handleUpdateEntity('theories', index, 'name', e.target.value)}
                  />
                  <select
                    value={theory.status}
                    onChange={(e) =>
                      handleUpdateEntity('theories', index, 'status', e.target.value)
                    }
                  >
                    <option value="active">Active</option>
                    <option value="debunked">Debunked</option>
                    <option value="proven">Proven</option>
                    <option value="historical">Historical</option>
                  </select>
                  <select
                    value={theory.confidence_level}
                    onChange={(e) =>
                      handleUpdateEntity(
                        'theories',
                        index,
                        'confidence_level',
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                  <select
                    value={theory.relationship_type}
                    onChange={(e) =>
                      handleUpdateEntity('theories', index, 'relationship_type', e.target.value)
                    }
                  >
                    <option value="supports">Supports</option>
                    <option value="contradicts">Contradicts</option>
                    <option value="mentions">Mentions</option>
                  </select>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveEntity('theories', index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Places Section */}
          <div className="entity-section">
            <div className="section-header">
              <h3>Places ({entities.places.length})</h3>
              <button className="add-btn" onClick={handleAddPlace}>
                + Add Place
              </button>
            </div>
            {entities.places.map((place, index) => (
              <div key={index} className="entity-item">
                <input
                  type="checkbox"
                  checked={selectedPlaces.has(index)}
                  onChange={() => toggleSelection('places', index)}
                />
                <div className="entity-fields">
                  <input
                    type="text"
                    placeholder="Place Name"
                    value={place.name}
                    onChange={(e) => handleUpdateEntity('places', index, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Longitude"
                    step="0.000001"
                    value={place.lng}
                    onChange={(e) =>
                      handleUpdateEntity('places', index, 'lng', parseFloat(e.target.value) || 0)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Latitude"
                    step="0.000001"
                    value={place.lat}
                    onChange={(e) =>
                      handleUpdateEntity('places', index, 'lat', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <button className="remove-btn" onClick={() => handleRemoveEntity('places', index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="entity-review-footer">
          <div className="selection-summary">
            {totalSelected} {totalSelected === 1 ? 'entity' : 'entities'} selected
          </div>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button
              className="approve-btn"
              onClick={handleApprove}
              disabled={isCreating || totalSelected === 0}
            >
              {isCreating
                ? 'Creating...'
                : `Create ${totalSelected} ${totalSelected === 1 ? 'Entity' : 'Entities'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
