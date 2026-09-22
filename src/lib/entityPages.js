import { supabase } from './supabase';

const STORAGE_BUCKET = 'entity-pages';

/**
 * Get storage path for an entity page
 */
function getStoragePath(projectId, entityType, entityId) {
  return `${projectId}/entities/${entityType}/${entityId}.md`;
}

/**
 * Create a new entity page with hybrid storage
 * @param {string} projectId - Project UUID
 * @param {string} entityId - Entity UUID (from people, events, theories, places, or artifacts table)
 * @param {string} entityType - Type of entity ('person', 'event', 'theory', 'place', 'artifact')
 * @param {string} title - Page title (usually entity name)
 * @param {string} content - Markdown content
 * @param {object} metadata - Optional metadata (tags, custom fields, etc.)
 * @returns {Promise<{data: object, error: Error}>}
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
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, content, {
        contentType: 'text/markdown',
        upsert: false,
      });

    if (storageError) throw storageError;

    // 2. Create metadata record in database
    const { data, error: dbError } = await supabase
      .from('entity_pages')
      .insert([
        {
          project_id: projectId,
          entity_id: entityId,
          entity_type: entityType,
          title,
          storage_path: storagePath,
          metadata,
        },
      ])
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw dbError;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating entity page:', error);
    return { data: null, error };
  }
}

/**
 * Get an entity page (metadata + content)
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{data: {page: object, content: string}, error: Error}>}
 */
