import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import {
  getCurrentTimestamp,
  formatToolResponse,
  stringifyJsonField,
  parseJsonField,
} from '../utils/formatters.js';

export const artifactTools = [
  {
    name: 'create_artifact',
    description: 'Create a new artifact in a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        name: { type: 'string', description: 'Artifact name' },
        category: {
          type: 'string',
          description: 'Artifact category',
          enum: [
            'Pottery & Ceramics',
            'Coins & Currency',
            'Sculptures & Statues',
            'Paintings & Frescoes',
            'Manuscripts & Documents',
            'Jewelry & Ornaments',
            'Architecture',
            'Weaponry & Armor',
            'Textiles',
            'Religious Artifacts',
            'Other',
          ],
        },
        description: { type: 'string', description: 'Detailed description' },
        period: { type: 'string', description: 'Historical period' },
        estimated_age: { type: 'string', description: 'Estimated age/date' },
        material: { type: 'string', description: 'Material composition' },
        dimensions: { type: 'string', description: 'Physical dimensions' },
        condition: {
          type: 'string',
          description: 'Artifact condition',
          enum: ['excellent', 'good', 'fair', 'poor', 'fragmentary'],
        },
        current_owner: { type: 'string', description: 'Current owner/institution' },
        owner_type: {
          type: 'string',
          description: 'Type of owner',
          enum: ['museum', 'private', 'government', 'academic', 'religious', 'other'],
        },
        current_location: { type: 'string', description: 'Current physical location' },
        accession_number: { type: 'string', description: 'Museum accession number' },
        findspot_name: { type: 'string', description: 'Discovery location name' },
        findspot_lng: { type: 'number', description: 'Discovery location longitude' },
        findspot_lat: { type: 'number', description: 'Discovery location latitude' },
        image_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of image URLs',
        },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['project_id', 'name', 'category'],
    },
  },
  {
    name: 'search_artifacts',
    description: 'Search for artifacts by name, description, or other fields',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID to search within' },
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Filter by category' },
        limit: { type: 'number', description: 'Maximum results to return', default: 10 },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_artifact',
    description: 'Get detailed information about a specific artifact',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact UUID' },
      },
      required: ['artifact_id'],
    },
  },
  {
    name: 'batch_create_artifacts',
    description: 'Create multiple artifacts in a single operation for efficiency',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              period: { type: 'string' },
              estimated_age: { type: 'string' },
              material: { type: 'string' },
              dimensions: { type: 'string' },
              condition: { type: 'string' },
              current_owner: { type: 'string' },
              owner_type: { type: 'string' },
              current_location: { type: 'string' },
              accession_number: { type: 'string' },
              findspot_name: { type: 'string' },
              findspot_lng: { type: 'number' },
              findspot_lat: { type: 'number' },
              image_urls: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
            },
            required: ['name', 'category'],
          },
          description: 'Array of artifacts to create',
        },
      },
      required: ['project_id', 'artifacts'],
    },
  },
];

export const artifactHandlers = {
  create_artifact: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    // Build metadata JSON
    const metadata = {
      period: args.period || null,
      estimated_age: args.estimated_age || null,
      material: args.material || null,
      dimensions: args.dimensions || null,
      condition: args.condition || null,
      current_location: args.current_location || null,
      accession_number: args.accession_number || null,
      notes: args.notes || null,
    };

    // Handle findspot - check if place_id exists or create coordinates
    let findspotPlaceId = null;
    if (args.findspot_name && args.findspot_lng && args.findspot_lat) {
      // For now, store findspot info in metadata
      // In a real implementation, we could create a place entity
      metadata.findspot = {
        name: args.findspot_name,
        lng: args.findspot_lng,
        lat: args.findspot_lat,
      };
    }

    const stmt = db.prepare(`
      INSERT INTO artifacts (
        id, project_id, name, description, category,
        date_range, owner_type, owner_name, findspot_place_id,
        images, metadata, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const artifact = stmt.get(
      id,
      args.project_id,
      args.name,
      args.description || null,
      args.category,
      args.estimated_age || null,
      args.owner_type || null,
      args.current_owner || null,
      findspotPlaceId,
      stringifyJsonField(args.image_urls || []),
      stringifyJsonField(metadata),
      now,
      now
    );

    return formatToolResponse(
      `Artifact created successfully:\nID: ${artifact.id}\nName: ${artifact.name}\nCategory: ${artifact.category}`
    );
  },

  search_artifacts: (args) => {
    const db = getDatabase();
    const limit = args.limit || 10;

    let query = 'SELECT * FROM artifacts WHERE project_id = ?';
    const params = [args.project_id];

    if (args.query) {
      query += ' AND (name LIKE ? OR description LIKE ? OR metadata LIKE ?) COLLATE NOCASE';
      params.push(`%${args.query}%`, `%${args.query}%`, `%${args.query}%`);
    }

    if (args.category) {
      query += ' AND category = ?';
      params.push(args.category);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const artifacts = stmt.all(...params);

    // Parse JSON fields
    artifacts.forEach((a) => {
      a.images = parseJsonField(a.images, []);
      a.metadata = parseJsonField(a.metadata, {});
    });

    return formatToolResponse(
      `Found ${artifacts.length} artifacts:\n${JSON.stringify(artifacts, null, 2)}`
    );
  },

  get_artifact: (args) => {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM artifacts WHERE id = ?');
    const artifact = stmt.get(args.artifact_id);

    if (!artifact) {
      throw new Error(`Artifact not found: ${args.artifact_id}`);
    }

    // Parse JSON fields
    artifact.images = parseJsonField(artifact.images, []);
    artifact.metadata = parseJsonField(artifact.metadata, {});

    return formatToolResponse(`Artifact details:\n${JSON.stringify(artifact, null, 2)}`);
  },

  batch_create_artifacts: (args) => {
    const db = getDatabase();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO artifacts (
        id, project_id, name, description, category,
        date_range, owner_type, owner_name, findspot_place_id,
        images, metadata, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const artifacts = [];
    const insertMany = db.transaction((artifactsData) => {
      for (const a of artifactsData) {
        const id = generateUUID();

        const metadata = {
          period: a.period || null,
          estimated_age: a.estimated_age || null,
          material: a.material || null,
          dimensions: a.dimensions || null,
          condition: a.condition || null,
          current_location: a.current_location || null,
          accession_number: a.accession_number || null,
          notes: a.notes || null,
        };

        if (a.findspot_name && a.findspot_lng && a.findspot_lat) {
          metadata.findspot = {
            name: a.findspot_name,
            lng: a.findspot_lng,
            lat: a.findspot_lat,
          };
        }

        const artifact = stmt.get(
          id,
          args.project_id,
          a.name,
          a.description || null,
          a.category,
          a.estimated_age || null,
          a.owner_type || null,
          a.current_owner || null,
          null, // findspot_place_id
          stringifyJsonField(a.image_urls || []),
          stringifyJsonField(metadata),
          now,
          now
        );

        artifacts.push(artifact);
      }
    });

    insertMany(args.artifacts);

    return formatToolResponse(
      `Batch artifacts created successfully:\n${artifacts.length} artifacts created\n\n${artifacts.map((a) => `- ${a.name} (${a.category})`).join('\n')}`
    );
  },
};
