import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  linkAnnotationToEntity,
  unlinkAnnotationFromEntity,
  getEntitiesForAnnotation,
  getAnnotationsForEntity,
} from './annotationLinks';
import * as tauri from './tauri';

vi.mock('./tauri');

describe('annotationLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('linkAnnotationToEntity', () => {
    it('successfully links annotation to person entity', async () => {
      const mockData = {
        id: 'link-1',
        annotation_id: 'ann-1',
        entity_id: 'person-1',
        entity_type: 'person',
        relationship_type: 'mentions',
      };

      tauri.linkAnnotationToEntity.mockResolvedValue(mockData);

      const result = await linkAnnotationToEntity('ann-1', 'person-1', 'person', 'mentions');

      expect(result).toEqual({ success: true, data: mockData });
      expect(tauri.linkAnnotationToEntity).toHaveBeenCalledWith(
        'ann-1',
        'person-1',
        'person',
        'mentions'
      );
    });

    it('successfully links annotation to event entity', async () => {
      const mockData = {
        id: 'link-2',
        annotation_id: 'ann-1',
        entity_id: 'event-1',
        entity_type: 'event',
        relationship_type: 'describes',
      };

      tauri.linkAnnotationToEntity.mockResolvedValue(mockData);

      const result = await linkAnnotationToEntity('ann-1', 'event-1', 'event', 'describes');

      expect(result).toEqual({ success: true, data: mockData });
    });

    it('successfully links annotation to theory entity', async () => {
      const mockData = {
        id: 'link-3',
        annotation_id: 'ann-1',
        entity_id: 'theory-1',
        entity_type: 'theory',
        relationship_type: 'references',
      };

      tauri.linkAnnotationToEntity.mockResolvedValue(mockData);

      const result = await linkAnnotationToEntity('ann-1', 'theory-1', 'theory', 'references');

      expect(result).toEqual({ success: true, data: mockData });
    });

    it('successfully links annotation to place entity', async () => {
      const mockData = {
        id: 'link-4',
        annotation_id: 'ann-1',
        entity_id: 'place-1',
        entity_type: 'place',
        relationship_type: 'mentions',
      };

      tauri.linkAnnotationToEntity.mockResolvedValue(mockData);

      const result = await linkAnnotationToEntity('ann-1', 'place-1', 'place', 'mentions');

      expect(result).toEqual({ success: true, data: mockData });
    });

    it('successfully links annotation to artifact entity', async () => {
      const mockData = {
        id: 'link-5',
        annotation_id: 'ann-1',
        entity_id: 'artifact-1',
        entity_type: 'artifact',
        relationship_type: 'references',
      };

      tauri.linkAnnotationToEntity.mockResolvedValue(mockData);

      const result = await linkAnnotationToEntity('ann-1', 'artifact-1', 'artifact', 'references');

      expect(result).toEqual({ success: true, data: mockData });
    });

    it('handles errors gracefully', async () => {
      const error = new Error('Database constraint violation');
      tauri.linkAnnotationToEntity.mockRejectedValue(error);

      const result = await linkAnnotationToEntity('ann-1', 'person-1', 'person', 'mentions');

      expect(result).toEqual({
        success: false,
        error: 'Database constraint violation',
      });
    });

    it('prevents duplicate links', async () => {
      const error = new Error('UNIQUE constraint failed');
      tauri.linkAnnotationToEntity.mockRejectedValue(error);

      const result = await linkAnnotationToEntity('ann-1', 'person-1', 'person', 'mentions');

      expect(result.success).toBe(false);
      expect(result.error).toContain('UNIQUE constraint');
    });
  });

  describe('unlinkAnnotationFromEntity', () => {
    it('successfully unlinks annotation from entity', async () => {
      tauri.unlinkAnnotationFromEntity.mockResolvedValue(true);

      const result = await unlinkAnnotationFromEntity('ann-1', 'person-1');

      expect(result).toEqual({ success: true });
      expect(tauri.unlinkAnnotationFromEntity).toHaveBeenCalledWith('ann-1', 'person-1');
    });

    it('handles errors when unlinking', async () => {
      const error = new Error('Entity link not found');
      tauri.unlinkAnnotationFromEntity.mockRejectedValue(error);

      const result = await unlinkAnnotationFromEntity('ann-1', 'person-1');

      expect(result).toEqual({
        success: false,
        error: 'Entity link not found',
      });
    });
  });

  describe('getEntitiesForAnnotation', () => {
    it('returns all linked entities for an annotation', async () => {
      const mockEntities = [
        {
          entity_id: 'person-1',
          entity_type: 'person',
          relationship_type: 'mentions',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          entity_id: 'place-1',
          entity_type: 'place',
          relationship_type: 'mentions',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          entity_id: 'event-1',
          entity_type: 'event',
          relationship_type: 'describes',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      tauri.getEntitiesForAnnotation.mockResolvedValue(mockEntities);

      const result = await getEntitiesForAnnotation('ann-1');

      expect(result).toEqual({ success: true, data: mockEntities });
      expect(tauri.getEntitiesForAnnotation).toHaveBeenCalledWith('ann-1');
    });

    it('returns empty array when annotation has no links', async () => {
      tauri.getEntitiesForAnnotation.mockResolvedValue([]);

      const result = await getEntitiesForAnnotation('ann-1');

      expect(result).toEqual({ success: true, data: [] });
    });

    it('handles errors when fetching entities', async () => {
      const error = new Error('Annotation not found');
      tauri.getEntitiesForAnnotation.mockRejectedValue(error);

      const result = await getEntitiesForAnnotation('ann-1');

      expect(result).toEqual({
        success: false,
        data: [],
        error: 'Annotation not found',
      });
    });
  });

  describe('getAnnotationsForEntity', () => {
    it('returns all annotations linked to a person', async () => {
      const mockAnnotations = ['ann-1', 'ann-2', 'ann-3'];
      tauri.getAnnotationsForEntity.mockResolvedValue(mockAnnotations);

      const result = await getAnnotationsForEntity('person-1', 'person');

      expect(result).toEqual({ success: true, data: mockAnnotations });
      expect(tauri.getAnnotationsForEntity).toHaveBeenCalledWith('person-1', 'person');
    });

    it('returns all annotations linked to an event', async () => {
      const mockAnnotations = ['ann-4', 'ann-5'];
      tauri.getAnnotationsForEntity.mockResolvedValue(mockAnnotations);

      const result = await getAnnotationsForEntity('event-1', 'event');

      expect(result).toEqual({ success: true, data: mockAnnotations });
    });

    it('returns all annotations linked to a theory', async () => {
      const mockAnnotations = ['ann-6'];
      tauri.getAnnotationsForEntity.mockResolvedValue(mockAnnotations);

      const result = await getAnnotationsForEntity('theory-1', 'theory');

      expect(result).toEqual({ success: true, data: mockAnnotations });
    });

    it('returns all annotations linked to a place', async () => {
      const mockAnnotations = ['ann-7', 'ann-8'];
      tauri.getAnnotationsForEntity.mockResolvedValue(mockAnnotations);

      const result = await getAnnotationsForEntity('place-1', 'place');

      expect(result).toEqual({ success: true, data: mockAnnotations });
    });

    it('returns all annotations linked to an artifact', async () => {
      const mockAnnotations = ['ann-9'];
      tauri.getAnnotationsForEntity.mockResolvedValue(mockAnnotations);

      const result = await getAnnotationsForEntity('artifact-1', 'artifact');

      expect(result).toEqual({ success: true, data: mockAnnotations });
    });

    it('returns empty array when entity has no linked annotations', async () => {
      tauri.getAnnotationsForEntity.mockResolvedValue([]);

      const result = await getAnnotationsForEntity('person-1', 'person');

      expect(result).toEqual({ success: true, data: [] });
    });

    it('handles errors when fetching annotations', async () => {
      const error = new Error('Entity not found');
      tauri.getAnnotationsForEntity.mockRejectedValue(error);

      const result = await getAnnotationsForEntity('person-1', 'person');

      expect(result).toEqual({
        success: false,
        data: [],
        error: 'Entity not found',
      });
    });
  });

  describe('integration scenarios', () => {
    it('handles complete link lifecycle', async () => {
      // Create link
      const linkData = {
        id: 'link-1',
        annotation_id: 'ann-1',
        entity_id: 'person-1',
        entity_type: 'person',
        relationship_type: 'mentions',
      };
      tauri.linkAnnotationToEntity.mockResolvedValue(linkData);

      const linkResult = await linkAnnotationToEntity('ann-1', 'person-1', 'person', 'mentions');
      expect(linkResult.success).toBe(true);

      // Fetch links
      tauri.getEntitiesForAnnotation.mockResolvedValue([
        {
          entity_id: 'person-1',
          entity_type: 'person',
          relationship_type: 'mentions',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]);

      const fetchResult = await getEntitiesForAnnotation('ann-1');
      expect(fetchResult.data).toHaveLength(1);
      expect(fetchResult.data[0].entity_id).toBe('person-1');

      // Unlink
      tauri.unlinkAnnotationFromEntity.mockResolvedValue(true);
      const unlinkResult = await unlinkAnnotationFromEntity('ann-1', 'person-1');
      expect(unlinkResult.success).toBe(true);

      // Verify unlinked
      tauri.getEntitiesForAnnotation.mockResolvedValue([]);
      const verifyResult = await getEntitiesForAnnotation('ann-1');
      expect(verifyResult.data).toHaveLength(0);
    });

    it('handles multiple entity types linked to same annotation', async () => {
      const mockEntities = [
        { entity_id: 'person-1', entity_type: 'person', relationship_type: 'mentions' },
        { entity_id: 'event-1', entity_type: 'event', relationship_type: 'describes' },
        { entity_id: 'place-1', entity_type: 'place', relationship_type: 'mentions' },
        { entity_id: 'theory-1', entity_type: 'theory', relationship_type: 'references' },
        { entity_id: 'artifact-1', entity_type: 'artifact', relationship_type: 'cites' },
      ];

      tauri.getEntitiesForAnnotation.mockResolvedValue(mockEntities);

      const result = await getEntitiesForAnnotation('ann-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      expect(result.data.map((e) => e.entity_type)).toEqual([
        'person',
        'event',
        'place',
        'theory',
        'artifact',
      ]);
    });
  });
});
