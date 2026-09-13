import { supabase, BUCKETS } from './supabase';

/**
 * Upload a PDF file to Supabase Storage and create a source record
 * @param {File} file - The PDF file to upload
 * @param {string} projectId - The project ID to associate with this source
 * @returns {Promise<Object>} The created source record
 */
export async function uploadPDF(file, projectId) {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.type !== 'application/pdf') {
    throw new Error('File must be a PDF');
  }

  // Create a unique file path: project_id/timestamp_filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${projectId}/${timestamp}_${sanitizedName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKETS.SOURCES)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKETS.SOURCES).getPublicUrl(uploadData.path);

  // Create source record in database
  const { data: source, error: dbError } = await supabase
    .from('sources')
    .insert([
      {
        project_id: projectId,
        title: file.name,
        file_url: urlData.publicUrl,
        file_type: 'pdf',
      },
    ])
    .select()
    .single();

  if (dbError) {
    // If database insert fails, try to clean up the uploaded file
    await supabase.storage.from(BUCKETS.SOURCES).remove([filePath]);
    throw new Error(`Database error: ${dbError.message}`);
  }

  return source;
}

/**
 * Load all sources for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of source records
 */
export async function loadSources(projectId) {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load sources: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a source and its file
 * @param {string} sourceId - The source ID to delete
 * @param {string} fileUrl - The file URL to extract path from
 */
export async function deleteSource(sourceId, fileUrl) {
  // Extract file path from URL
  // URL format: https://[project].supabase.co/storage/v1/object/public/sources/[path]
  const urlParts = fileUrl.split('/sources/');
  if (urlParts.length === 2) {
    const filePath = urlParts[1];

    // Delete from storage
    await supabase.storage.from(BUCKETS.SOURCES).remove([filePath]);
  }

  // Delete from database
  const { error } = await supabase.from('sources').delete().eq('id', sourceId);

  if (error) {
    throw new Error(`Failed to delete source: ${error.message}`);
  }
}
