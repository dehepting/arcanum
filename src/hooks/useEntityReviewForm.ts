import { useState, useRef, useEffect } from 'react';
import { createDefaultEntity } from '@/config/entityTypes';
import type { EntityType } from '@/types';

/**
 * Plural entity keys used in the store
 */
export type EntityPluralKey = 'people' | 'events' | 'theories' | 'places' | 'artifacts';

/**
 * Map plural entity keys to singular entity type names
 */
const ENTITY_KEYS: Record<EntityPluralKey, EntityType> = {
  people: 'person',
  events: 'event',
  theories: 'theory',
  places: 'place',
  artifacts: 'artifact',
};

/**
 * Entity collections by plural key
 */
export type EntityCollections = Record<
  EntityPluralKey,
  Array<Record<string, string | number | null>>
>;

/**
 * Selection indices by entity type
 */
export type SelectionIndices = Record<EntityPluralKey, Set<number>>;

/**
 * useEntityReviewForm hook return type
 */
export interface UseEntityReviewFormReturn {
  entities: EntityCollections;
  selectedIndices: SelectionIndices;
  addEntity: (type: EntityPluralKey) => void;
  removeEntity: (type: EntityPluralKey, index: number) => void;
  updateEntity: (
    type: EntityPluralKey,
    index: number,
    field: string,
    value: string | number | null
  ) => void;
  toggleSelection: (type: EntityPluralKey, index: number) => void;
  getTotalSelected: () => number;
}

/**
 * Custom hook for managing entity review form state
 * Handles entities, selection, and auto-selection of new entities
 *
 * @param initialEntities - Initial entities to populate the form
 * @returns Entity review form state and control functions
 */
export function useEntityReviewForm(
  initialEntities: Partial<EntityCollections> | null = null
): UseEntityReviewFormReturn {
  // Entity state - initialize with provided entities or empty
  const [entities, setEntities] = useState<EntityCollections>(() => {
    const initial = {} as EntityCollections;
    (Object.keys(ENTITY_KEYS) as EntityPluralKey[]).forEach((key) => {
      initial[key] = initialEntities?.[key] || [];
    });
    return initial;
  });

  // Selection state - initialize with all entities selected
  const [selectedIndices, setSelectedIndices] = useState<SelectionIndices>(() => {
    const initial = {} as SelectionIndices;
    (Object.keys(ENTITY_KEYS) as EntityPluralKey[]).forEach((key) => {
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
      (Object.keys(ENTITY_KEYS) as EntityPluralKey[]).forEach((key) => {
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
  const addEntity = (type: EntityPluralKey) => {
    const singularType = ENTITY_KEYS[type];
    setEntities((prev) => ({
      ...prev,
      [type]: [...prev[type], createDefaultEntity(singularType)],
    }));
  };

  /**
   * Remove entity at index
   */
  const removeEntity = (type: EntityPluralKey, index: number) => {
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
  const updateEntity = (
    type: EntityPluralKey,
    index: number,
    field: string,
    value: string | number | null
  ) => {
    setEntities((prev) => ({
      ...prev,
      [type]: prev[type].map((entity, i) => (i === index ? { ...entity, [field]: value } : entity)),
    }));
  };

  /**
   * Toggle entity selection
   */
  const toggleSelection = (type: EntityPluralKey, index: number) => {
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
  const getTotalSelected = (): number => {
    return (Object.keys(ENTITY_KEYS) as EntityPluralKey[]).reduce(
      (sum, key) => sum + selectedIndices[key].size,
      0
    );
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
