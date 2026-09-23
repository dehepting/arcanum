import * as tauri from './tauri';

const STORAGE_BUCKET = 'entity-pages';

/**
 * Get storage path for an entity page
 */
function getStoragePath(projectId, entityType, entityId) {
  return `${projectId}/entities/${entityType}/${entityId}.md`;
}

/**
 * Create a new entity page with hybrid storage
 */
export async function createEntityPage(
  projectId,
  entityId,
  entityType,
  title,
  content = '',
  metadata = {}
) {
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
    });

    return { data: page, error: null };
  } catch (error) {
    console.error('Error creating entity page:', error);
    return { data: null, error };
  }
}

/**
 * Get an entity page (metadata + content)
 */
export async function getEntityPage(entityId) {
  try {
    console.log('getEntityPage called with entityId:', entityId);

    // 1. Get metadata from database
    const page = await tauri.getEntityPage(entityId);
    console.log('Got page from database:', page);

    // If page doesn't exist, return null data
    if (!page) {
      console.log('Page does not exist, returning null');
      return { data: null, error: null };
    }

    // 2. Get content from storage
    console.log('Reading file from storage:', STORAGE_BUCKET, page.storage_path);
    const result = await tauri.readFile(STORAGE_BUCKET, page.storage_path);
    console.log('Read file result:', result);
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result));

    const decoder = new TextDecoder();
    // result.data is the array of bytes
    const content = decoder.decode(new Uint8Array(result.data));
    console.log('Decoded content:', content);

    return { data: { page, content }, error: null };
  } catch (error) {
    console.error('Error getting entity page:', error);
    console.error('Error stack:', error.stack);
    return { data: null, error };
  }
}

/**
 * Update entity page content
 */
export async function updateEntityPage(entityId, content, append = false, pageInfo = null) {
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
      const result = await tauri.readFile(STORAGE_BUCKET, page.storage_path);
      const decoder = new TextDecoder();
      const currentContent = decoder.decode(new Uint8Array(result.data));
      finalContent = currentContent + '\n\n' + content;
    }

    // 3. Update content in storage
    const encoder = new TextEncoder();
    const data = encoder.encode(finalContent);
    await tauri.uploadFile(STORAGE_BUCKET, page.storage_path, data);

    // 4. Update timestamp in database
    const updatedPage = await tauri.updateEntityPage(entityId, {});

    return { data: updatedPage, error: null };
  } catch (error) {
    console.error('Error updating entity page:', error);
    return { data: null, error };
  }
}

/**
 * Update entity page metadata
 */
export async function updateEntityPageMetadata(entityId, updates) {
  try {
    const page = await tauri.updateEntityPage(entityId, updates);
    return { data: page, error: null };
  } catch (error) {
    console.error('Error updating entity page metadata:', error);
    return { data: null, error };
  }
}

/**
 * Delete an entity page
 */
export async function deleteEntityPage(entityId) {
  try {
    // 1. Get page to find storage path
    const page = await tauri.getEntityPage(entityId);

    if (!page) {
      throw new Error('Entity page not found');
    }

    // 2. Delete from storage
    try {
      await tauri.deleteFile(STORAGE_BUCKET, page.storage_path);
    } catch (storageError) {
      console.warn('Failed to delete storage file:', storageError);
    }

    // 3. Delete from database
    await tauri.deleteEntityPage(entityId);

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting entity page:', error);
    return { data: false, error };
  }
}

/**
 * List all entity pages for a project
 */
export async function listEntityPages(projectId) {
  try {
    const pages = await tauri.loadEntityPages(projectId);
    return { data: pages, error: null };
  } catch (error) {
    console.error('Error listing entity pages:', error);
    return { data: [], error };
  }
}

/**
 * Search entity pages by title
 */
export async function searchEntityPages(projectId, query, entityTypes = null) {
  try {
    let pages = await tauri.loadEntityPages(projectId);

    // Filter by entity types if provided
    if (entityTypes && entityTypes.length > 0) {
      pages = pages.filter((p) => entityTypes.includes(p.entity_type));
    }

    // Search in title
    if (query) {
      const lowerQuery = query.toLowerCase();
      pages = pages.filter((p) => p.title.toLowerCase().includes(lowerQuery));
    }

    return { data: pages, error: null };
  } catch (error) {
    console.error('Error searching entity pages:', error);
    return { data: [], error };
  }
}

// Entity links - TODO: Add backend commands for entity_links table
export async function createEntityLink(
  projectId,
  fromEntityId,
  fromEntityType,
  toEntityId,
  toEntityType,
  relationshipType,
  verified = false,
  notes = null
) {
  console.warn('createEntityLink not yet implemented in Tauri backend');
  return { data: null, error: new Error('Not implemented') };
}

export async function getEntityLinks(entityId) {
  console.warn('getEntityLinks not yet implemented in Tauri backend');
  return { data: { outgoing: [], incoming: [] }, error: null };
}

export async function getProjectLinks(projectId) {
  console.warn('getProjectLinks not yet implemented in Tauri backend');
  return { data: [], error: null };
}
