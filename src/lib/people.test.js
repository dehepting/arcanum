import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPerson,
  updatePerson,
  loadPeople,
  getPeopleForAnnotation,
  deletePerson,
  linkPersonToAnnotation,
  unlinkPersonFromAnnotation,
} from './people';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('people library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPerson', () => {
    it('should create person without annotation link', async () => {
      const personData = {
        project_id: 'project-1',
        name: 'Plato',
        role: 'historical_figure',
        birth_year: -427,
        death_year: -347,
        bio: 'Ancient Greek philosopher',
      };

      const createdPerson = {
        id: 'person-1',
        ...personData,
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdPerson, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createPerson(personData);

      expect(supabase.from).toHaveBeenCalledWith('people');
      expect(mockChain.insert).toHaveBeenCalledWith([personData]);
      expect(result).toEqual(createdPerson);
    });

    it('should create person with annotation link', async () => {
      const personData = {
        project_id: 'project-1',
        name: 'Solon',
        role: 'historical_figure',
      };

      const createdPerson = { id: 'person-1', ...personData };

      supabase.from.mockImplementation((table) => {
        if (table === 'people') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdPerson, error: null }),
          };
        } else if (table === 'annotation_people_links') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
      });

      const result = await createPerson(personData, 'annotation-1', 'mentions');

      expect(result).toEqual(createdPerson);
    });

    it('should throw error when person creation fails', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(createPerson({ name: 'Test' })).rejects.toThrow('Failed to create person');
    });

    it('should throw error when annotation link fails', async () => {
      const createdPerson = { id: 'person-1', name: 'Test' };

      supabase.from.mockImplementation((table) => {
        if (table === 'people') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdPerson, error: null }),
          };
        } else {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Link error' } }),
          };
        }
      });

      await expect(createPerson({ name: 'Test' }, 'annotation-1')).rejects.toThrow(
        'Failed to link annotation to person'
      );
    });
  });

  describe('updatePerson', () => {
    it('should update person name', async () => {
      const updates = { name: 'Plato the Philosopher' };
      const updatedPerson = {
        id: 'person-1',
        name: 'Plato the Philosopher',
        role: 'historical_figure',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedPerson, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updatePerson('person-1', updates);

      expect(supabase.from).toHaveBeenCalledWith('people');
      expect(mockChain.update).toHaveBeenCalledWith(updates);
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'person-1');
      expect(result).toEqual(updatedPerson);
    });

    it('should update person bio', async () => {
      const updates = { bio: 'Updated biography' };
      const updatedPerson = {
        id: 'person-1',
        name: 'Plato',
        bio: 'Updated biography',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedPerson, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updatePerson('person-1', updates);

      expect(result.bio).toBe('Updated biography');
    });

    it('should throw error when update fails', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(updatePerson('person-1', { name: 'Test' })).rejects.toThrow(
        'Failed to update person'
      );
    });
  });

  describe('loadPeople', () => {
    it('should load people with annotation links', async () => {
      const mockPeople = [
        {
          id: 'person-1',
          name: 'Plato',
          annotation_people_links: [{ annotation_id: 'ann-1', relationship_type: 'mentions' }],
        },
        {
          id: 'person-2',
          name: 'Solon',
          annotation_people_links: [],
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPeople, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadPeople('project-1');

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockPeople);
    });

    it('should return empty array when no people', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadPeople('project-1');
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(loadPeople('project-1')).rejects.toThrow('Failed to load people');
    });
  });

  describe('getPeopleForAnnotation', () => {
    it('should get people for annotation', async () => {
      const mockPerson = {
        id: 'person-1',
        name: 'Plato',
        role: 'historical_figure',
      };

      const mockData = [
        {
          relationship_type: 'mentions',
          quote: 'Plato describes...',
          people: mockPerson,
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getPeopleForAnnotation('annotation-1');

      expect(mockChain.eq).toHaveBeenCalledWith('annotation_id', 'annotation-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Plato');
      expect(result[0].relationship_type).toBe('mentions');
    });

    it('should return empty array when no people', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getPeopleForAnnotation('annotation-1');
      expect(result).toEqual([]);
    });
  });

  describe('deletePerson', () => {
    it('should delete person successfully', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await deletePerson('person-1');

      expect(supabase.from).toHaveBeenCalledWith('people');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'person-1');
    });

    it('should throw error when delete fails', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(deletePerson('person-1')).rejects.toThrow('Failed to delete person');
    });
  });

  describe('linkPersonToAnnotation', () => {
    it('should link person to annotation', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await linkPersonToAnnotation('person-1', 'annotation-1', 'authored_by', 'Quote text');

      expect(supabase.from).toHaveBeenCalledWith('annotation_people_links');
      expect(mockChain.insert).toHaveBeenCalledWith([
        {
          annotation_id: 'annotation-1',
          person_id: 'person-1',
          relationship_type: 'authored_by',
          quote: 'Quote text',
        },
      ]);
    });
  });

  describe('unlinkPersonFromAnnotation', () => {
    it('should unlink person from annotation', async () => {
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

      await unlinkPersonFromAnnotation('person-1', 'annotation-1');

      expect(supabase.from).toHaveBeenCalledWith('annotation_people_links');
      expect(deleteMock).toHaveBeenCalled();
      expect(eq1Mock).toHaveBeenCalledWith('person_id', 'person-1');
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

      await expect(unlinkPersonFromAnnotation('person-1', 'annotation-1')).rejects.toThrow(
        'Failed to unlink person'
      );
    });
  });
});
