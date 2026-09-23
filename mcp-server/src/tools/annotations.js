import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import { getCurrentTimestamp, formatToolResponse, parseJsonField } from '../utils/formatters.js';

export const annotationTools = [
  {
    name: 'link_annotation_to_person',
    description: 'Link a source annotation to a person mentioned in it',
    inputSchema: {
      type: 'object',
      properties: {
        annotation_id: { type: 'string', description: 'Annotation UUID' },
        person_id: { type: 'string', description: 'Person UUID' },
        relationship_type: {
          type: 'string',
          description: 'Type of relationship',
          enum: ['mentions', 'authored_by', 'about'],
          default: 'mentions',
        },
        quote: { type: 'string', description: 'Relevant excerpt from annotation' },
      },
      required: ['annotation_id', 'person_id'],
    },
  },
  {
    name: 'link_annotation_to_event',
    description: 'Link a source annotation to an event mentioned in it',
    inputSchema: {
      type: 'object',
      properties: {
        annotation_id: { type: 'string', description: 'Annotation UUID' },
        event_id: { type: 'string', description: 'Event UUID' },
        relationship_type: {
          type: 'string',
          description: 'Type of relationship',
          enum: ['mentions', 'describes', 'occurred_during'],
          default: 'mentions',
        },
        quote: { type: 'string', description: 'Relevant excerpt from annotation' },
      },
      required: ['annotation_id', 'event_id'],
    },
  },
  {
    name: 'link_annotation_to_theory',
    description: 'Link a source annotation to a theory',
    inputSchema: {
      type: 'object',
      properties: {
        annotation_id: { type: 'string', description: 'Annotation UUID' },
        theory_id: { type: 'string', description: 'Theory UUID' },
        relationship_type: {
          type: 'string',
          description: 'Type of relationship',
          enum: ['supports', 'contradicts', 'mentions'],
          default: 'supports',
        },
        quote: { type: 'string', description: 'Relevant excerpt from annotation' },
      },
      required: ['annotation_id', 'theory_id'],
    },
  },
  {
    name: 'link_event_to_place',
    description: 'Link an event to a geographic location',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'Event UUID' },
        place_id: { type: 'string', description: 'Place UUID' },
        relationship_type: {
          type: 'string',
          description: 'Type of relationship',
          enum: ['occurred_at', 'discovered_at', 'affected'],
          default: 'occurred_at',
        },
      },
      required: ['event_id', 'place_id'],
    },
  },
  {
    name: 'link_person_to_place',
    description: 'Link a person to a geographic location',
    inputSchema: {
      type: 'object',
      properties: {
        person_id: { type: 'string', description: 'Person UUID' },
        place_id: { type: 'string', description: 'Place UUID' },
        relationship_type: {
          type: 'string',
          description: 'Type of relationship',
          enum: ['born_at', 'died_at', 'lived_at', 'discovered', 'visited'],
          default: 'associated_with',
        },
      },
      required: ['person_id', 'place_id'],
    },
  },
  {
    name: 'get_annotation_context',
    description: 'Get all entities linked to an annotation (people, events, theories)',
    inputSchema: {
      type: 'object',
      properties: {
        annotation_id: { type: 'string', description: 'Annotation UUID' },
      },
      required: ['annotation_id'],
    },
  },
  {
    name: 'get_entity_relationships',
    description: 'Get all relationships for a given entity across the knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          enum: ['person', 'event', 'theory', 'place', 'artifact'],
          description: 'Type of entity',
        },
        entity_id: { type: 'string', description: 'Entity UUID' },
      },
      required: ['entity_type', 'entity_id'],
    },
  },
  {
    name: 'bulk_link_annotation_to_entities',
    description: 'Link an annotation to multiple entities at once',
    inputSchema: {
      type: 'object',
      properties: {
        annotation_id: { type: 'string', description: 'Annotation UUID' },
        people: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              person_id: { type: 'string' },
              relationship_type: { type: 'string' },
              quote: { type: 'string' },
            },
            required: ['person_id'],
          },
        },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event_id: { type: 'string' },
              relationship_type: { type: 'string' },
              quote: { type: 'string' },
            },
            required: ['event_id'],
          },
        },
        theories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theory_id: { type: 'string' },
              relationship_type: { type: 'string' },
              quote: { type: 'string' },
            },
            required: ['theory_id'],
          },
        },
      },
      required: ['annotation_id'],
    },
  },
  {
    name: 'batch_create_entities',
    description:
      'Create multiple entities (people, events, theories) in a single operation for efficiency',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        people: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              birth_year: { type: 'number' },
              death_year: { type: 'number' },
              bio: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['name'],
          },
          description: 'Array of people to create',
        },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              date_year: { type: 'number' },
              date_precision: { type: 'string' },
              event_type: { type: 'string' },
              description: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['name'],
          },
          description: 'Array of events to create',
        },
        theories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              proposed_location_id: { type: 'string' },
              status: { type: 'string' },
              confidence_level: { type: 'number' },
              notes: { type: 'string' },
            },
            required: ['name'],
          },
          description: 'Array of theories to create',
        },
      },
      required: ['project_id'],
    },
  },
];

