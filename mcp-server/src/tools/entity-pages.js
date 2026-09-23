import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import { getCurrentTimestamp, formatToolResponse } from '../utils/formatters.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import os from 'os';

/**
 * Get storage path for entity page content
 */
function getEntityPageStoragePath(projectId, entityType, entityId) {
  const homeDir = os.homedir();
  const basePath = join(homeDir, 'Library', 'Application Support', 'com.arcanum.app', 'storage');
  const entityPath = join(basePath, projectId, 'entities', entityType);

  // Create directories if they don't exist
  if (!existsSync(entityPath)) {
    mkdirSync(entityPath, { recursive: true });
  }

  return join(entityPath, `${entityId}.md`);
}

export const entityPageTools = [
  {
    name: 'create_entity_page',
    description: 'Create an entity page with markdown content for detailed notes and research',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        entity_id: {
          type: 'string',
          description: 'Entity UUID (person, event, theory, place, artifact)',
        },
        entity_type: {
          type: 'string',
          description: 'Type of entity',
          enum: ['person', 'event', 'theory', 'place', 'artifact'],
        },
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Markdown content for the page' },
      },
      required: ['project_id', 'entity_id', 'entity_type', 'title', 'content'],
    },
  },
  {
    name: 'get_entity_page',
    description: 'Get an entity page including its full markdown content',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: { type: 'string', description: 'Entity UUID' },
      },
      required: ['entity_id'],
    },
  },
  {
    name: 'update_entity_page',
    description: 'Update an entity page by replacing or appending content',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: { type: 'string', description: 'Entity UUID' },
        content: { type: 'string', description: 'New or additional markdown content' },
        mode: {
          type: 'string',
          description: 'Update mode: replace entire content or append to it',
          enum: ['replace', 'append'],
          default: 'replace',
        },
      },
      required: ['entity_id', 'content'],
    },
  },
  {
    name: 'add_entity_note',
    description: 'Add a timestamped note to an entity page (appends with timestamp)',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: { type: 'string', description: 'Entity UUID' },
        note: { type: 'string', description: 'Note content' },
      },
      required: ['entity_id', 'note'],
    },
  },
  {
    name: 'link_entity_pages',
    description: 'Create a relationship link between two entity pages',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        from_entity_id: { type: 'string', description: 'Source entity UUID' },
        from_entity_type: { type: 'string', description: 'Source entity type' },
        to_entity_id: { type: 'string', description: 'Target entity UUID' },
        to_entity_type: { type: 'string', description: 'Target entity type' },
        relationship_type: { type: 'string', description: 'Type of relationship' },
        verified: {
          type: 'boolean',
          description: 'Is this relationship verified?',
          default: false,
        },
        notes: { type: 'string', description: 'Notes about the relationship' },
      },
      required: [
        'project_id',
        'from_entity_id',
        'from_entity_type',
        'to_entity_id',
        'to_entity_type',
      ],
    },
  },
  {
    name: 'search_entity_pages',
    description: 'Search for entity pages by title or type',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        query: { type: 'string', description: 'Search query for title' },
        entity_type: { type: 'string', description: 'Filter by entity type' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['project_id'],
    },
  },
];

export const entityPageHandlers = {
  create_entity_page: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    // Generate storage path
    const storagePath = getEntityPageStoragePath(args.project_id, args.entity_type, args.entity_id);

    // Write content to file
    writeFileSync(storagePath, args.content, 'utf8');

    // Store metadata in database
    const stmt = db.prepare(`
      INSERT INTO entity_pages (id, project_id, entity_id, entity_type, title, storage_path, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const page = stmt.get(
      id,
      args.project_id,
      args.entity_id,
      args.entity_type,
      args.title,
      storagePath,
      null,
      now,
      now
    );

    return formatToolResponse(
      `Entity page created successfully:\nID: ${page.id}\nTitle: ${page.title}\nType: ${page.entity_type}\nPath: ${page.storage_path}`
    );
  },

  get_entity_page: (args) => {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM entity_pages WHERE entity_id = ?');
    const page = stmt.get(args.entity_id);

    if (!page) {
      throw new Error(`Entity page not found for entity: ${args.entity_id}`);
    }

    // Read content from file
    let content = '';
    if (existsSync(page.storage_path)) {
      content = readFileSync(page.storage_path, 'utf8');
    }

    return formatToolResponse(
      `Entity Page: ${page.title}\nType: ${page.entity_type}\nCreated: ${page.created_at}\n\n---\n\n${content}`
    );
  },

  update_entity_page: (args) => {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM entity_pages WHERE entity_id = ?');
    const page = stmt.get(args.entity_id);

    if (!page) {
      throw new Error(`Entity page not found for entity: ${args.entity_id}`);
    }

    const mode = args.mode || 'replace';

    if (mode === 'append') {
      // Append to existing content
      appendFileSync(page.storage_path, '\n\n' + args.content, 'utf8');
    } else {
      // Replace entire content
      writeFileSync(page.storage_path, args.content, 'utf8');
    }

    // Update timestamp
    const now = getCurrentTimestamp();
    const updateStmt = db.prepare('UPDATE entity_pages SET updated_at = ? WHERE entity_id = ?');
    updateStmt.run(now, args.entity_id);

    return formatToolResponse(`Entity page updated successfully (${mode} mode)`);
  },

  add_entity_note: (args) => {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM entity_pages WHERE entity_id = ?');
    const page = stmt.get(args.entity_id);

    if (!page) {
      throw new Error(`Entity page not found for entity: ${args.entity_id}`);
    }

    // Create timestamped note
    const now = getCurrentTimestamp();
    const timestamp = new Date(now).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const note = `\n\n---\n\n**Note added ${timestamp}:**\n\n${args.note}`;

    // Append note
    appendFileSync(page.storage_path, note, 'utf8');

    // Update timestamp
    const updateStmt = db.prepare('UPDATE entity_pages SET updated_at = ? WHERE entity_id = ?');
    updateStmt.run(now, args.entity_id);

    return formatToolResponse(`Note added to entity page successfully`);
  },

  link_entity_pages: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO entity_links (
        id, project_id, from_entity_id, from_entity_type,
        to_entity_id, to_entity_type, relationship_type,
        verified, notes, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const link = stmt.get(
      id,
      args.project_id,
      args.from_entity_id,
      args.from_entity_type,
      args.to_entity_id,
      args.to_entity_type,
      args.relationship_type || null,
      args.verified ? 1 : 0,
      args.notes || null,
      now
    );

    return formatToolResponse(
      `Entity pages linked successfully:\n${args.from_entity_type} → ${args.to_entity_type}\nRelationship: ${link.relationship_type || 'related'}`
    );
  },

  search_entity_pages: (args) => {
    const db = getDatabase();
    const limit = args.limit || 10;

    let query = 'SELECT * FROM entity_pages WHERE project_id = ?';
    const params = [args.project_id];

    if (args.query) {
      query += ' AND title LIKE ? COLLATE NOCASE';
      params.push(`%${args.query}%`);
    }

    if (args.entity_type) {
      query += ' AND entity_type = ?';
      params.push(args.entity_type);
    }

    query += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const pages = stmt.all(...params);

    return formatToolResponse(
      `Found ${pages.length} entity pages:\n${JSON.stringify(pages, null, 2)}`
    );
  },
};
