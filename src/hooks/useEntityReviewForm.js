import { useState, useRef, useEffect } from 'react';
import { createDefaultEntity, getEntityTypeConfig } from '../config/entityTypes';

// Map plural entity keys to singular entity type names
const ENTITY_KEYS = {
  people: 'person',
  events: 'event',
  theories: 'theory',
  places: 'place',
  artifacts: 'artifact',
};

/**
 * Custom hook for managing entity review form state
 * Handles entities, selection, and auto-selection of new entities
 */
export function useEntityReviewForm(initialEntities = null) {
  // Entity state - initialize with provided entities or empty
  const [entities, setEntities] = useState(() => {
    const initial = {};
    Object.keys(ENTITY_KEYS).forEach((key) => {
      initial[key] = initialEntities?.[key] || [];
    });
    return initial;
  });

  // Selection state - initialize with all entities selected
  const [selectedIndices, setSelectedIndices] = useState(() => {
    const initial = {};
    Object.keys(ENTITY_KEYS).forEach((key) => {
      initial[key] = new Set((initialEntities?.[key] || []).map((_, i) => i));
    });
    return initial;
  });

  // Track if this is initial mount to avoid re-selecting on entity changes
  const isInitialMount = useRef(true);

  // Auto-select newly added entities
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // When entities change (new ones added), select them
    setSelectedIndices((prev) => {
      const newSelected = { ...prev };
      Object.keys(ENTITY_KEYS).forEach((key) => {
        const newSet = new Set(prev[key]);
        entities[key].forEach((_, i) => {
          if (!prev[key].has(i)) newSet.add(i);
        });
        newSelected[key] = newSet;
      });
      return newSelected;
    });
  }, [entities]);

  /**
   * Add new entity of given type (type is plural key like 'people')
   */
  const addEntity = (type) => {
    const singularType = ENTITY_KEYS[type];
    setEntities((prev) => ({
      ...prev,
      [type]: [...prev[type], createDefaultEntity(singularType)],
    }));
  };

  /**
   * Remove entity at index
   */
  const removeEntity = (type, index) => {
    setEntities((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));

    // Remove from selection
    setSelectedIndices((prev) => ({
      ...prev,
      [type]: new Set([...prev[type]].filter((i) => i !== index)),
    }));
  };

  /**
   * Update entity field
   */
  const updateEntity = (type, index, field, value) => {
    setEntities((prev) => ({
      ...prev,
      [type]: prev[type].map((entity, i) => (i === index ? { ...entity, [field]: value } : entity)),
    }));
  };

  /**
   * Toggle entity selection
   */
  const toggleSelection = (type, index) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev[type]);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return { ...prev, [type]: newSet };
    });
  };

  /**
   * Get total selected count across all types
   */
  const getTotalSelected = () => {
    return Object.keys(ENTITY_KEYS).reduce((sum, key) => sum + selectedIndices[key].size, 0);
  };

  return {
    entities,
    selectedIndices,
    addEntity,
    removeEntity,
    updateEntity,
    toggleSelection,
    getTotalSelected,
  };
}
