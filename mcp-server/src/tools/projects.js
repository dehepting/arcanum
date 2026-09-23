import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import { getCurrentTimestamp, formatToolResponse } from '../utils/formatters.js';

export const projectTools = [
  {
    name: 'create_project',
    description: 'Create a new research project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        map_center_lng: { type: 'number', description: 'Map center longitude', default: -20.0 },
        map_center_lat: { type: 'number', description: 'Map center latitude', default: 36.0 },
        map_zoom: { type: 'number', description: 'Map zoom level', default: 3.4 },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_projects',
    description: 'List all projects',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export const projectHandlers = {
  create_project: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO projects (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);

    const project = stmt.get(id, args.name, args.description || null, now, now);

    return formatToolResponse(`Project created successfully:\n${JSON.stringify(project, null, 2)}`);
  },

  list_projects: (args) => {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM projects
      ORDER BY created_at DESC
    `);

    const projects = stmt.all();

    return formatToolResponse(
      `Found ${projects.length} projects:\n${JSON.stringify(projects, null, 2)}`
    );
  },
};
