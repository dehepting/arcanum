import type { Event } from '@/types';

export interface CreateEventInput {
  project_id: string;
  name: string;
  date_year?: number | null;
  date_precision?: string;
  event_type?: string;
  description?: string;
}

export function createEvent(
  eventData: CreateEventInput,
  annotationId?: string | null,
  relationshipType?: string
): Promise<Event>;

export function updateEvent(id: string, updates: Partial<CreateEventInput>): Promise<Event>;

export function deleteEvent(id: string): Promise<void>;
