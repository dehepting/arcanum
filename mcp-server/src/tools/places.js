import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import { getCurrentTimestamp, formatToolResponse } from '../utils/formatters.js';

export const placeTools = [
  {
    name: 'create_place',
    description: 'Create a map place/pin in a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        name: { type: 'string', description: 'Place name' },
        lng: { type: 'number', description: 'Longitude' },
        lat: { type: 'number', description: 'Latitude' },
        note: { type: 'string', description: 'Notes about this place' },
      },
      required: ['project_id', 'name', 'lng', 'lat'],
    },
  },
  {
    name: 'batch_create_places',
    description: 'Create multiple map places/pins in a single operation for efficiency',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        places: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              lng: { type: 'number' },
              lat: { type: 'number' },
              note: { type: 'string' },
            },
            required: ['name', 'lng', 'lat'],
          },
          description: 'Array of places to create',
        },
      },
      required: ['project_id', 'places'],
    },
  },
];

export const placeHandlers = {
  create_place: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO places (id, project_id, name, lng, lat, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const place = stmt.get(
      id,
      args.project_id,
      args.name,
      args.lng,
      args.lat,
      args.note || null,
      now,
      now
    );

    return formatToolResponse(`Place created successfully:\n${JSON.stringify(place, null, 2)}`);
  },

  batch_create_places: (args) => {
    const db = getDatabase();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO places (id, project_id, name, lng, lat, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const places = [];
    const insertMany = db.transaction((placesData) => {
      for (const p of placesData) {
        const id = generateUUID();
        const place = stmt.get(id, args.project_id, p.name, p.lng, p.lat, p.note || null, now, now);
        places.push(place);
      }
    });

    insertMany(args.places);

    return formatToolResponse(
      `Batch places created successfully:\n${places.length} places created\n\n${places.map((p) => `- ${p.name} (${p.lng}, ${p.lat})`).join('\n')}`
    );
  },
};
