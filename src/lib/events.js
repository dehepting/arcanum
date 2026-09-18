import { supabase } from './supabase';

/**
 * Create a new event and optionally link to annotation or place
 * @param {Object} eventData - { project_id, name, date_year, date_precision, event_type, description, notes }
 * @param {string} annotationId - Optional annotation ID to link
 * @param {string} relationshipType - Type of relationship (mentions, describes, occurred_during)
 * @returns {Promise<Object>} The created event
 */
export async function createEvent(eventData, annotationId = null, relationshipType = 'mentions') {
  // Create the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (eventError) {
    throw new Error(`Failed to create event: ${eventError.message}`);
  }

  // Link to annotation if provided
  if (annotationId) {
    const { error: linkError } = await supabase.from('annotation_events_links').insert([
      {
        annotation_id: annotationId,
        event_id: event.id,
        relationship_type: relationshipType,
      },
    ]);

    if (linkError) {
      throw new Error(`Failed to link annotation to event: ${linkError.message}`);
    }
  }

  return event;
}

/**
 * Update an event's properties
 * @param {string} eventId - The event ID to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} The updated event
 */
export async function updateEvent(eventId, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }

  return data;
}

/**
 * Load all events for a project with their linked annotations
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of events with annotations
 */
export async function loadEvents(projectId) {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      annotation_events_links (
        annotation_id,
        relationship_type
      ),
      event_places_links (
        place_id,
        relationship_type
      )
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load events: ${error.message}`);
  }

  return data || [];
}

/**
 * Get events linked to an annotation
 * @param {string} annotationId - The annotation ID
 * @returns {Promise<Array>} Array of linked events with relationship info
 */
export async function getEventsForAnnotation(annotationId) {
  const { data, error } = await supabase
    .from('annotation_events_links')
    .select(
      `
      relationship_type,
      quote,
      events (*)
    `
    )
    .eq('annotation_id', annotationId);

  if (error) {
    throw new Error(`Failed to get events: ${error.message}`);
  }

  return (
    data?.map((item) => ({
      ...item.events,
      relationship_type: item.relationship_type,
      quote: item.quote,
    })) || []
  );
}

/**
 * Get events linked to a place
 * @param {string} placeId - The place ID
 * @returns {Promise<Array>} Array of linked events
 */
export async function getEventsForPlace(placeId) {
  const { data, error } = await supabase
    .from('event_places_links')
    .select(
      `
      relationship_type,
      events (*)
    `
    )
    .eq('place_id', placeId);

  if (error) {
    throw new Error(`Failed to get events for place: ${error.message}`);
  }

  return data?.map((item) => ({ ...item.events, relationship_type: item.relationship_type })) || [];
}

/**
 * Delete an event and its links
 * @param {string} eventId - The event ID to delete
 */
export async function deleteEvent(eventId) {
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
}

/**
 * Link event to annotation
 * @param {string} eventId - The event ID
 * @param {string} annotationId - The annotation ID
 * @param {string} relationshipType - Type of relationship (mentions, describes, occurred_during)
 * @param {string} quote - Optional quote from the annotation
 */
export async function linkEventToAnnotation(
  eventId,
  annotationId,
  relationshipType = 'mentions',
  quote = null
) {
  const { error } = await supabase.from('annotation_events_links').insert([
    {
      annotation_id: annotationId,
      event_id: eventId,
      relationship_type: relationshipType,
      quote,
    },
  ]);

  if (error) {
    throw new Error(`Failed to link event to annotation: ${error.message}`);
  }
}

/**
 * Link event to place
 * @param {string} eventId - The event ID
 * @param {string} placeId - The place ID
 * @param {string} relationshipType - Type of relationship (occurred_at, discovered_at, affected)
 */
export async function linkEventToPlace(eventId, placeId, relationshipType = 'occurred_at') {
  const { error } = await supabase.from('event_places_links').insert([
    {
      event_id: eventId,
      place_id: placeId,
      relationship_type: relationshipType,
    },
  ]);

  if (error) {
    throw new Error(`Failed to link event to place: ${error.message}`);
  }
}

/**
 * Unlink event from annotation
 * @param {string} eventId - The event ID
 * @param {string} annotationId - The annotation ID
 */
export async function unlinkEventFromAnnotation(eventId, annotationId) {
  const { error } = await supabase
    .from('annotation_events_links')
    .delete()
    .eq('event_id', eventId)
    .eq('annotation_id', annotationId);

  if (error) {
    throw new Error(`Failed to unlink event: ${error.message}`);
  }
}

/**
 * Unlink event from place
 * @param {string} eventId - The event ID
 * @param {string} placeId - The place ID
 */
export async function unlinkEventFromPlace(eventId, placeId) {
  const { error } = await supabase
    .from('event_places_links')
    .delete()
    .eq('event_id', eventId)
    .eq('place_id', placeId);

  if (error) {
    throw new Error(`Failed to unlink event from place: ${error.message}`);
  }
}
