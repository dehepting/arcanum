/**
 * Entity Slice Factory for Zustand Store
 * Generates consistent state management for entity types
 * Eliminates ~75 lines of duplicate state patterns
 */

/**
 * Creates a Zustand slice for an entity type
 * @param {string} entityName - Singular entity name (person, event, theory, place, artifact)
 * @param {string} pluralOverride - Optional plural override (e.g., 'people' for 'person')
 * @returns {object} Zustand slice with state and actions
 */
export function createEntitySlice(entityName, pluralOverride = null) {
  const pluralName = pluralOverride || `${entityName}s`;
  const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const capitalizedPlural = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);
  const idParam = `${entityName}Id`;

  return (set) => ({
    // State
    [pluralName]: [],

    // Setter - replace entire array
    [`set${capitalizedPlural}`]: (items) => set({ [pluralName]: items }),

    // Add - append to array
    [`add${capitalizedName}`]: (item) =>
      set((state) => ({
        [pluralName]: [...state[pluralName], item],
      })),

    // Update - update by ID
    [`update${capitalizedName}`]: (id, updates) =>
      set((state) => ({
        [pluralName]: state[pluralName].map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),

    // Remove - filter out by ID
    [`remove${capitalizedName}`]: (id) =>
      set((state) => ({
        [pluralName]: state[pluralName].filter((item) => item.id !== id),
      })),
  });
}

/**
 * Merges multiple entity slices into a single state object
 * @param {Array} slices - Array of slice creator functions
 * @returns {Function} Combined slice creator for Zustand
 */
export function mergeEntitySlices(...slices) {
  return (set, get, api) => {
    const mergedState = {};
    slices.forEach((slice) => {
      Object.assign(mergedState, slice(set, get, api));
    });
    return mergedState;
  };
}
