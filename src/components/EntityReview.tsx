import { useState, useEffect, ReactNode } from 'react';
import { createPerson } from '../lib/people';
import { createEvent } from '../lib/events';
import { createTheory } from '../lib/theories';
import { createPlace } from '../lib/places';
import useStore from '../store/useStore';
import EntityReviewSection from './EntityReviewSection';
import '../styles/entity.css';

interface PersonDraft {
  name: string;
  role: string;
  birth_year: number | null;
  death_year?: number | null;
  bio?: string;
  relationship_type: string;
}

interface EventDraft {
  name: string;
  date_year: number | null;
  date_precision: string;
  event_type: string;
  description: string;
  relationship_type: string;
}

interface TheoryDraft {
  name: string;
  description: string;
  status: string;
  confidence_level: number;
  relationship_type: string;
}

interface PlaceDraft {
  name: string;
  lng: number;
  lat: number;
  note?: string;
}

interface InitialEntities {
  people?: PersonDraft[];
  events?: EventDraft[];
  theories?: TheoryDraft[];
  places?: PlaceDraft[];
}

interface CreatedEntities {
  people: any[];
  events: any[];
  theories: any[];
  places: any[];
}

interface EntityReviewProps {
  annotationId?: string;
  annotationText?: string;
  initialEntities?: InitialEntities | null;
  onClose: () => void;
  onApproved?: (entities: CreatedEntities) => void;
}

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
}: EntityReviewProps) {
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
  const [selectedPeople, setSelectedPeople] = useState(new Set<number>());
  const [selectedEvents, setSelectedEvents] = useState(new Set<number>());
  const [selectedTheories, setSelectedTheories] = useState(new Set<number>());
  const [selectedPlaces, setSelectedPlaces] = useState(new Set<number>());

  // Editing state
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleRemoveEntity = (type: string, index: number) => {
    setEntities((prev) => ({
      ...prev,
      [type]: (prev as any)[type].filter((_: any, i: number) => i !== index),
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

  const handleUpdateEntity = (type: string, index: number, field: string, value: any) => {
    setEntities((prev) => ({
      ...prev,
      [type]: (prev as any)[type].map((entity: any, i: number) =>
        i === index ? { ...entity, [field]: value } : entity
      ),
    }));
  };

  const toggleSelection = (type: string, index: number) => {
    const setters: Record<string, any> = {
      people: setSelectedPeople,
      events: setSelectedEvents,
      theories: setSelectedTheories,
      places: setSelectedPlaces,
    };

    const setter = setters[type];
    setter((prev: Set<number>) => {
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
      const createdEntities: CreatedEntities = {
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
          } as any,
          annotationId as any,
          person.relationship_type as any
        );
        createdEntities.people.push(created);
        addPerson(created);
      }

      // Create selected events
      for (const index of selectedEvents) {
        const event = entities.events[index];
        if (!event.name.trim()) continue;

        const created = await (createEvent as any)(
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

        const created = await (createTheory as any)(
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
          } as any,
          annotationId as any
        );
        createdEntities.places.push(created);
        addPlace(created);
      }

      if (onApproved) {
        onApproved(createdEntities);
      }

      onClose();
    } catch (err) {
      setError((err as Error).message);
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
          <EntityReviewSection
            title="People"
            singularLabel="Person"
            entities={entities.people}
            selected={selectedPeople}
            onAdd={handleAddPerson}
            onToggle={toggleSelection}
            onUpdate={handleUpdateEntity}
            onRemove={handleRemoveEntity}
            entityType="people"
            renderFields={(person: PersonDraft, index: number): ReactNode => (
              <>
                <input
                  type="text"
                  placeholder="Name *"
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
              </>
            )}
          />

          {/* Events Section */}
          <EntityReviewSection
            title="Events"
            singularLabel="Event"
            entities={entities.events}
            selected={selectedEvents}
            onAdd={handleAddEvent}
            onToggle={toggleSelection}
            onUpdate={handleUpdateEntity}
            onRemove={handleRemoveEntity}
            entityType="events"
            renderFields={(event: EventDraft, index: number): ReactNode => (
              <>
                <input
                  type="text"
                  placeholder="Event Name *"
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
              </>
            )}
          />

          {/* Theories Section */}
          <EntityReviewSection
            title="Theories"
            singularLabel="Theory"
            entities={entities.theories}
            selected={selectedTheories}
            onAdd={handleAddTheory}
            onToggle={toggleSelection}
            onUpdate={handleUpdateEntity}
            onRemove={handleRemoveEntity}
            entityType="theories"
            renderFields={(theory: TheoryDraft, index: number): ReactNode => (
              <>
                <input
                  type="text"
                  placeholder="Theory Name *"
                  value={theory.name}
                  onChange={(e) => handleUpdateEntity('theories', index, 'name', e.target.value)}
                />
                <select
                  value={theory.status}
                  onChange={(e) => handleUpdateEntity('theories', index, 'status', e.target.value)}
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
              </>
            )}
          />

          {/* Places Section */}
          <EntityReviewSection
            title="Places"
            singularLabel="Place"
            entities={entities.places}
            selected={selectedPlaces}
            onAdd={handleAddPlace}
            onToggle={toggleSelection}
            onUpdate={handleUpdateEntity}
            onRemove={handleRemoveEntity}
            entityType="places"
            renderFields={(place: PlaceDraft, index: number): ReactNode => (
              <>
                <input
                  type="text"
                  placeholder="Place Name *"
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
              </>
            )}
          />
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
