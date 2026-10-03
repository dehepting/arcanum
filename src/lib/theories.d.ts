import type { Theory } from '@/types';

export interface CreateTheoryInput {
  project_id: string;
  name: string;
  description?: string;
  status?: string;
  confidence_level?: number;
}

export function createTheory(
  theoryData: CreateTheoryInput,
  annotationId?: string | null,
  relationshipType?: string
): Promise<Theory>;

export function updateTheory(id: string, updates: Partial<CreateTheoryInput>): Promise<Theory>;

export function deleteTheory(id: string): Promise<void>;
