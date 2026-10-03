/**
 * Tab Type Definitions
 *
 * Types for Arcanum's dynamic tab system.
 */

import type { Entity, EntityType } from './entities';

/**
 * Tab type discriminator
 * Includes generic tab types and specific entity types
 */
export type TabType = 'map' | 'pdf' | 'canvas' | 'review' | EntityType;

/**
 * PDF tab data
 */
export interface PDFTabData {
  source: {
    id: string;
    name: string;
    file_path: string;
  };
}

/**
 * Entity tab data
 */
export interface EntityTabData {
  entityId: string;
  entityType: EntityType;
  entity?: Entity; // Optional cached entity data
}

/**
 * Canvas tab data (Research Canvas/tldraw)
 */
export interface CanvasTabData {
  canvasId?: string;
  canvasName?: string;
}

/**
 * Review tab data (Entity review form)
 */
export interface ReviewTabData {
  mode?: 'create' | 'edit';
  entityType?: EntityType;
}

/**
 * Base tab interface
 */
export interface BaseTab {
  id: string;
  title: string;
  isDirty: boolean; // Has unsaved changes
}

/**
 * Specific tab types
 */
export interface MapTab extends BaseTab {
  type: 'map';
  data: null;
}

export interface PDFTab extends BaseTab {
  type: 'pdf';
  data: PDFTabData;
}

export interface EntityTab extends BaseTab {
  type: EntityType;
  data: EntityTabData;
}

export interface CanvasTab extends BaseTab {
  type: 'canvas';
  data: CanvasTabData;
}

export interface ReviewTab extends BaseTab {
  type: 'review';
  data: ReviewTabData;
}

/**
 * Union type of all tab types
 */
export type Tab = MapTab | PDFTab | EntityTab | CanvasTab | ReviewTab;

/**
 * Create tab input (for useStore.addTab)
 */
export interface CreateTabInput {
  id?: string; // Optional, will be generated if not provided
  type: TabType;
  title: string;
  data?: PDFTabData | EntityTabData | CanvasTabData | ReviewTabData | null;
  isDirty?: boolean;
  // Allow additional properties for backwards compatibility
  [key: string]: any;
}
