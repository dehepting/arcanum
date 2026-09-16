import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  linkArtifactToAnnotation,
  unlinkArtifactFromAnnotation,
  getSourcesForArtifact,
  getArtifactsForAnnotation,
  getArtifactsForSource,
  checkArtifactLink,
} from './artifact-sources';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('artifact-sources library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('linkArtifactToAnnotation', () => {
    it('should link artifact to annotation successfully', async () => {
      const mockLink = {
        id: 'link-1',
        artifact_id: 'artifact-1',
        annotation_id: 'annotation-1',
        quote: 'Test quote',
        context: 'Test context',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLink, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await linkArtifactToAnnotation(
        'artifact-1',
        'annotation-1',
        'Test quote',
        'Test context'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLink);
      expect(mockChain.insert).toHaveBeenCalledWith({
        artifact_id: 'artifact-1',
        annotation_id: 'annotation-1',
        quote: 'Test quote',
        context: 'Test context',
      });
    });

    it('should handle database error', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await linkArtifactToAnnotation('artifact-1', 'annotation-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });

    it('should handle exception', async () => {
      supabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await linkArtifactToAnnotation('artifact-1', 'annotation-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('unlinkArtifactFromAnnotation', () => {
    it('should unlink artifact from annotation successfully', async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const eq1Mock = vi.fn().mockReturnThis();
      const eq2Mock = vi.fn().mockResolvedValue({ data: null, error: null });

      supabase.from.mockReturnValue({ delete: deleteMock });
      deleteMock.mockReturnValue({ eq: eq1Mock });
      eq1Mock.mockReturnValue({ eq: eq2Mock });

      const result = await unlinkArtifactFromAnnotation('artifact-1', 'annotation-1');

      expect(result.success).toBe(true);
      expect(deleteMock).toHaveBeenCalled();
      expect(eq1Mock).toHaveBeenCalledWith('artifact_id', 'artifact-1');
      expect(eq2Mock).toHaveBeenCalledWith('annotation_id', 'annotation-1');
    });

    it('should handle database error', async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const eq1Mock = vi.fn().mockReturnThis();
      const eq2Mock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });

      supabase.from.mockReturnValue({ delete: deleteMock });
      deleteMock.mockReturnValue({ eq: eq1Mock });
      eq1Mock.mockReturnValue({ eq: eq2Mock });

      const result = await unlinkArtifactFromAnnotation('artifact-1', 'annotation-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('getSourcesForArtifact', () => {
    it('should get sources for artifact', async () => {
      const mockData = [
        {
          id: 'link-1',
          annotation_id: 'ann-1',
          quote: 'Test quote',
          annotations: { id: 'ann-1', sources: { title: 'Document 1' } },
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getSourcesForArtifact('artifact-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockChain.eq).toHaveBeenCalledWith('artifact_id', 'artifact-1');
    });

    it('should return empty array when no sources', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getSourcesForArtifact('artifact-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getArtifactsForAnnotation', () => {
    it('should get artifacts for annotation', async () => {
      const mockData = [
        {
          id: 'link-1',
          artifact_id: 'artifact-1',
          artifacts: { id: 'artifact-1', name: 'Artifact 1' },
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getArtifactsForAnnotation('annotation-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockChain.eq).toHaveBeenCalledWith('annotation_id', 'annotation-1');
    });

    it('should handle error', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getArtifactsForAnnotation('annotation-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('getArtifactsForSource', () => {
    it('should get artifacts for source', async () => {
      const mockAnnotations = [{ id: 'ann-1' }, { id: 'ann-2' }];
      const mockArtifacts = [
        {
          id: 'link-1',
          artifacts: { id: 'artifact-1', name: 'Artifact 1' },
        },
      ];

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        if (table === 'annotations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockAnnotations, error: null }),
          };
        } else {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: mockArtifacts, error: null }),
          };
        }
      });

      const result = await getArtifactsForSource('source-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockArtifacts);
    });

    it('should return empty array when no annotations', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await getArtifactsForSource('source-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle annotation fetch error', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      const result = await getArtifactsForSource('source-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('checkArtifactLink', () => {
    it('should return linked true when link exists', async () => {
      const mockLink = {
        id: 'link-1',
        artifact_id: 'artifact-1',
        annotation_id: 'annotation-1',
      };

      const eq1Mock = vi.fn().mockReturnThis();
      const eq2Mock = vi.fn().mockReturnThis();
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockLink, error: null });

      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis() });
      supabase.from().select.mockReturnValue({ eq: eq1Mock });
      eq1Mock.mockReturnValue({ eq: eq2Mock });
      eq2Mock.mockReturnValue({ maybeSingle: maybeSingleMock });

      const result = await checkArtifactLink('artifact-1', 'annotation-1');

      expect(result.success).toBe(true);
      expect(result.linked).toBe(true);
      expect(result.data).toEqual(mockLink);
    });

    it('should return linked false when link does not exist', async () => {
      const eq1Mock = vi.fn().mockReturnThis();
      const eq2Mock = vi.fn().mockReturnThis();
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });

      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis() });
      supabase.from().select.mockReturnValue({ eq: eq1Mock });
      eq1Mock.mockReturnValue({ eq: eq2Mock });
      eq2Mock.mockReturnValue({ maybeSingle: maybeSingleMock });

      const result = await checkArtifactLink('artifact-1', 'annotation-1');

      expect(result.success).toBe(true);
      expect(result.linked).toBe(false);
    });

    it('should handle error', async () => {
      const eq1Mock = vi.fn().mockReturnThis();
      const eq2Mock = vi.fn().mockReturnThis();
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'DB error' } });

      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis() });
      supabase.from().select.mockReturnValue({ eq: eq1Mock });
      eq1Mock.mockReturnValue({ eq: eq2Mock });
      eq2Mock.mockReturnValue({ maybeSingle: maybeSingleMock });

      const result = await checkArtifactLink('artifact-1', 'annotation-1');

      expect(result.success).toBe(false);
      expect(result.linked).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });
});
