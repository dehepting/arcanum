import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadAnnotations } from './annotations';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('annotations library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadAnnotations', () => {
    it('should load annotations for a given source', async () => {
      const mockAnnotations = [
        {
          id: '1',
          source_id: 'source-1',
          page_number: 1,
          type: 'highlight',
          rect_x: 0.1,
          rect_y: 0.2,
          rect_w: 0.3,
          rect_h: 0.1,
          text: null,
        },
        {
          id: '2',
          source_id: 'source-1',
          page_number: 2,
          type: 'text',
          rect_x: 0.5,
          rect_y: 0.5,
          rect_w: 0.2,
          rect_h: 0.1,
          text: 'Test note',
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAnnotations, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadAnnotations('source-1');

      expect(supabase.from).toHaveBeenCalledWith('annotations');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('source_id', 'source-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual(mockAnnotations);
    });

    it('should throw error when database query fails', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(loadAnnotations('source-1')).rejects.toThrow(
        'Failed to load annotations: Database error'
      );
    });

    it('should handle null data gracefully', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadAnnotations('source-1');

      expect(result).toEqual([]);
    });
  });

  // Add more test suites for other functions as needed
  // describe('deleteAnnotation', () => { ... });
  // describe('updateAnnotationText', () => { ... });
});
