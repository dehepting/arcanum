import * as tauri from './tauri';
import { logger } from '../utils/logger';
import type { EntityType, EntityPage } from '../types/entities';

const STORAGE_BUCKET = 'entity-pages';

type Result<T> = { data: T; error: null } | { data: null; error: Error };

interface PageInfo {
  projectId: string;
  entityType: EntityType;
  title: string;
}

interface EntityPageWithContent {
  page: EntityPage;
  content: string;
}

/**
 * Get storage path for an entity page
 */
function getStoragePath(projectId: string, entityType: EntityType, entityId: string): string {
  return `${projectId}/entities/${entityType}/${entityId}.md`;
}

/**
 * Create a new entity page with hybrid storage
 */
export async function createEntityPage(
  projectId: string,
  entityId: string,
  entityType: EntityType,
  title: string,
  content: string = '',
  metadata: Record<string, any> = {}
): Promise<Result<EntityPage>> {
  try {
    const storagePath = getStoragePath(projectId, entityType, entityId);

    // 1. Upload content to storage
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    await tauri.uploadFile(STORAGE_BUCKET, storagePath, data);

    // 2. Create metadata record in database
    const page = await tauri.createEntityPage({
      project_id: projectId,
      entity_id: entityId,
      entity_type: entityType,
      title,
      storage_path: storagePath,
      metadata: metadata ? JSON.stringify(metadata) : null,
    } as any);

    return { data: page, error: null };
  } catch (error) {
    logger.error('Error creating entity page:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get an entity page (metadata + content)
 */
export async function getEntityPage(entityId: string): Promise<Result<EntityPageWithContent>> {
  try {
    logger.debug('getEntityPage called with entityId:', entityId);

    // 1. Get metadata from database
    const page = await tauri.getEntityPage(entityId);

    // If page doesn't exist, return null data
    if (!page) {
      logger.debug('Page does not exist, returning null');
      return { data: null, error: null };
    }

    // 2. Get content from storage
    logger.debug('Reading file from storage:', STORAGE_BUCKET, (page as any).storage_path);
    const result = await tauri.readFile(STORAGE_BUCKET, (page as any).storage_path);

    const decoder = new TextDecoder();
    const content = decoder.decode(new Uint8Array(result.data));

    return { data: { page, content }, error: null };
  } catch (error) {
    logger.error('Error getting entity page:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update entity page content
 */
export async function updateEntityPage(
  entityId: string,
  content: string,
  append: boolean = false,
  pageInfo: PageInfo | null = null
): Promise<Result<EntityPage>> {
  try {
    // 1. Get current page metadata
    const page = await tauri.getEntityPage(entityId);

    // If page doesn't exist, create it
    if (!page) {
      if (!pageInfo || !pageInfo.projectId || !pageInfo.entityType || !pageInfo.title) {
        throw new Error('Cannot create entity page: missing projectId, entityType, or title');
      }
      return await createEntityPage(
        pageInfo.projectId,
        entityId,
        pageInfo.entityType,
        pageInfo.title,
        content
      );
    }

    let finalContent = content;

    // 2. If appending, get current content first
    if (append) {
      const result = await tauri.readFile(STORAGE_BUCKET, (page as any).storage_path);
      const decoder = new TextDecoder();
      const currentContent = decoder.decode(new Uint8Array(result.data));
      finalContent = currentContent + '\n\n' + content;
    }

    // 3. Update content in storage
    const encoder = new TextEncoder();
    const data = encoder.encode(finalContent);
    await tauri.uploadFile(STORAGE_BUCKET, (page as any).storage_path, data);

    // 4. Update timestamp in database
    const updatedPage = await tauri.updateEntityPage(entityId, {});

    return { data: updatedPage, error: null };
  } catch (error) {
    logger.error('Error updating entity page:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update entity page metadata
 */
export async function updateEntityPageMetadata(
  entityId: string,
  updates: Partial<EntityPage>
): Promise<Result<EntityPage>> {
  try {
    const page = await tauri.updateEntityPage(entityId, updates);
    return { data: page, error: null };
  } catch (error) {
    logger.error('Error updating entity page metadata:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete an entity page
 */
export async function deleteEntityPage(entityId: string): Promise<Result<boolean>> {
  try {
    // 1. Get page to find storage path
    const page = await tauri.getEntityPage(entityId);

    if (!page) {
      throw new Error('Entity page not found');
    }

    // 2. Delete from storage
    try {
      await tauri.deleteFile(STORAGE_BUCKET, (page as any).storage_path);
    } catch (storageError) {
      logger.warn('Failed to delete storage file:', storageError);
    }

    // 3. Delete from database
    await tauri.deleteEntityPage(entityId);

    return { data: true, error: null };
  } catch (error) {
    logger.error('Error deleting entity page:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * List all entity pages for a project
 */
export async function listEntityPages(projectId: string): Promise<Result<EntityPage[]>> {
  try {
    const pages = await tauri.loadEntityPages(projectId);
    return { data: pages, error: null };
  } catch (error) {
    logger.error('Error listing entity pages:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Search entity pages by title
 */
export async function searchEntityPages(
  projectId: string,
  query: string,
  entityTypes: EntityType[] | null = null
): Promise<Result<EntityPage[]>> {
  try {
    let pages = await tauri.loadEntityPages(projectId);

    // Filter by entity types if provided
    if (entityTypes && entityTypes.length > 0) {
      pages = pages.filter((p) => entityTypes.includes(p.entity_type as EntityType));
    }

    // Search in title
    if (query) {
      const lowerQuery = query.toLowerCase();
      pages = pages.filter((p) => (p as any).title.toLowerCase().includes(lowerQuery));
    }

    return { data: pages, error: null };
  } catch (error) {
    logger.error('Error searching entity pages:', error);
    return { data: null, error: error as Error };
  }
}

// Entity links - TODO: Add backend commands for entity_links table
export async function createEntityLink(
  _projectId: string,
  _fromEntityId: string,
  _fromEntityType: EntityType,
  _toEntityId: string,
  _toEntityType: EntityType,
  _relationshipType: string,
  _verified: boolean = false,
  _notes: string | null = null
): Promise<Result<null>> {
  logger.warn('createEntityLink not yet implemented in Tauri backend');
  return { data: null, error: new Error('Not implemented') };
}

export async function getEntityLinks(
  _entityId: string
): Promise<{ data: { outgoing: any[]; incoming: any[] }; error: null }> {
  logger.warn('getEntityLinks not yet implemented in Tauri backend');
  return { data: { outgoing: [], incoming: [] }, error: null };
}

export async function getProjectLinks(_projectId: string): Promise<{ data: any[]; error: null }> {
  logger.warn('getProjectLinks not yet implemented in Tauri backend');
  return { data: [], error: null };
}
