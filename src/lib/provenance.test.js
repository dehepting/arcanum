import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getProvenance,
  createProvenanceEntry,
  updateProvenanceEntry,
  deleteProvenanceEntry,
  reorderProvenance,
  getClaims,
  createClaim,
  updateClaim,
  deleteClaim,
  getDisputedArtifacts,
} from './provenance';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('provenance library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getProvenance', () => {
    it('should get provenance entries ordered by sequence', async () => {
      const mockProvenance = [
        { id: '1', sequence_order: 0, owner_name: 'Owner 1' },
        { id: '2', sequence_order: 1, owner_name: 'Owner 2' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProvenance, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getProvenance('artifact-1');

      expect(supabase.from).toHaveBeenCalledWith('artifact_provenance');
      expect(mockChain.eq).toHaveBeenCalledWith('artifact_id', 'artifact-1');
      expect(mockChain.order).toHaveBeenCalledWith('sequence_order', { ascending: true });
      expect(result).toEqual(mockProvenance);
    });

    it('should return empty array when no provenance', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getProvenance('artifact-1');
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(getProvenance('artifact-1')).rejects.toThrow('DB error');
    });
  });

  describe('createProvenanceEntry', () => {
    it('should create provenance entry with timestamps', async () => {
      const entryData = {
        artifact_id: 'artifact-1',
        owner_name: 'Museum',
        sequence_order: 0,
      };

      const createdEntry = {
        id: 'entry-1',
        ...entryData,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdEntry, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createProvenanceEntry(entryData);

      expect(mockChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          ...entryData,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      ]);
      expect(result).toEqual(createdEntry);
    });
  });

  describe('updateProvenanceEntry', () => {
    it('should update provenance entry with new timestamp', async () => {
      const updates = { owner_name: 'New Owner' };
      const updatedEntry = {
        id: 'entry-1',
        owner_name: 'New Owner',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedEntry, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateProvenanceEntry('entry-1', updates);

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          updated_at: expect.any(String),
        })
      );
      expect(result).toEqual(updatedEntry);
    });
  });

  describe('deleteProvenanceEntry', () => {
    it('should delete provenance entry', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await deleteProvenanceEntry('entry-1');

      expect(supabase.from).toHaveBeenCalledWith('artifact_provenance');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'entry-1');
    });
  });

  describe('reorderProvenance', () => {
    it('should reorder provenance entries', async () => {
      const orderedIds = ['entry-3', 'entry-1', 'entry-2'];
      const expectedUpdates = [
        { id: 'entry-3', sequence_order: 0 },
        { id: 'entry-1', sequence_order: 1 },
        { id: 'entry-2', sequence_order: 2 },
      ];

      const mockChain = {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await reorderProvenance('artifact-1', orderedIds);

      expect(mockChain.upsert).toHaveBeenCalledWith(expectedUpdates);
    });
  });

  describe('getClaims', () => {
    it('should get claims ordered by date', async () => {
      const mockClaims = [
        { id: '1', claim_type: 'ownership', claim_date: '2024-01-02' },
        { id: '2', claim_type: 'repatriation', claim_date: '2024-01-01' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockClaims, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getClaims('artifact-1');

      expect(supabase.from).toHaveBeenCalledWith('artifact_claims');
      expect(mockChain.eq).toHaveBeenCalledWith('artifact_id', 'artifact-1');
      expect(mockChain.order).toHaveBeenCalledWith('claim_date', { ascending: false });
      expect(result).toEqual(mockClaims);
    });

    it('should return empty array when no claims', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getClaims('artifact-1');
      expect(result).toEqual([]);
    });
  });

  describe('createClaim', () => {
    it('should create claim with timestamps', async () => {
      const claimData = {
        artifact_id: 'artifact-1',
        claim_type: 'repatriation',
        claimant_name: 'Government',
      };

      const createdClaim = {
        id: 'claim-1',
        ...claimData,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdClaim, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createClaim(claimData);

      expect(mockChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          ...claimData,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      ]);
      expect(result).toEqual(createdClaim);
    });
  });

  describe('updateClaim', () => {
    it('should update claim with new timestamp', async () => {
      const updates = { status: 'resolved' };
      const updatedClaim = {
        id: 'claim-1',
        status: 'resolved',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedClaim, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateClaim('claim-1', updates);

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          updated_at: expect.any(String),
        })
      );
      expect(result).toEqual(updatedClaim);
    });
  });

  describe('deleteClaim', () => {
    it('should delete claim', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await deleteClaim('claim-1');

      expect(supabase.from).toHaveBeenCalledWith('artifact_claims');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'claim-1');
    });
  });

  describe('getDisputedArtifacts', () => {
    it('should get disputed artifacts', async () => {
      const mockArtifacts = [
        { id: '1', name: 'Disputed Artifact 1', has_disputed_ownership: true },
        { id: '2', name: 'Disputed Artifact 2', has_disputed_ownership: true },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockArtifacts, error: null }),
      };

      // Need to handle chained eq calls
      mockChain.eq.mockReturnValue(mockChain);

      supabase.from.mockReturnValue(mockChain);

      const result = await getDisputedArtifacts('project-1');

      expect(supabase.from).toHaveBeenCalledWith('artifacts');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.eq).toHaveBeenCalledWith('has_disputed_ownership', true);
      expect(mockChain.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual(mockArtifacts);
    });

    it('should return empty array when no disputed artifacts', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockChain.eq.mockReturnValue(mockChain);
      supabase.from.mockReturnValue(mockChain);

      const result = await getDisputedArtifacts('project-1');
      expect(result).toEqual([]);
    });
  });
});
