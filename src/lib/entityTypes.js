/**
 * Centralized entity type registry
 * Eliminates duplication of command mappings, parameter names, and store actions
 * across EntityExplorer, EntityPage, MapView, and other components
 */

/**
 * Entity type configuration
 * Each entity type has consistent naming for commands, parameters, and store actions
 */
export const ENTITY_TYPES = {
  person: {
    singular: 'person',
    plural: 'people',
    label: 'Person',
    labelPlural: 'People',
    icon: '👤',
    color: '#1565c0',
    colorLight: '#e3f2fd',

    // Tauri command names
    commands: {
      get: 'get_person',
      create: 'create_person',
      update: 'update_person',
      delete: 'delete_person',
      list: 'list_people',
    },

    // Parameter names for Tauri commands
    params: {
      id: 'person_id',
      input: 'input',
    },

    // Zustand store keys
    store: {
      collection: 'people',
      setter: 'setPeople',
      adder: 'addPerson',
      updater: 'updatePerson',
      remover: 'removePerson',
    },

    // Fields for forms/display
    fields: {
      name: 'name',
      description: 'description',
      occupation: 'occupation',
      birthDate: 'birth_date',
      deathDate: 'death_date',
    },
  },

  event: {
    singular: 'event',
    plural: 'events',
    label: 'Event',
    labelPlural: 'Events',
    icon: '📅',
    color: '#2e7d32',
    colorLight: '#e8f5e9',

    commands: {
      get: 'get_event',
      create: 'create_event',
      update: 'update_event',
      delete: 'delete_event',
      list: 'list_events',
    },

    params: {
      id: 'event_id',
      input: 'input',
    },

    store: {
      collection: 'events',
      setter: 'setEvents',
      adder: 'addEvent',
      updater: 'updateEvent',
      remover: 'removeEvent',
    },

    fields: {
      name: 'name',
      description: 'description',
      eventDate: 'event_date',
      location: 'location',
    },
  },

  theory: {
    singular: 'theory',
    plural: 'theories',
    label: 'Theory',
    labelPlural: 'Theories',
    icon: '💡',
    color: '#6a1b9a',
    colorLight: '#f3e5f5',

    commands: {
      get: 'get_theory',
      create: 'create_theory',
      update: 'update_theory',
      delete: 'delete_theory',
      list: 'list_theories',
    },

    params: {
      id: 'theory_id',
      input: 'input',
    },

    store: {
      collection: 'theories',
      setter: 'setTheories',
      adder: 'addTheory',
      updater: 'updateTheory',
      remover: 'removeTheory',
    },

    fields: {
      name: 'name',
      description: 'description',
    },
  },

  place: {
    singular: 'place',
    plural: 'places',
    label: 'Place',
    labelPlural: 'Places',
    icon: '📍',
    color: '#c62828',
    colorLight: '#ffebee',

    commands: {
      get: 'get_place',
      create: 'create_place',
      update: 'update_place',
      delete: 'delete_place',
      list: 'list_places',
    },

    params: {
      id: 'place_id',
      input: 'input',
    },

    store: {
      collection: 'places',
      setter: 'setPlaces',
      adder: 'addPlace',
      updater: 'updatePlace',
      remover: 'removePlace',
    },

    fields: {
      name: 'name',
      description: 'description',
      placeType: 'place_type',
    },
  },

  artifact: {
    singular: 'artifact',
    plural: 'artifacts',
    label: 'Artifact',
    labelPlural: 'Artifacts',
    icon: '🏺',
    color: '#e65100',
    colorLight: '#fff3e0',

    commands: {
      get: 'get_artifact',
      create: 'create_artifact',
      update: 'update_artifact',
      delete: 'delete_artifact',
      list: 'list_artifacts',
    },

    params: {
      id: 'artifact_id',
      input: 'input',
    },

    store: {
      collection: 'artifacts',
      setter: 'setArtifacts',
      adder: 'addArtifact',
      updater: 'updateArtifact',
      remover: 'removeArtifact',
    },

    fields: {
      name: 'name',
      description: 'description',
      category: 'category',
      dateRange: 'date_range',
      ownerName: 'owner_name',
      ownerType: 'owner_type',
    },
  },
};

/**
 * Get entity type config by name
 */
export function getEntityType(type) {
  return ENTITY_TYPES[type];
}

/**
 * Get all entity type names
 */
export function getAllEntityTypes() {
  return Object.keys(ENTITY_TYPES);
}

/**
 * Get entity type command name
 */
export function getEntityCommand(type, action) {
  return ENTITY_TYPES[type]?.commands[action];
}

/**
 * Get entity type parameter name
 */
export function getEntityParam(type, paramType) {
  return ENTITY_TYPES[type]?.params[paramType];
}

/**
 * Get entity type store key
 */
export function getEntityStoreKey(type, keyType) {
  return ENTITY_TYPES[type]?.store[keyType];
}

/**
 * Helper to invoke entity commands with proper parameters
 */
export async function invokeEntityCommand(invoke, type, action, data = {}) {
  const config = ENTITY_TYPES[type];
  if (!config) {
    throw new Error(`Unknown entity type: ${type}`);
  }

  const command = config.commands[action];
  if (!command) {
    throw new Error(`Unknown action '${action}' for entity type '${type}'`);
  }

  // Build parameters based on action
  const params = {};

  if (action === 'get' || action === 'delete') {
    params[config.params.id] = data.id;
  } else if (action === 'update') {
    params[config.params.id] = data.id;
    params[config.params.input] = data.input;
  } else if (action === 'create') {
    params[config.params.input] = data.input;
  } else if (action === 'list') {
    params.projectId = data.projectId;
  }

  return await invoke(command, params);
}

/**
 * Get entity from store by type
 */
export function getEntitiesFromStore(store, type) {
  const collectionKey = ENTITY_TYPES[type]?.store.collection;
  return collectionKey ? store[collectionKey] : [];
}

/**
 * Update entity in store by type
 */
export function updateEntityInStore(store, type, entityId, updates) {
  const updaterKey = ENTITY_TYPES[type]?.store.updater;
  if (updaterKey && store[updaterKey]) {
    store[updaterKey](entityId, updates);
  }
}

/**
 * Add entity to store by type
 */
export function addEntityToStore(store, type, entity) {
  const adderKey = ENTITY_TYPES[type]?.store.adder;
  if (adderKey && store[adderKey]) {
    store[adderKey](entity);
  }
}

/**
 * Remove entity from store by type
 */
export function removeEntityFromStore(store, type, entityId) {
  const removerKey = ENTITY_TYPES[type]?.store.remover;
  if (removerKey && store[removerKey]) {
    store[removerKey](entityId);
  }
}
