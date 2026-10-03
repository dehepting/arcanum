/**
 * Full-text fuzzy search hook using Fuse.js
 * Example implementation - ready to use!
 */
import { useMemo } from 'react';
import Fuse from 'fuse.js';

/**
 * Entity with searchable fields
 */
export interface SearchableEntity {
  name?: string;
  description?: string;
  bio?: string;
  notes?: string;
  metadata?: string;
  [key: string]: unknown;
}

/**
 * Hook for full-text fuzzy search on entities
 *
 * @param entities - Array of entities to search
 * @param searchQuery - Search query string
 * @returns Filtered entities matching the search query
 *
 * @example
 * const filteredPeople = useEntitySearch(people, searchQuery);
 */
export function useEntitySearch<TEntity extends SearchableEntity>(
  entities: TEntity[],
  searchQuery: string
): TEntity[] {
  const fuse = useMemo(() => {
    return new Fuse(entities, {
      keys: ['name', 'description', 'bio', 'notes', 'metadata'],
      threshold: 0.3, // 0 = exact match, 1 = match anything
      includeScore: true,
      findAllMatches: true,
    });
  }, [entities]);

  if (!searchQuery.trim()) {
    return entities;
  }

  return fuse.search(searchQuery).map((result) => result.item);
}