export const annotationHandlers = {
  link_annotation_to_person: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO annotation_people_links (id, annotation_id, person_id, relationship_type, created_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);

    const link = stmt.get(
      id,
      args.annotation_id,
      args.person_id,
      args.relationship_type || 'mentions',
      now
    );

    return formatToolResponse(
      `Annotation linked to person successfully (${link.relationship_type})`
    );
  },

  link_annotation_to_event: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO annotation_events_links (id, annotation_id, event_id, relationship_type, quote, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const link = stmt.get(
      id,
      args.annotation_id,
      args.event_id,
      args.relationship_type || 'mentions',
      args.quote || null,
      now
    );

    return formatToolResponse(
      `Annotation linked to event successfully (${link.relationship_type})`
    );
  },

  link_annotation_to_theory: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO annotation_theories_links (id, annotation_id, theory_id, relationship_type, quote, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const link = stmt.get(
      id,
      args.annotation_id,
      args.theory_id,
      args.relationship_type || 'supports',
      args.quote || null,
      now
    );

    return formatToolResponse(
      `Annotation linked to theory successfully (${link.relationship_type})`
    );
  },

  link_event_to_place: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO event_places_links (id, event_id, place_id, relationship_type, created_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);

    const link = stmt.get(
      id,
      args.event_id,
      args.place_id,
      args.relationship_type || 'occurred_at',
      now
    );

    return formatToolResponse(`Event linked to place successfully (${link.relationship_type})`);
  },

  link_person_to_place: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO people_places_links (id, person_id, place_id, relationship_type, created_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);

    const link = stmt.get(
      id,
      args.person_id,
      args.place_id,
      args.relationship_type || 'associated_with',
      now
    );

    return formatToolResponse(`Person linked to place successfully (${link.relationship_type})`);
  },

  get_annotation_context: (args) => {
    const db = getDatabase();
    const context = { people: [], events: [], theories: [] };

    // Get linked people
    const peopleStmt = db.prepare(`
      SELECT
        apl.relationship_type,
        apl.quote,
        p.id, p.name, p.occupation AS role, p.description AS bio
      FROM annotation_people_links apl
      LEFT JOIN people p ON apl.person_id = p.id
      WHERE apl.annotation_id = ?
    `);
    context.people = peopleStmt.all(args.annotation_id).map((row) => ({
      relationship_type: row.relationship_type,
      quote: row.quote,
      person: {
        id: row.id,
        name: row.name,
        role: row.role,
        bio: row.bio,
      },
    }));

    // Get linked events
    const eventsStmt = db.prepare(`
      SELECT
        ael.relationship_type,
        ael.quote,
        e.id, e.name, e.description, e.event_date, e.metadata
      FROM annotation_events_links ael
      LEFT JOIN events e ON ael.event_id = e.id
      WHERE ael.annotation_id = ?
    `);
    context.events = eventsStmt.all(args.annotation_id).map((row) => ({
      relationship_type: row.relationship_type,
      quote: row.quote,
      event: {
        id: row.id,
        name: row.name,
        description: row.description,
        event_date: row.event_date,
        metadata: parseJsonField(row.metadata, {}),
      },
    }));

    // Get linked theories
    const theoriesStmt = db.prepare(`
      SELECT
        atl.relationship_type,
        atl.quote,
        t.id, t.name, t.description, t.metadata
      FROM annotation_theories_links atl
      LEFT JOIN theories t ON atl.theory_id = t.id
      WHERE atl.annotation_id = ?
    `);
    context.theories = theoriesStmt.all(args.annotation_id).map((row) => ({
      relationship_type: row.relationship_type,
      quote: row.quote,
      theory: {
        id: row.id,
        name: row.name,
        description: row.description,
        metadata: parseJsonField(row.metadata, {}),
      },
    }));

    return formatToolResponse(`Annotation context:\n${JSON.stringify(context, null, 2)}`);
  },

  get_entity_relationships: (args) => {
    const db = getDatabase();
    const relationships = {};

    switch (args.entity_type) {
      case 'person': {
        // Get annotations mentioning this person
        const annoStmt = db.prepare(`
          SELECT
            apl.relationship_type,
            a.id, a.content, a.page_number
          FROM annotation_people_links apl
          LEFT JOIN annotations a ON apl.annotation_id = a.id
          WHERE apl.person_id = ?
        `);
        relationships.annotations = annoStmt.all(args.entity_id).map((row) => ({
          relationship_type: row.relationship_type,
          annotation: {
            id: row.id,
            content: row.content,
            page_number: row.page_number,
          },
        }));

        // Get places linked to this person
        const placesStmt = db.prepare(`
          SELECT
            ppl.relationship_type,
            p.id, p.name, p.lng, p.lat, p.description
          FROM people_places_links ppl
          LEFT JOIN places p ON ppl.place_id = p.id
          WHERE ppl.person_id = ?
        `);
        relationships.places = placesStmt.all(args.entity_id).map((row) => ({
          relationship_type: row.relationship_type,
          place: {
            id: row.id,
            name: row.name,
            lng: row.lng,
            lat: row.lat,
            description: row.description,
          },
        }));
        break;
      }

      case 'event': {
        // Get annotations mentioning this event
        const annoStmt = db.prepare(`
          SELECT
            ael.relationship_type,
            a.id, a.content, a.page_number
          FROM annotation_events_links ael
          LEFT JOIN annotations a ON ael.annotation_id = a.id
          WHERE ael.event_id = ?
        `);
        relationships.annotations = annoStmt.all(args.entity_id).map((row) => ({
          relationship_type: row.relationship_type,
          annotation: {
            id: row.id,
            content: row.content,
            page_number: row.page_number,
          },
        }));

        // Get places linked to this event
        const placesStmt = db.prepare(`
          SELECT
            epl.relationship_type,
            p.id, p.name, p.lng, p.lat, p.description
          FROM event_places_links epl
          LEFT JOIN places p ON epl.place_id = p.id
          WHERE epl.event_id = ?
        `);
        relationships.places = placesStmt.all(args.entity_id).map((row) => ({
          relationship_type: row.relationship_type,
          place: {
            id: row.id,
            name: row.name,
            lng: row.lng,
            lat: row.lat,
            description: row.description,
          },
        }));
        break;
      }

      case 'theory': {
        // Get annotations supporting/contradicting this theory
        const annoStmt = db.prepare(`
          SELECT
            atl.relationship_type,
            a.id, a.content, a.page_number
          FROM annotation_theories_links atl
          LEFT JOIN annotations a ON atl.annotation_id = a.id
          WHERE atl.theory_id = ?
        `);
        relationships.annotations = annoStmt.all(args.entity_id).map((row) => ({
          relationship_type: row.relationship_type,
          annotation: {
            id: row.id,
            content: row.content,
            page_number: row.page_number,
          },
        }));

        // Get proposed location if exists (from metadata)
        const theoryStmt = db.prepare('SELECT metadata FROM theories WHERE id = ?');
        const theory = theoryStmt.get(args.entity_id);
        if (theory && theory.metadata) {
          const metadata = parseJsonField(theory.metadata, {});
          if (metadata.proposed_location_id) {
            const placeStmt = db.prepare('SELECT * FROM places WHERE id = ?');
            relationships.proposed_location = placeStmt.get(metadata.proposed_location_id) || null;
          }
        }
        break;
      }

      default:
        throw new Error(`Unsupported entity type: ${args.entity_type}`);
    }

    return formatToolResponse(`Entity relationships:\n${JSON.stringify(relationships, null, 2)}`);
  },

  bulk_link_annotation_to_entities: (args) => {
    const db = getDatabase();
    const now = getCurrentTimestamp();
    const results = { people: 0, events: 0, theories: 0 };

    const transaction = db.transaction(() => {
      // Link people
      if (args.people && args.people.length > 0) {
        const peopleStmt = db.prepare(`
          INSERT INTO annotation_people_links (id, annotation_id, person_id, relationship_type, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const p of args.people) {
          peopleStmt.run(
            generateUUID(),
            args.annotation_id,
            p.person_id,
            p.relationship_type || 'mentions',
            now
          );
          results.people++;
        }
      }

      // Link events
      if (args.events && args.events.length > 0) {
        const eventsStmt = db.prepare(`
          INSERT INTO annotation_events_links (id, annotation_id, event_id, relationship_type, quote, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const e of args.events) {
          eventsStmt.run(
            generateUUID(),
            args.annotation_id,
            e.event_id,
            e.relationship_type || 'mentions',
            e.quote || null,
            now
          );
          results.events++;
        }
      }

      // Link theories
      if (args.theories && args.theories.length > 0) {
        const theoriesStmt = db.prepare(`
          INSERT INTO annotation_theories_links (id, annotation_id, theory_id, relationship_type, quote, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const t of args.theories) {
          theoriesStmt.run(
            generateUUID(),
            args.annotation_id,
            t.theory_id,
            t.relationship_type || 'supports',
            t.quote || null,
            now
          );
          results.theories++;
        }
      }
    });

    transaction();

    return formatToolResponse(
      `Bulk links created:\n${results.people} people\n${results.events} events\n${results.theories} theories`
    );
  },

  batch_create_entities: (args) => {
    const db = getDatabase();
    const now = getCurrentTimestamp();
    const results = { people: [], events: [], theories: [] };

    const transaction = db.transaction(() => {
      // Create people
      if (args.people && args.people.length > 0) {
        const peopleStmt = db.prepare(`
          INSERT INTO people (id, project_id, name, description, birth_date, death_date, occupation, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `);

        for (const p of args.people) {
          const id = generateUUID();
          const metadata = JSON.stringify({
            birth_year: p.birth_year || null,
            death_year: p.death_year || null,
          });

          const person = peopleStmt.get(
            id,
            args.project_id,
            p.name,
            p.bio || null,
            p.birth_year ? String(p.birth_year) : null,
            p.death_year ? String(p.death_year) : null,
            p.role || null,
            metadata,
            now,
            now
          );
          results.people.push(person);
        }
      }

      // Create events
      if (args.events && args.events.length > 0) {
        const eventsStmt = db.prepare(`
          INSERT INTO events (id, project_id, name, description, event_date, location, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `);

        for (const e of args.events) {
          const id = generateUUID();
          const metadata = JSON.stringify({
            date_year: e.date_year || null,
            date_precision: e.date_precision || 'year',
            event_type: e.event_type || null,
          });

          const event = eventsStmt.get(
            id,
            args.project_id,
            e.name,
            e.description || null,
            e.date_year ? String(e.date_year) : null,
            null,
            metadata,
            now,
            now
          );
          results.events.push(event);
        }
      }

      // Create theories
      if (args.theories && args.theories.length > 0) {
        const theoriesStmt = db.prepare(`
          INSERT INTO theories (id, project_id, name, description, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `);

        for (const t of args.theories) {
          const id = generateUUID();
          const metadata = JSON.stringify({
            proposed_location_id: t.proposed_location_id || null,
            status: t.status || 'active',
            confidence_level: t.confidence_level || 3,
          });

          const theory = theoriesStmt.get(
            id,
            args.project_id,
            t.name,
            t.description || null,
            metadata,
            now,
            now
          );
          results.theories.push(theory);
        }
      }
    });

    transaction();

    return formatToolResponse(
      `Batch entities created successfully:\n${results.people.length} people\n${results.events.length} events\n${results.theories.length} theories\n\n${JSON.stringify(results, null, 2)}`
    );
  },
};
