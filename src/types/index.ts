/**
 * Type Definitions Index
 *
 * Central export point for all TypeScript types.
 * Import from here instead of individual files:
 *
 * @example
 * import type { Person, Annotation, Tab, StoreState } from '@/types';
 */

// Entity types
export type {
  BaseEntity,
  Person,
  Event,
  Theory,
  Place,
  Artifact,
  Entity,
  EntityType,
  EntityTypeMap,
  CreatePersonInput,
  CreateEventInput,
  CreateTheoryInput,
  CreatePlaceInput,
  CreateArtifactInput,
  UpdatePersonInput,
  UpdateEventInput,
  UpdateTheoryInput,
  UpdatePlaceInput,
  UpdateArtifactInput,
  EntityLink,
  AnnotationEntityLink,
  EntityPage,
} from './entities';

// Annotation types
export type {
  AnnotationType,
  Geometry,
  InkMetadata,
  Annotation,
  AnnotationWithGeometry,
  InkAnnotation,
  CreateAnnotationInput,
  UpdateAnnotationInput,
  AnnotationWithLinks,
  PlacePin,
  ArtifactAnnotationLink,
} from './annotations';

// Tab types
export type {
  TabType,
  PDFTabData,
  EntityTabData,
  CanvasTabData,
  ReviewTabData,
  BaseTab,
  MapTab,
  PDFTab,
  EntityTab,
  CanvasTab,
  ReviewTab,
  Tab,
  CreateTabInput,
} from './tabs';

// Store types
export type { Project, Source, MapOverlay, PendingLocationEntity, StoreState } from './store';
