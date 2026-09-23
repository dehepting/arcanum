import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import {
  getCurrentTimestamp,
  formatToolResponse,
  stringifyJsonField,
  parseJsonField,
} from '../utils/formatters.js';

export const eventTools = [
  {
    name: 'create_event',
    description: 'Create a historical event (discovery, publication, battle, expedition)',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        name: { type: 'string', description: 'Event name' },
        date_year: { type: 'number', description: 'Year of event (negative for BC)' },
        date_precision: {
          type: 'string',
          description: 'Date precision level',
          enum: ['year', 'decade', 'century', 'circa'],
          default: 'year',
        },
        event_type: {
          type: 'string',
          description: 'Type of event',
          enum: ['disaster', 'discovery', 'publication', 'battle', 'expedition'],
        },
        description: { type: 'string', description: 'Event description' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['project_id', 'name'],
    },
  },
  {
    name: 'search_events',
    description: 'Search for events by name or type',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        query: { type: 'string', description: 'Search query for name' },
        event_type: { type: 'string', description: 'Filter by event type' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['project_id'],
    },
  },
];

export const eventHandlers = {
  create_event: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    // Store metadata as JSON
    const metadata = stringifyJsonField({
      date_year: args.date_year || null,
      date_precision: args.date_precision || 'year',
      event_type: args.event_type || null,
    });

    const stmt = db.prepare(`
      INSERT INTO events (id, project_id, name, description, event_date, location, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const event = stmt.get(
      id,
      args.project_id,
      args.name,
      args.description || null,
      args.date_year ? String(args.date_year) : null,
      null, // location is handled via event_places_links
      metadata,
      now,
      now
    );

    return formatToolResponse(
      `Event created successfully:\nID: ${event.id}\nName: ${event.name}\nDate: ${event.event_date || 'not specified'}`
    );
  },

  search_events: (args) => {
    const db = getDatabase();
    const limit = args.limit || 10;

    let query = 'SELECT * FROM events WHERE project_id = ?';
    const params = [args.project_id];

    if (args.query) {
      query += ' AND (name LIKE ? OR description LIKE ?) COLLATE NOCASE';
      params.push(`%${args.query}%`, `%${args.query}%`);
    }

    if (args.event_type) {
      // Search in metadata JSON field
      query += ' AND metadata LIKE ?';
      params.push(`%"event_type":"${args.event_type}"%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const events = stmt.all(...params);

    // Parse metadata for each event
    events.forEach((e) => {
      if (e.metadata) {
        e.metadata = parseJsonField(e.metadata, {});
      }
    });

    return formatToolResponse(`Found ${events.length} events:\n${JSON.stringify(events, null, 2)}`);
  },
};
