/**
 * Entity Command Configuration
 * Centralized mapping of entity types to their Tauri command names and parameter keys
 * Eliminates duplicate command maps across components
 */

import type { EntityType } from '@/types';

/**
 * Command configuration for entity operations
 */
export interface EntityCommand {
  command: string;
  param: string;
}

/**
 * Map of entity types to their command configurations
 */
export type EntityCommandMap = Record<EntityType, EntityCommand>;

/**
 * Command type discriminator
 */
export type CommandType = 'get' | 'update' | 'updateCamel';

/**
 * Get commands for loading entity data
 * Used in EntityPage for initial entity loading
 */
export const GET_COMMANDS: EntityCommandMap = {
  person: { command: 'get_person', param: 'person_id' },
  event: { command: 'get_event', param: 'event_id' },
  theory: { command: 'get_theory', param: 'theory_id' },
  place: { command: 'get_place', param: 'place_id' },
  artifact: { command: 'get_artifact', param: 'artifact_id' },
};

/**
 * Update commands with snake_case parameters
 * Used in EntityPage for metadata updates
 */
export const UPDATE_COMMANDS: EntityCommandMap = {
  person: { command: 'update_person', param: 'person_id' },
  event: { command: 'update_event', param: 'event_id' },
  theory: { command: 'update_theory', param: 'theory_id' },
  place: { command: 'update_place', param: 'place_id' },
  artifact: { command: 'update_artifact', param: 'artifact_id' },
};

/**
 * Update commands with camelCase parameters
 * Used in MapView for location updates
 */
export const UPDATE_COMMANDS_CAMEL: EntityCommandMap = {
  person: { command: 'update_person', param: 'personId' },
  event: { command: 'update_event', param: 'eventId' },
  theory: { command: 'update_theory', param: 'theoryId' },
  place: { command: 'update_place', param: 'placeId' },
  artifact: { command: 'update_artifact', param: 'artifactId' },
};

/**
 * Helper function to get command config for an entity type
 *
 * @param entityType - The entity type (person, event, theory, place, artifact)
 * @param commandType - The type of command
 * @returns Command configuration with command and param keys
 *
 * @example
 * const cmd = getEntityCommand('person', 'get');
 * // Returns: { command: 'get_person', param: 'person_id' }
 */
export function getEntityCommand(
  entityType: EntityType,
  commandType: CommandType = 'get'
): EntityCommand | undefined {
  const commandMaps: Record<CommandType, EntityCommandMap> = {
    get: GET_COMMANDS,
    update: UPDATE_COMMANDS,
    updateCamel: UPDATE_COMMANDS_CAMEL,
  };

  return commandMaps[commandType]?.[entityType];
}
