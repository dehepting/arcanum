import type { Annotation } from '@/types';

export function getAnnotationsForEntity(
  entityId: string,
  entityType: string
): Promise<{ success: boolean; data: Annotation[] }>;

export function createAnnotationEntityLink(
  annotationId: string,
  entityId: string,
  entityType: string,
  relationshipType: string
): Promise<{ success: boolean }>;

export function deleteAnnotationEntityLink(
  annotationId: string,
  entityId: string,
  entityType: string
): Promise<{ success: boolean }>;

export function getEntitiesForAnnotation(
  annotationId: string
): Promise<{ success: boolean; data: any[] }>;
