import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTheory,
  updateTheory,
  loadTheories,
  getTheoriesForAnnotation,
  getTheoriesForPlace,
  deleteTheory,
  linkTheoryToAnnotation,
  unlinkTheoryFromAnnotation,
} from './theories';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('theories library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTheory', () => {
    it('should create theory without annotation link', async () => {
      const theoryData = {
        project_id: 'project-1',
        name: 'Atlantis in Mediterranean',
        description: 'Theory that Atlantis was located near Santorini',
        status: 'active',
        confidence_level: 3,
      };

      const createdTheory = {
        id: 'theory-1',
        ...theoryData,
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdTheory, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createTheory(theoryData);

      expect(supabase.from).toHaveBeenCalledWith('theories');
      expect(mockChain.insert).toHaveBeenCalledWith([theoryData]);
      expect(result).toEqual(createdTheory);
    });

    it('should create theory with annotation link', async () => {
      const theoryData = {
        project_id: 'project-1',
        name: 'Atlantis Theory',
        status: 'active',
      };

      const createdTheory = { id: 'theory-1', ...theoryData };

      supabase.from.mockImplementation((table) => {
        if (table === 'theories') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdTheory, error: null }),
          };
        } else if (table === 'annotation_theories_links') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
      });

      const result = await createTheory(theoryData, 'annotation-1', 'supports');

      expect(result).toEqual(createdTheory);
    });

    it('should throw error when theory creation fails', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(createTheory({ name: 'Test' })).rejects.toThrow('Failed to create theory');
    });
  });

  describe('updateTheory', () => {
    it('should update theory name', async () => {
      const updates = { name: 'Updated Theory Name' };
      const updatedTheory = {
        id: 'theory-1',
        name: 'Updated Theory Name',
        status: 'active',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedTheory, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateTheory('theory-1', updates);

      expect(supabase.from).toHaveBeenCalledWith('theories');
      expect(mockChain.update).toHaveBeenCalledWith(updates);
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'theory-1');
      expect(result).toEqual(updatedTheory);
    });

    it('should update theory status', async () => {
      const updates = { status: 'debunked' };
      const updatedTheory = {
        id: 'theory-1',
        name: 'Old Theory',
        status: 'debunked',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedTheory, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateTheory('theory-1', updates);

      expect(result.status).toBe('debunked');
    });

    it('should throw error when update fails', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(updateTheory('theory-1', { name: 'Test' })).rejects.toThrow(
        'Failed to update theory'
      );
    });
  });

  describe('loadTheories', () => {
    it('should load theories with annotation links and proposed location', async () => {
      const mockTheories = [
        {
          id: 'theory-1',
          name: 'Atlantis Theory',
          annotation_theories_links: [{ annotation_id: 'ann-1', relationship_type: 'supports' }],
          places: { id: 'place-1', name: 'Santorini' },
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTheories, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadTheories('project-1');

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockTheories);
    });

    it('should return empty array when no theories', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadTheories('project-1');
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(loadTheories('project-1')).rejects.toThrow('Failed to load theories');
    });
  });

  describe('getTheoriesForAnnotation', () => {
    it('should get theories for annotation', async () => {
      const mockTheory = {
        id: 'theory-1',
        name: 'Atlantis Theory',
        status: 'active',
      };

      const mockData = [
        {
          relationship_type: 'supports',
          quote: 'This supports the theory...',
          theories: mockTheory,
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getTheoriesForAnnotation('annotation-1');

      expect(mockChain.eq).toHaveBeenCalledWith('annotation_id', 'annotation-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Atlantis Theory');
      expect(result[0].relationship_type).toBe('supports');
    });

    it('should return empty array when no theories', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getTheoriesForAnnotation('annotation-1');
      expect(result).toEqual([]);
    });
  });

  describe('getTheoriesForPlace', () => {
    it('should get theories for place', async () => {
      const mockTheories = [
        { id: 'theory-1', name: 'Theory 1', proposed_location_id: 'place-1' },
        { id: 'theory-2', name: 'Theory 2', proposed_location_id: 'place-1' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockTheories, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getTheoriesForPlace('place-1');

      expect(mockChain.eq).toHaveBeenCalledWith('proposed_location_id', 'place-1');
      expect(result).toEqual(mockTheories);
    });

    it('should return empty array when no theories', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getTheoriesForPlace('place-1');
      expect(result).toEqual([]);
    });
  });

  describe('deleteTheory', () => {
    it('should delete theory successfully', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await deleteTheory('theory-1');

      expect(supabase.from).toHaveBeenCalledWith('theories');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'theory-1');
    });

    it('should throw error when delete fails', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(deleteTheory('theory-1')).rejects.toThrow('Failed to delete theory');
    });
  });

  describe('linkTheoryToAnnotation', () => {
    it('should link theory to annotation', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await linkTheoryToAnnotation('theory-1', 'annotation-1', 'contradicts', 'Quote text');

      expect(supabase.from).toHaveBeenCalledWith('annotation_theories_links');
      expect(mockChain.insert).toHaveBeenCalledWith([
        {
          annotation_id: 'annotation-1',
          theory_id: 'theory-1',
          relationship_type: 'contradicts',
          quote: 'Quote text',
        },
      ]);
    });
  });

  describe('unlinkTheoryFromAnnotation', () => {
    it('should unlink theory from annotation', async () => {
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

      await unlinkTheoryFromAnnotation('theory-1', 'annotation-1');

      expect(supabase.from).toHaveBeenCalledWith('annotation_theories_links');
      expect(eq1Mock).toHaveBeenCalledWith('theory_id', 'theory-1');
      expect(eq2Mock).toHaveBeenCalledWith('annotation_id', 'annotation-1');
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

      await expect(unlinkTheoryFromAnnotation('theory-1', 'annotation-1')).rejects.toThrow(
        'Failed to unlink theory'
      );
    });
  });
});
