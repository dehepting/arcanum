import { supabase } from './supabase';

/**
 * Create a new person and optionally link to annotation
 * @param {Object} personData - { project_id, name, role, birth_year, death_year, bio, notes }
 * @param {string} annotationId - Optional annotation ID to link
 * @param {string} relationshipType - Type of relationship (mentions, authored_by, about)
 * @returns {Promise<Object>} The created person
 */
export async function createPerson(personData, annotationId = null, relationshipType = 'mentions') {
  // Create the person
  const { data: person, error: personError } = await supabase
    .from('people')
    .insert([personData])
    .select()
    .single();

  if (personError) {
    throw new Error(`Failed to create person: ${personError.message}`);
  }

  // Link to annotation if provided
  if (annotationId) {
    const { error: linkError } = await supabase.from('annotation_people_links').insert([
      {
        annotation_id: annotationId,
        person_id: person.id,
        relationship_type: relationshipType,
      },
    ]);

    if (linkError) {
      throw new Error(`Failed to link annotation to person: ${linkError.message}`);
    }
  }

  return person;
}

/**
 * Update a person's properties
 * @param {string} personId - The person ID to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} The updated person
 */
export async function updatePerson(personId, updates) {
  const { data, error } = await supabase
    .from('people')
    .update(updates)
    .eq('id', personId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update person: ${error.message}`);
  }

  return data;
}

/**
 * Load all people for a project with their linked annotations
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of people with annotations
 */
export async function loadPeople(projectId) {
  const { data, error } = await supabase
    .from('people')
    .select(
      `
      *,
      annotation_people_links (
        annotation_id,
        relationship_type
      )
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load people: ${error.message}`);
  }

  return data || [];
}

/**
 * Get people linked to an annotation
 * @param {string} annotationId - The annotation ID
 * @returns {Promise<Array>} Array of linked people with relationship info
 */
export async function getPeopleForAnnotation(annotationId) {
  const { data, error } = await supabase
    .from('annotation_people_links')
    .select(
      `
      relationship_type,
      quote,
      people (*)
    `
    )
    .eq('annotation_id', annotationId);

  if (error) {
    throw new Error(`Failed to get people: ${error.message}`);
  }

  return (
    data?.map((item) => ({
      ...item.people,
      relationship_type: item.relationship_type,
      quote: item.quote,
    })) || []
  );
}

/**
 * Delete a person and their links
 * @param {string} personId - The person ID to delete
 */
export async function deletePerson(personId) {
  const { error } = await supabase.from('people').delete().eq('id', personId);

  if (error) {
    throw new Error(`Failed to delete person: ${error.message}`);
  }
}

/**
 * Link person to annotation
 * @param {string} personId - The person ID
 * @param {string} annotationId - The annotation ID
 * @param {string} relationshipType - Type of relationship (mentions, authored_by, about)
 * @param {string} quote - Optional quote from the annotation
 */
export async function linkPersonToAnnotation(
  personId,
  annotationId,
  relationshipType = 'mentions',
  quote = null
) {
  const { error } = await supabase.from('annotation_people_links').insert([
    {
      annotation_id: annotationId,
      person_id: personId,
      relationship_type: relationshipType,
      quote,
    },
  ]);

  if (error) {
    throw new Error(`Failed to link person to annotation: ${error.message}`);
  }
}

/**
 * Unlink person from annotation
 * @param {string} personId - The person ID
 * @param {string} annotationId - The annotation ID
 */
export async function unlinkPersonFromAnnotation(personId, annotationId) {
  const { error } = await supabase
    .from('annotation_people_links')
    .delete()
    .eq('person_id', personId)
    .eq('annotation_id', annotationId);

  if (error) {
    throw new Error(`Failed to unlink person: ${error.message}`);
  }
}
