/**
 * Entity Slice Factory for Zustand Store
 * Generates consistent state management for entity types
 * Eliminates ~75 lines of duplicate state patterns
 *
 * TypeScript version - simplified to work with dynamic property names
 */

/**
 * Creates a Zustand slice for an entity type
 *
 * @param entityName - Singular entity name (person, event, theory, place, artifact)
 * @param pluralOverride - Optional plural override (e.g., 'people' for 'person')
 * @returns Zustand slice with state and actions
 *
 * @example
 * const peopleSlice = createEntitySlice<Person>('person', 'people');
 * // Results in: people, setPeople, addPerson, updatePerson, removePerson
 */
export function createEntitySlice<T extends { id: string }>(
  entityName: string,
  pluralOverride: string | null = null
) {
  const pluralName = pluralOverride || `${entityName}s`;
  const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const capitalizedPlural = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (set: any) => ({
    // State
    [pluralName]: [] as T[],

    // Setter - replace entire array
    [`set${capitalizedPlural}`]: (items: T[]) => set({ [pluralName]: items }),

    // Add - append to array
    [`add${capitalizedName}`]: (item: T) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set((state: any) => ({
        [pluralName]: [...state[pluralName], item],
      })),

    // Update - update by ID
    [`update${capitalizedName}`]: (id: string, updates: Partial<T>) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set((state: any) => ({
        [pluralName]: state[pluralName].map((item: T) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),

    // Remove - filter out by ID
    [`remove${capitalizedName}`]: (id: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set((state: any) => ({
        [pluralName]: state[pluralName].filter((item: T) => item.id !== id),
      })),
  });
}

/**
 * Merges multiple entity slices into a single state object
 *
 * @param slices - Array of slice creator functions
 * @returns Combined slice creator for Zustand
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeEntitySlices(...slices: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (set: any, get: any, api: any) => {
    const mergedState = {};
    slices.forEach((slice) => {
      Object.assign(mergedState, slice(set, get, api));
    });
    return mergedState;
  };
}
