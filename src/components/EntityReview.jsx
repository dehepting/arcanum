import { useState } from 'react';
import { createPerson } from '../lib/people';
import { createEvent } from '../lib/events';
import { createTheory } from '../lib/theories';
import { createPlace } from '../lib/places';
import useStore from '../store/useStore';
import { useEntityReviewForm } from '../hooks/useEntityReviewForm';
import EntitySection from './EntitySection';
import { showError } from '../utils/errorHandling';
import './EntityReview.css';

/**
 * EntityReview - Review and approve entities before adding to knowledge graph
 * Refactored to use configuration-based components and custom hooks
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

  // Use custom hook for entity form management
  const {
    entities,
    selectedIndices,
    addEntity,
    removeEntity,
    updateEntity,
    toggleSelection,
    getTotalSelected,
  } = useEntityReviewForm(initialEntities);

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

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
      for (const index of selectedIndices.people) {
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
      for (const index of selectedIndices.events) {
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
      for (const index of selectedIndices.theories) {
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
      for (const index of selectedIndices.places) {
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
      showError(`Failed to create entities: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const totalSelected = getTotalSelected();

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
          <EntitySection
            entityType="person"
            entities={entities.people}
            selectedIndices={selectedIndices.people}
            onToggleSelection={(index) => toggleSelection('people', index)}
            onUpdate={(index, field, value) => updateEntity('people', index, field, value)}
            onRemove={(index) => removeEntity('people', index)}
            onAdd={() => addEntity('people')}
          />

          {/* Events Section */}
          <EntitySection
            entityType="event"
            entities={entities.events}
            selectedIndices={selectedIndices.events}
            onToggleSelection={(index) => toggleSelection('events', index)}
            onUpdate={(index, field, value) => updateEntity('events', index, field, value)}
            onRemove={(index) => removeEntity('events', index)}
            onAdd={() => addEntity('events')}
          />

          {/* Theories Section */}
          <EntitySection
            entityType="theory"
            entities={entities.theories}
            selectedIndices={selectedIndices.theories}
            onToggleSelection={(index) => toggleSelection('theories', index)}
            onUpdate={(index, field, value) => updateEntity('theories', index, field, value)}
            onRemove={(index) => removeEntity('theories', index)}
            onAdd={() => addEntity('theories')}
          />

          {/* Places Section */}
          <EntitySection
            entityType="place"
            entities={entities.places}
            selectedIndices={selectedIndices.places}
            onToggleSelection={(index) => toggleSelection('places', index)}
            onUpdate={(index, field, value) => updateEntity('places', index, field, value)}
            onRemove={(index) => removeEntity('places', index)}
            onAdd={() => addEntity('places')}
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
