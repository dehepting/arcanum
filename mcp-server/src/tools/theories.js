import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import {
  getCurrentTimestamp,
  formatToolResponse,
  stringifyJsonField,
  parseJsonField,
} from '../utils/formatters.js';

export const theoryTools = [
  {
    name: 'create_theory',
    description: 'Create a research theory about a location, civilization, or artifact',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        name: { type: 'string', description: 'Theory name' },
        description: { type: 'string', description: 'Theory description' },
        proposed_location_id: {
          type: 'string',
          description: 'Place UUID if theory proposes a location',
        },
        status: {
          type: 'string',
          description: 'Theory status',
          enum: ['active', 'debunked', 'proven', 'historical'],
          default: 'active',
        },
        confidence_level: {
          type: 'number',
          description: 'Confidence level 1-5',
          minimum: 1,
          maximum: 5,
          default: 3,
        },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['project_id', 'name'],
    },
  },
  {
    name: 'search_theories',
    description: 'Search for theories by name or status',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        query: { type: 'string', description: 'Search query for name' },
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['project_id'],
    },
  },
];

export const theoryHandlers = {
  create_theory: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    // Store metadata as JSON
    const metadata = stringifyJsonField({
      proposed_location_id: args.proposed_location_id || null,
      status: args.status || 'active',
      confidence_level: args.confidence_level || 3,
    });

    const stmt = db.prepare(`
      INSERT INTO theories (id, project_id, name, description, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const theory = stmt.get(
      id,
      args.project_id,
      args.name,
      args.description || null,
      metadata,
      now,
      now
    );

    // Parse metadata for response
    const parsedMetadata = parseJsonField(theory.metadata, {});

    return formatToolResponse(
      `Theory created successfully:\nID: ${theory.id}\nName: ${theory.name}\nStatus: ${parsedMetadata.status}\nConfidence: ${parsedMetadata.confidence_level}/5`
    );
  },

  search_theories: (args) => {
    const db = getDatabase();
    const limit = args.limit || 10;

    let query = 'SELECT * FROM theories WHERE project_id = ?';
    const params = [args.project_id];

    if (args.query) {
      query += ' AND (name LIKE ? OR description LIKE ?) COLLATE NOCASE';
      params.push(`%${args.query}%`, `%${args.query}%`);
    }

    if (args.status) {
      // Search in metadata JSON field
      query += ' AND metadata LIKE ?';
      params.push(`%"status":"${args.status}"%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const theories = stmt.all(...params);

    // Parse metadata for each theory
    theories.forEach((t) => {
      if (t.metadata) {
        t.metadata = parseJsonField(t.metadata, {});
      }
    });

    return formatToolResponse(
      `Found ${theories.length} theories:\n${JSON.stringify(theories, null, 2)}`
    );
  },
};
