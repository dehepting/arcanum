/**
 * Zod Schemas for Common Types
 *
 * Schemas for Project, Source, MapOverlay, and other shared types.
 */

import { z } from 'zod';

/**
 * Project schema
 */
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Source schema (PDF documents)
 */
export const SourceSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  title: z.string().min(1),
  file_name: z.string().min(1),
  storage_path: z.string(),
  file_url: z.string(),
  file_size: z.number().int().nonnegative().optional(),
  mime_type: z.string().optional(),
  metadata: z.string().optional(), // JSON string
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Map overlay schema
 */
export const MapOverlaySchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1),
  image_path: z.string(),
  bounds: z
    .tuple([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number()])])
    .transform((val) => val as [[number, number], [number, number]]), // [[sw_lat, sw_lng], [ne_lat, ne_lng]]
  opacity: z.number().min(0).max(1),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * File read result schema
 */
export const FileReadResultSchema = z.object({
  data: z.instanceof(Uint8Array),
  mime_type: z.string().optional(),
});
