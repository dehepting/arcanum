import type { Person } from '@/types';

export interface CreatePersonInput {
  project_id: string;
  name: string;
  role: string;
  birth_year?: number | null;
  death_year?: number | null;
  bio?: string;
}

export function createPerson(
  personData: CreatePersonInput,
  annotationId?: string | null,
  relationshipType?: string
): Promise<Person>;

export function updatePerson(id: string, updates: Partial<CreatePersonInput>): Promise<Person>;

export function deletePerson(id: string): Promise<void>;
