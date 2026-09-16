import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadOverlay,
  createOverlay,
  loadOverlays,
  updateOverlay,
  deleteOverlay,
} from './overlays';
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

describe('overlays library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadOverlay', () => {
    it('should upload overlay image successfully', async () => {
      const mockFile = new File(['content'], 'overlay.png', { type: 'image/png' });
      const mockFileName = 'project-1/1234567890.png';
      const mockPublicUrl = 'https://storage.example.com/overlays/project-1/1234567890.png';

      const uploadMock = vi.fn().mockResolvedValue({ data: { path: mockFileName }, error: null });
      const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      supabase.storage.from.mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      });

      const result = await uploadOverlay(mockFile, 'project-1');

      expect(supabase.storage.from).toHaveBeenCalledWith('overlays');
      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringMatching(/^project-1\/\d+\.png$/),
        mockFile
      );
      expect(result.fileName).toMatch(/^project-1\/\d+\.png$/);
      expect(result.publicUrl).toBe(mockPublicUrl);
    });

    it('should throw error when upload fails', async () => {
      const mockFile = new File(['content'], 'overlay.png', { type: 'image/png' });
      const mockError = new Error('Upload failed');
      const uploadMock = vi.fn().mockResolvedValue({ data: null, error: mockError });

      supabase.storage.from.mockReturnValue({
        upload: uploadMock,
      });

      await expect(uploadOverlay(mockFile, 'project-1')).rejects.toThrow('Upload failed');
    });

    it('should handle upload with different file types', async () => {
      const mockFile = new File(['content'], 'overlay.jpg', { type: 'image/jpeg' });
      const mockFileName = 'project-1/1234567890.jpg';
      const mockPublicUrl = 'https://storage.example.com/overlays/project-1/1234567890.jpg';

      const uploadMock = vi.fn().mockResolvedValue({ data: { path: mockFileName }, error: null });
      const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      supabase.storage.from.mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      });

      const result = await uploadOverlay(mockFile, 'project-1');

      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringMatching(/^project-1\/\d+\.jpg$/),
        mockFile
      );
      expect(result.fileName).toMatch(/^project-1\/\d+\.jpg$/);
      expect(result.publicUrl).toBe(mockPublicUrl);
    });
  });

  describe('createOverlay', () => {
    it('should create overlay successfully', async () => {
      const overlayData = {
        project_id: 'project-1',
        name: 'Archaeological Site Map',
        image_url: 'https://example.com/overlay.png',
        bounds: [
          [-20.5, 36.8],
          [-20.4, 36.9],
        ],
        opacity: 0.7,
      };

      const createdOverlay = {
        id: 'overlay-1',
        ...overlayData,
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdOverlay, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createOverlay(overlayData);

      expect(supabase.from).toHaveBeenCalledWith('map_overlays');
      expect(mockChain.insert).toHaveBeenCalledWith([overlayData]);
      expect(result).toEqual(createdOverlay);
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('DB error');
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(createOverlay({ name: 'Test' })).rejects.toThrow('DB error');
    });
  });

  describe('loadOverlays', () => {
    it('should load overlays for project', async () => {
      const mockOverlays = [
        {
          id: 'overlay-1',
          name: 'Site Map',
          image_url: 'https://example.com/map1.png',
          bounds: [
            [-20.5, 36.8],
            [-20.4, 36.9],
          ],
          opacity: 0.7,
        },
        {
          id: 'overlay-2',
          name: 'Aerial Photo',
          image_url: 'https://example.com/map2.png',
          bounds: [
            [-20.6, 36.7],
            [-20.5, 36.8],
          ],
          opacity: 0.5,
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockOverlays, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadOverlays('project-1');

      expect(supabase.from).toHaveBeenCalledWith('map_overlays');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockOverlays);
    });

    it('should return empty array when no overlays', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadOverlays('project-1');
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('DB error');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(loadOverlays('project-1')).rejects.toThrow('DB error');
    });
  });

  describe('updateOverlay', () => {
    it('should update overlay successfully', async () => {
      const updates = {
        name: 'Updated Map Name',
        opacity: 0.9,
      };

      const updatedOverlay = {
        id: 'overlay-1',
        ...updates,
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedOverlay, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateOverlay('overlay-1', updates);

      expect(supabase.from).toHaveBeenCalledWith('map_overlays');
      expect(mockChain.update).toHaveBeenCalledWith(updates);
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'overlay-1');
      expect(result).toEqual(updatedOverlay);
    });

    it('should update overlay bounds', async () => {
      const updates = {
        bounds: [
          [-20.7, 36.6],
          [-20.6, 36.7],
        ],
      };

      const updatedOverlay = {
        id: 'overlay-1',
        ...updates,
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedOverlay, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateOverlay('overlay-1', updates);

      expect(result.bounds).toEqual(updates.bounds);
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(updateOverlay('overlay-1', { name: 'Test' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteOverlay', () => {
    it('should delete overlay from database', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await deleteOverlay('overlay-1');

      expect(supabase.from).toHaveBeenCalledWith('map_overlays');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'overlay-1');
    });

    it('should delete overlay and image from storage', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const removeMock = vi.fn().mockResolvedValue({ data: null, error: null });

      supabase.from.mockReturnValue(mockChain);
      supabase.storage.from.mockReturnValue({
        remove: removeMock,
      });

      await deleteOverlay('overlay-1', 'https://example.com/overlays/project-1/1234567890.png');

      expect(mockChain.delete).toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalledWith(['project-1/1234567890.png']);
    });

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed');
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(deleteOverlay('overlay-1')).rejects.toThrow('Delete failed');
    });
  });
});