export async function getEntityPage(entityId) {
  try {
    // 1. Get metadata from database
    const { data: page, error: dbError } = await supabase
      .from('entity_pages')
      .select('*')
      .eq('entity_id', entityId)
      .maybeSingle();

    if (dbError) throw dbError;

    // If page doesn't exist, return null data (not an error - it's a new entity)
    if (!page) {
      return { data: null, error: null };
    }

    // 2. Get content from storage
    const { data: contentData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(page.storage_path);

    if (storageError) throw storageError;

    const content = await contentData.text();

    return { data: { page, content }, error: null };
  } catch (error) {
    console.error('Error getting entity page:', error);
    return { data: null, error };
  }
}

/**
 * Update entity page content (creates page if it doesn't exist)
 * @param {string} entityId - Entity UUID
 * @param {string} content - New markdown content
 * @param {boolean} append - If true, append to existing content instead of replacing
 * @param {object} pageInfo - Required for new pages: { projectId, entityType, title }
 * @returns {Promise<{data: object, error: Error}>}
 */
export async function updateEntityPage(entityId, content, append = false, pageInfo = null) {
  try {
    // 1. Get current page metadata
    const { data: page, error: dbError } = await supabase
      .from('entity_pages')
      .select('*')
      .eq('entity_id', entityId)
      .maybeSingle();

    if (dbError) throw dbError;

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
      const { data: currentData, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(page.storage_path);

      if (downloadError) throw downloadError;

      const currentContent = await currentData.text();
      finalContent = currentContent + '\n\n' + content;
    }

    // 3. Update content in storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .update(page.storage_path, finalContent, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (storageError) throw storageError;

    // 4. Update timestamp in database (triggers updated_at)
    const { data: updatedPage, error: updateError } = await supabase
      .from('entity_pages')
      .update({ updated_at: new Date().toISOString() })
      .eq('entity_id', entityId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { data: updatedPage, error: null };
  } catch (error) {
    console.error('Error updating entity page:', error);
    return { data: null, error };
  }
}

/**
 * Update entity page metadata (title, tags, etc.)
 * @param {string} entityId - Entity UUID
 * @param {object} updates - Fields to update (title, metadata)
 * @returns {Promise<{data: object, error: Error}>}
 */
export async function updateEntityPageMetadata(entityId, updates) {
  try {
    const { data, error } = await supabase
      .from('entity_pages')
      .update(updates)
      .eq('entity_id', entityId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating entity page metadata:', error);
    return { data: null, error };
  }
}

/**
 * Delete an entity page (removes from both DB and storage)
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{data: boolean, error: Error}>}
 */
export async function deleteEntityPage(entityId) {
  try {
    // 1. Get page to find storage path
    const { data: page, error: dbError } = await supabase
      .from('entity_pages')
      .select('storage_path')
      .eq('entity_id', entityId)
      .single();

    if (dbError) throw dbError;
    if (!page) throw new Error('Entity page not found');

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([page.storage_path]);

    if (storageError) {
      console.warn('Failed to delete storage file:', storageError);
      // Continue anyway - DB record is more important
    }

    // 3. Delete from database
    const { error: deleteError } = await supabase
      .from('entity_pages')
      .delete()
      .eq('entity_id', entityId);

    if (deleteError) throw deleteError;

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting entity page:', error);
    return { data: false, error };
  }
}

/**
 * Search entity pages by content or metadata
 * @param {string} projectId - Project UUID
 * @param {string} query - Search query
 * @param {string[]} entityTypes - Filter by entity types (optional)
 * @returns {Promise<{data: object[], error: Error}>}
 */
export async function searchEntityPages(projectId, query, entityTypes = null) {
  try {
    let queryBuilder = supabase.from('entity_pages').select('*').eq('project_id', projectId);

    // Filter by entity types if provided
    if (entityTypes && entityTypes.length > 0) {
      queryBuilder = queryBuilder.in('entity_type', entityTypes);
    }

    // Search in title (content search requires loading files, done client-side)
    if (query) {
      queryBuilder = queryBuilder.ilike('title', `%${query}%`);
    }

    queryBuilder = queryBuilder.order('updated_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error searching entity pages:', error);
    return { data: [], error };
  }
}

/**
 * List all entity pages for a project
 * @param {string} projectId - Project UUID
 * @returns {Promise<{data: object[], error: Error}>}
 */
export async function listEntityPages(projectId) {
  try {
    const { data, error } = await supabase
      .from('entity_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error listing entity pages:', error);
    return { data: [], error };
  }
}

/**
 * Create a link between two entities
 * @param {string} projectId - Project UUID
 * @param {string} fromEntityId - Source entity UUID
 * @param {string} fromEntityType - Source entity type
 * @param {string} toEntityId - Target entity UUID
 * @param {string} toEntityType - Target entity type
 * @param {string} relationshipType - Type of relationship
 * @param {boolean} verified - Whether relationship is verified
 * @param {string} notes - Optional notes about the relationship
 * @returns {Promise<{data: object, error: Error}>}
 */
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
  try {
    const { data, error } = await supabase
      .from('entity_links')
      .insert([
        {
          project_id: projectId,
          from_entity_id: fromEntityId,
          from_entity_type: fromEntityType,
          to_entity_id: toEntityId,
          to_entity_type: toEntityType,
          relationship_type: relationshipType,
          verified,
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating entity link:', error);
    return { data: null, error };
  }
}

/**
 * Get all links for an entity (both incoming and outgoing)
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{data: {outgoing: object[], incoming: object[]}, error: Error}>}
 */
export async function getEntityLinks(entityId) {
  try {
    // Get outgoing links
    const { data: outgoing, error: outError } = await supabase
      .from('entity_links')
      .select('*')
      .eq('from_entity_id', entityId);

    if (outError) throw outError;

    // Get incoming links
    const { data: incoming, error: inError } = await supabase
      .from('entity_links')
      .select('*')
      .eq('to_entity_id', entityId);

    if (inError) throw inError;

    return { data: { outgoing, incoming }, error: null };
  } catch (error) {
    console.error('Error getting entity links:', error);
    return { data: { outgoing: [], incoming: [] }, error };
  }
}

/**
 * Get all links for a project (for network graph)
 * @param {string} projectId - Project UUID
 * @returns {Promise<{data: object[], error: Error}>}
 */
export async function getProjectLinks(projectId) {
  try {
    const { data, error } = await supabase
      .from('entity_links')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error getting project links:', error);
    return { data: [], error };
  }
}
