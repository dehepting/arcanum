import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPlace,
  loadPlaces,
  getPlaceForAnnotation,
  getAnnotationsForPlace,
  deletePlace,
  unlinkAnnotationFromPlace,
} from './places';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('places library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPlace', () => {
    it('should create place without annotation link', async () => {
      const placeData = {
        project_id: 'project-1',
        name: 'Ancient Site',
        lng: -20.5,
        lat: 36.8,
        note: 'Important location',
      };

      const createdPlace = {
        id: 'place-1',
        ...placeData,
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdPlace, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createPlace(placeData);

      expect(supabase.from).toHaveBeenCalledWith('places');
      expect(mockChain.insert).toHaveBeenCalledWith([placeData]);
      expect(result).toEqual(createdPlace);
    });

    it('should create place with annotation link', async () => {
      const placeData = {
        project_id: 'project-1',
        name: 'Site',
        lng: -20,
        lat: 36,
      };

      const createdPlace = { id: 'place-1', ...placeData };

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        if (table === 'places') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdPlace, error: null }),
          };
        } else if (table === 'annotation_place_links') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
      });

      const result = await createPlace(placeData, 'annotation-1');

      expect(result).toEqual(createdPlace);
    });

    it('should throw error when place creation fails', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(createPlace({ name: 'Test' })).rejects.toThrow('Failed to create place');
    });

    it('should throw error when annotation link fails', async () => {
      const createdPlace = { id: 'place-1', name: 'Test' };

      supabase.from.mockImplementation((table) => {
        if (table === 'places') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdPlace, error: null }),
          };
        } else {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Link error' } }),
          };
        }
      });

      await expect(createPlace({ name: 'Test' }, 'annotation-1')).rejects.toThrow(
        'Failed to link annotation to place'
      );
    });
  });

  describe('loadPlaces', () => {
    it('should load places with annotation links', async () => {
      const mockPlaces = [
        {
          id: 'place-1',
          name: 'Site A',
          annotation_place_links: [{ annotation_id: 'ann-1' }],
        },
        {
          id: 'place-2',
          name: 'Site B',
          annotation_place_links: [],
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPlaces, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadPlaces('project-1');

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockPlaces);
    });

    it('should return empty array when no places', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadPlaces('project-1');
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(loadPlaces('project-1')).rejects.toThrow('Failed to load places');
    });
  });

  describe('getPlaceForAnnotation', () => {
    it('should get place for annotation', async () => {
      const mockPlace = {
        id: 'place-1',
        name: 'Site A',
        lng: -20,
        lat: 36,
      };

      const mockData = {
        place_id: 'place-1',
        places: mockPlace,
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getPlaceForAnnotation('annotation-1');

      expect(mockChain.eq).toHaveBeenCalledWith('annotation_id', 'annotation-1');
      expect(result).toEqual(mockPlace);
    });

    it('should return null when no place found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getPlaceForAnnotation('annotation-1');
      expect(result).toBeNull();
    });

    it('should throw error on other failures', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(getPlaceForAnnotation('annotation-1')).rejects.toThrow('Failed to get place');
    });
  });

  describe('getAnnotationsForPlace', () => {
    it('should get annotations for place', async () => {
      const mockAnnotations = [
        { id: 'ann-1', text: 'Note 1' },
        { id: 'ann-2', text: 'Note 2' },
      ];

      const mockData = [
        { annotation_id: 'ann-1', annotations: mockAnnotations[0] },
        { annotation_id: 'ann-2', annotations: mockAnnotations[1] },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getAnnotationsForPlace('place-1');

      expect(mockChain.eq).toHaveBeenCalledWith('place_id', 'place-1');
      expect(result).toEqual(mockAnnotations);
    });

    it('should return empty array when no annotations', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getAnnotationsForPlace('place-1');
      expect(result).toEqual([]);
    });
  });

  describe('deletePlace', () => {
    it('should delete place successfully', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await deletePlace('place-1');

      expect(supabase.from).toHaveBeenCalledWith('places');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'place-1');
    });

    it('should throw error when delete fails', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(deletePlace('place-1')).rejects.toThrow('Failed to delete place');
    });
  });

  describe('unlinkAnnotationFromPlace', () => {
    it('should unlink annotation from place', async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const eq1Mock = vi.fn().mockReturnThis();
      const eq2Mock = vi.fn().mockResolvedValue({ data: null, error: null });

      supabase.from.mockReturnValue({
        delete: deleteMock,
      });

      deleteMock.mockReturnValue({
        eq: eq1Mock,
      });

      eq1Mock.mockReturnValue({
        eq: eq2Mock,
      });

      await unlinkAnnotationFromPlace('annotation-1', 'place-1');

      expect(supabase.from).toHaveBeenCalledWith('annotation_place_links');
      expect(deleteMock).toHaveBeenCalled();
      expect(eq1Mock).toHaveBeenCalledWith('annotation_id', 'annotation-1');
      expect(eq2Mock).toHaveBeenCalledWith('place_id', 'place-1');
    });

    it('should throw error when unlink fails', async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const eq1Mock = vi.fn().mockReturnThis();
      const eq2Mock = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Unlink failed' } });

      supabase.from.mockReturnValue({
        delete: deleteMock,
      });

      deleteMock.mockReturnValue({
        eq: eq1Mock,
      });

      eq1Mock.mockReturnValue({
        eq: eq2Mock,
      });

      await expect(unlinkAnnotationFromPlace('annotation-1', 'place-1')).rejects.toThrow(
        'Failed to unlink'
      );
    });
  });
});
