import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEvent,
  updateEvent,
  loadEvents,
  getEventsForAnnotation,
  getEventsForPlace,
  deleteEvent,
  linkEventToAnnotation,
  linkEventToPlace,
  unlinkEventFromAnnotation,
  unlinkEventFromPlace,
} from './events';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('events library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create event without annotation link', async () => {
      const eventData = {
        project_id: 'project-1',
        name: 'Plato writes Timaeus',
        date_year: -360,
        date_precision: 'circa',
        event_type: 'publication',
        description: 'First mention of Atlantis',
      };

      const createdEvent = {
        id: 'event-1',
        ...eventData,
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdEvent, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await createEvent(eventData);

      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(mockChain.insert).toHaveBeenCalledWith([eventData]);
      expect(result).toEqual(createdEvent);
    });

    it('should create event with annotation link', async () => {
      const eventData = {
        project_id: 'project-1',
        name: 'Battle of Marathon',
        date_year: -490,
        event_type: 'battle',
      };

      const createdEvent = { id: 'event-1', ...eventData };

      supabase.from.mockImplementation((table) => {
        if (table === 'events') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdEvent, error: null }),
          };
        } else if (table === 'annotation_events_links') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
      });

      const result = await createEvent(eventData, 'annotation-1', 'describes');

      expect(result).toEqual(createdEvent);
    });

    it('should throw error when event creation fails', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(createEvent({ name: 'Test' })).rejects.toThrow('Failed to create event');
    });
  });

  describe('updateEvent', () => {
    it('should update event name', async () => {
      const updates = { name: 'Updated Event Name' };
      const updatedEvent = {
        id: 'event-1',
        name: 'Updated Event Name',
        event_type: 'discovery',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedEvent, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await updateEvent('event-1', updates);

      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(mockChain.update).toHaveBeenCalledWith(updates);
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'event-1');
      expect(result).toEqual(updatedEvent);
    });

    it('should throw error when update fails', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(updateEvent('event-1', { name: 'Test' })).rejects.toThrow(
        'Failed to update event'
      );
    });
  });

  describe('loadEvents', () => {
    it('should load events with annotation and place links', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Discovery',
          annotation_events_links: [{ annotation_id: 'ann-1', relationship_type: 'describes' }],
          event_places_links: [{ place_id: 'place-1', relationship_type: 'occurred_at' }],
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadEvents('project-1');

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockEvents);
    });

    it('should return empty array when no events', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await loadEvents('project-1');
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(loadEvents('project-1')).rejects.toThrow('Failed to load events');
    });
  });

  describe('getEventsForAnnotation', () => {
    it('should get events for annotation', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Battle',
        event_type: 'battle',
      };

      const mockData = [
        {
          relationship_type: 'describes',
          quote: 'The battle occurred...',
          events: mockEvent,
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getEventsForAnnotation('annotation-1');

      expect(mockChain.eq).toHaveBeenCalledWith('annotation_id', 'annotation-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Battle');
      expect(result[0].relationship_type).toBe('describes');
    });

    it('should return empty array when no events', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getEventsForAnnotation('annotation-1');
      expect(result).toEqual([]);
    });
  });

  describe('getEventsForPlace', () => {
    it('should get events for place', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Discovery',
      };

      const mockData = [
        {
          relationship_type: 'occurred_at',
          events: mockEvent,
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await getEventsForPlace('place-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Discovery');
      expect(result[0].relationship_type).toBe('occurred_at');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await deleteEvent('event-1');

      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'event-1');
    });

    it('should throw error when delete fails', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(deleteEvent('event-1')).rejects.toThrow('Failed to delete event');
    });
  });

  describe('linkEventToAnnotation', () => {
    it('should link event to annotation', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await linkEventToAnnotation('event-1', 'annotation-1', 'describes', 'Quote');

      expect(supabase.from).toHaveBeenCalledWith('annotation_events_links');
      expect(mockChain.insert).toHaveBeenCalledWith([
        {
          annotation_id: 'annotation-1',
          event_id: 'event-1',
          relationship_type: 'describes',
          quote: 'Quote',
        },
      ]);
    });
  });

  describe('linkEventToPlace', () => {
    it('should link event to place', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      supabase.from.mockReturnValue(mockChain);

      await linkEventToPlace('event-1', 'place-1', 'occurred_at');

      expect(supabase.from).toHaveBeenCalledWith('event_places_links');
      expect(mockChain.insert).toHaveBeenCalledWith([
        {
          event_id: 'event-1',
          place_id: 'place-1',
          relationship_type: 'occurred_at',
        },
      ]);
    });
  });

  describe('unlinkEventFromAnnotation', () => {
    it('should unlink event from annotation', async () => {
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

      await unlinkEventFromAnnotation('event-1', 'annotation-1');

      expect(supabase.from).toHaveBeenCalledWith('annotation_events_links');
      expect(eq1Mock).toHaveBeenCalledWith('event_id', 'event-1');
      expect(eq2Mock).toHaveBeenCalledWith('annotation_id', 'annotation-1');
    });
  });

  describe('unlinkEventFromPlace', () => {
    it('should unlink event from place', async () => {
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

      await unlinkEventFromPlace('event-1', 'place-1');

      expect(supabase.from).toHaveBeenCalledWith('event_places_links');
      expect(eq1Mock).toHaveBeenCalledWith('event_id', 'event-1');
      expect(eq2Mock).toHaveBeenCalledWith('place_id', 'place-1');
    });
  });
});
