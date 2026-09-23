import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import {
  getCurrentTimestamp,
  formatToolResponse,
  stringifyJsonField,
  parseJsonField,
} from '../utils/formatters.js';

export const peopleTools = [
  {
    name: 'create_person',
    description: 'Create a person entity (historical figure, author, researcher, collector)',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        name: { type: 'string', description: 'Person name' },
        role: {
          type: 'string',
          description: 'Person role',
          enum: ['author', 'historical_figure', 'researcher', 'owner', 'collector'],
        },
        birth_year: { type: 'number', description: 'Birth year (negative for BC)' },
        death_year: { type: 'number', description: 'Death year (negative for BC)' },
        bio: { type: 'string', description: 'Biography' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['project_id', 'name'],
    },
  },
  {
    name: 'search_people',
    description: 'Search for people by name or role',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        query: { type: 'string', description: 'Search query for name' },
        role: { type: 'string', description: 'Filter by role' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['project_id'],
    },
  },
];

export const peopleHandlers = {
  create_person: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    // Store metadata as JSON
    const metadata = stringifyJsonField({
      birth_year: args.birth_year || null,
      death_year: args.death_year || null,
      occupation: args.role || null,
    });

    const stmt = db.prepare(`
      INSERT INTO people (id, project_id, name, description, birth_date, death_date, occupation, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const person = stmt.get(
      id,
      args.project_id,
      args.name,
      args.bio || null,
      args.birth_year ? String(args.birth_year) : null,
      args.death_year ? String(args.death_year) : null,
      args.role || null,
      metadata,
      now,
      now
    );

    return formatToolResponse(
      `Person created successfully:\nID: ${person.id}\nName: ${person.name}\nRole: ${person.occupation || 'not specified'}`
    );
  },

  search_people: (args) => {
    const db = getDatabase();
    const limit = args.limit || 10;

    let query = 'SELECT * FROM people WHERE project_id = ?';
    const params = [args.project_id];

    if (args.query) {
      query += ' AND (name LIKE ? OR description LIKE ?) COLLATE NOCASE';
      params.push(`%${args.query}%`, `%${args.query}%`);
    }

    if (args.role) {
      query += ' AND occupation = ?';
      params.push(args.role);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const people = stmt.all(...params);

    // Parse metadata for each person
    people.forEach((p) => {
      if (p.metadata) {
        p.metadata = parseJsonField(p.metadata, {});
      }
    });

    return formatToolResponse(`Found ${people.length} people:\n${JSON.stringify(people, null, 2)}`);
  },
};
