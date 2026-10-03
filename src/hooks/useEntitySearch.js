/**
 * Full-text fuzzy search hook using Fuse.js
 * Example implementation - ready to use!
 */
import { useMemo } from 'react';
import Fuse from 'fuse.js';

export function useEntitySearch(entities, searchQuery) {
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

// Usage in EntityExplorer:
// const filteredPeople = useEntitySearch(people, searchQuery);
