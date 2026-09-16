import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadArtifactImage,
  createArtifact,
  loadArtifacts,
  getArtifact,
  updateArtifact,
  deleteArtifact,
  getArtifactsByFindspot,
  searchArtifacts,
} from './artifacts';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('artifacts library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now for consistent timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('uploadArtifactImage', () => {
    it('should upload image and return public URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const projectId = 'project-1';
      const mockPublicUrl = 'https://storage.example.com/artifacts/project-1/12345.jpg';

      const uploadMock = vi.fn().mockResolvedValue({ data: {}, error: null });
      const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      supabase.storage.from.mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      });

      const result = await uploadArtifactImage(mockFile, projectId);

      expect(supabase.storage.from).toHaveBeenCalledWith('artifacts');
      expect(uploadMock).toHaveBeenCalled();
      expect(getPublicUrlMock).toHaveBeenCalled();
      expect(result).toBe(mockPublicUrl);
    });

    it('should throw error when upload fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const uploadError = new Error('Upload failed');

      supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: uploadError }),
      });

      await expect(uploadArtifactImage(mockFile, 'project-1')).rejects.toThrow('Upload failed');
    });
  });

  describe('createArtifact', () => {
    it('should create artifact with timestamps', async () => {
      const artifactData = {
        project_id: 'project-1',
        name: 'Test Artifact',
        category: 'Pottery',
      };

      const createdArtifact = {
        id: 'artifact-1',
        ...artifactData,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdArtifact, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createArtifact(artifactData);

      expect(supabase.from).toHaveBeenCalledWith('artifacts');
      expect(mockChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          ...artifactData,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      ]);
      expect(result).toEqual(createdArtifact);
    });

    it('should throw error when creation fails', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(createArtifact({ name: 'Test' })).rejects.toThrow('DB error');
    });
  });

  describe('loadArtifacts', () => {
    it('should load artifacts with findspot data', async () => {
      const mockArtifacts = [
        {
          id: 'artifact-1',
          name: 'Artifact 1',
          findspot: { id: 'place-1', name: 'Site A' },
        },
        {
          id: 'artifact-2',
          name: 'Artifact 2',
          findspot: null,
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockArtifacts, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadArtifacts('project-1');

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockArtifacts);
    });

    it('should return empty array when no artifacts', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadArtifacts('project-1');
      expect(result).toEqual([]);
    });
  });

  describe('getArtifact', () => {
    it('should get single artifact by ID', async () => {
      const mockArtifact = {
        id: 'artifact-1',
        name: 'Test Artifact',
        findspot: { id: 'place-1', name: 'Site A' },
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockArtifact, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getArtifact('artifact-1');

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'artifact-1');
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockArtifact);
    });

    it('should throw error when artifact not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(getArtifact('artifact-1')).rejects.toThrow('Not found');
    });
  });

  describe('updateArtifact', () => {
    it('should update artifact with new timestamp', async () => {
      const updates = { name: 'Updated Name' };
      const updatedArtifact = {
        id: 'artifact-1',
        name: 'Updated Name',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedArtifact, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateArtifact('artifact-1', updates);

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          updated_at: expect.any(String),
        })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'artifact-1');
      expect(result).toEqual(updatedArtifact);
    });
  });

  describe('deleteArtifact', () => {
    it('should delete artifact and images', async () => {
      const imageUrls = [
        'https://storage.example.com/artifacts/project-1/image1.jpg',
        'https://storage.example.com/artifacts/project-1/image2.jpg',
      ];

      const deleteMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const removeMock = vi.fn().mockResolvedValue({ data: null, error: null });

      supabase.from.mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      });

      supabase.storage.from.mockReturnValue({
        remove: removeMock,
      });

      await deleteArtifact('artifact-1', imageUrls);

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'artifact-1');
      expect(removeMock).toHaveBeenCalledWith(['project-1/image1.jpg', 'project-1/image2.jpg']);
    });

    it('should delete artifact without images', async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });

      supabase.from.mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      });

      await deleteArtifact('artifact-1', []);

      expect(deleteMock).toHaveBeenCalled();
      expect(supabase.storage.from).not.toHaveBeenCalled();
    });
  });

  describe('getArtifactsByFindspot', () => {
    it('should get artifacts by place ID', async () => {
      const mockArtifacts = [
        { id: 'artifact-1', name: 'Artifact 1' },
        { id: 'artifact-2', name: 'Artifact 2' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockArtifacts, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getArtifactsByFindspot('place-1');

      expect(mockChain.eq).toHaveBeenCalledWith('findspot_place_id', 'place-1');
      expect(result).toEqual(mockArtifacts);
    });
  });

  describe('searchArtifacts', () => {
    it('should search with query text', async () => {
      const mockResults = [{ id: 'artifact-1', name: 'Test Artifact' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockResults, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await searchArtifacts('project-1', 'test');

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.or).toHaveBeenCalledWith('name.ilike.%test%,description.ilike.%test%');
      expect(result).toEqual(mockResults);
    });

    it('should search with category filter', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await searchArtifacts('project-1', null, { category: 'Pottery' });

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.eq).toHaveBeenCalledWith('category', 'Pottery');
    });

    it('should search with multiple filters', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await searchArtifacts('project-1', 'amphora', {
        category: 'Pottery',
        ownerType: 'museum',
      });

      expect(mockChain.or).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('category', 'Pottery');
      expect(mockChain.eq).toHaveBeenCalledWith('owner_type', 'museum');
    });
  });
});
