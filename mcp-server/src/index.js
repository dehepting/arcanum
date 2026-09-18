#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create MCP server
const server = new Server(
  {
    name: 'arcanum-artifacts',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
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
    name: 'add_provenance',
    description: 'Add a provenance entry to an artifact',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact UUID' },
        date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        is_current: {
          type: 'boolean',
          description: 'Is this the current ownership?',
          default: false,
        },
        owner_name: { type: 'string', description: 'Owner/custodian name' },
        owner_type: {
          type: 'string',
          description: 'Type of owner',
          enum: ['museum', 'private', 'government', 'religious', 'in_situ', 'unknown', 'destroyed'],
        },
        location: { type: 'string', description: 'Location during this period' },
        transfer_method: {
          type: 'string',
          description: 'How the artifact was transferred',
          enum: [
            'excavation',
            'purchase',
            'gift',
            'inheritance',
            'theft',
            'loan',
            'repatriation',
            'unknown',
          ],
        },
        transfer_details: { type: 'string', description: 'Details about the transfer' },
        purchase_price: {
          type: 'string',
          description: 'Purchase price if applicable (e.g., "£500")',
        },
        notes: { type: 'string', description: 'Additional notes' },
        verified: { type: 'boolean', description: 'Is this verified?', default: false },
      },
      required: ['artifact_id', 'owner_name'],
    },
  },
  {
    name: 'add_claim',
    description: 'Add an ownership claim or dispute to an artifact',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact UUID' },
        claimant_name: { type: 'string', description: 'Name of claimant' },
        claimant_type: {
          type: 'string',
          description: 'Type of claimant',
          enum: [
            'government',
            'institution',
            'individual',
            'indigenous_group',
            'religious_organization',
          ],
        },
        claim_basis: {
          type: 'string',
          description: 'Basis for the claim',
          enum: [
            'cultural_heritage',
            'illegal_export',
            'looted',
            'stolen',
            'rightful_heir',
            'sacred_object',
          ],
        },
        claim_date: { type: 'string', description: 'Date claim was filed (YYYY-MM-DD)' },
        status: {
          type: 'string',
          description: 'Current status',
          enum: ['pending', 'under_review', 'accepted', 'rejected', 'settled', 'withdrawn'],
          default: 'pending',
        },
        details: { type: 'string', description: 'Detailed description of the claim' },
        legal_reference: { type: 'string', description: 'Legal reference or case number' },
      },
      required: ['artifact_id', 'claimant_name', 'claim_basis'],
    },
  },
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
  // Knowledge Graph Entity Tools
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
  // Batch Operations & Helper Tools
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
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_project': {
        const { data, error } = await supabase
          .from('projects')
          .insert([
            {
              name: args.name,
              description: args.description || null,
              map_center_lng: args.map_center_lng || -20.0,
              map_center_lat: args.map_center_lat || 36.0,
              map_zoom: args.map_zoom || 3.4,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Project created successfully:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'list_projects': {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Found ${data.length} projects:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'create_artifact': {
        const artifactData = {
          project_id: args.project_id,
          name: args.name,
          category: args.category,
          description: args.description || null,
          period: args.period || null,
          estimated_age: args.estimated_age || null,
          material: args.material || null,
          dimensions: args.dimensions || null,
          condition: args.condition || null,
          current_owner: args.current_owner || null,
          owner_type: args.owner_type || null,
          current_location: args.current_location || null,
          accession_number: args.accession_number || null,
          image_urls: args.image_urls || null,
          notes: args.notes || null,
        };

        // Handle findspot as JSONB
        if (args.findspot_name && args.findspot_lng && args.findspot_lat) {
          artifactData.findspot = {
            name: args.findspot_name,
            lng: args.findspot_lng,
            lat: args.findspot_lat,
          };
        }

        const { data, error } = await supabase
          .from('artifacts')
          .insert([artifactData])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Artifact created successfully:\nID: ${data.id}\nName: ${data.name}\nCategory: ${data.category}`,
            },
          ],
        };
      }

      case 'search_artifacts': {
        let query = supabase.from('artifacts').select('*').eq('project_id', args.project_id);

        if (args.query) {
          query = query.or(
            `name.ilike.%${args.query}%,description.ilike.%${args.query}%,notes.ilike.%${args.query}%`
          );
        }

        if (args.category) {
          query = query.eq('category', args.category);
        }

        query = query.limit(args.limit || 10).order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Found ${data.length} artifacts:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'get_artifact': {
        const { data, error } = await supabase
          .from('artifacts')
          .select('*')
          .eq('id', args.artifact_id)
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Artifact details:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'add_provenance': {
        const provenanceData = {
          artifact_id: args.artifact_id,
          date_from: args.date_from || null,
          date_to: args.date_to || null,
          is_current: args.is_current || false,
          owner_name: args.owner_name,
          owner_type: args.owner_type || null,
          location: args.location || null,
          transfer_method: args.transfer_method || null,
          transfer_details: args.transfer_details || null,
          purchase_price: args.purchase_price || null,
          notes: args.notes || null,
          verified: args.verified || false,
        };

        const { data, error } = await supabase
          .from('artifact_provenance')
          .insert([provenanceData])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Provenance entry added successfully:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'add_claim': {
        const claimData = {
          artifact_id: args.artifact_id,
          claimant_name: args.claimant_name,
          claimant_type: args.claimant_type || null,
          claim_basis: args.claim_basis,
          claim_date: args.claim_date || null,
          status: args.status || 'pending',
          details: args.details || null,
          legal_reference: args.legal_reference || null,
        };

        const { data, error } = await supabase
          .from('artifact_claims')
          .insert([claimData])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Claim added successfully:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'create_place': {
        const { data, error } = await supabase
          .from('places')
          .insert([
            {
              project_id: args.project_id,
              name: args.name,
              lng: args.lng,
              lat: args.lat,
              note: args.note || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Place created successfully:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      // Knowledge Graph Entity Tools
      case 'create_person': {
        const { data, error } = await supabase
          .from('people')
          .insert([
            {
              project_id: args.project_id,
              name: args.name,
              role: args.role || null,
              birth_year: args.birth_year || null,
              death_year: args.death_year || null,
              bio: args.bio || null,
              notes: args.notes || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Person created successfully:\nID: ${data.id}\nName: ${data.name}\nRole: ${data.role || 'not specified'}`,
            },
          ],
        };
      }

      case 'create_event': {
        const { data, error } = await supabase
          .from('events')
          .insert([
            {
              project_id: args.project_id,
              name: args.name,
              date_year: args.date_year || null,
              date_precision: args.date_precision || 'year',
              event_type: args.event_type || null,
              description: args.description || null,
              notes: args.notes || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Event created successfully:\nID: ${data.id}\nName: ${data.name}\nDate: ${data.date_year || 'not specified'}`,
            },
          ],
        };
      }

      case 'create_theory': {
        const { data, error } = await supabase
          .from('theories')
          .insert([
            {
              project_id: args.project_id,
              name: args.name,
              description: args.description || null,
              proposed_location_id: args.proposed_location_id || null,
              status: args.status || 'active',
              confidence_level: args.confidence_level || 3,
              notes: args.notes || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Theory created successfully:\nID: ${data.id}\nName: ${data.name}\nStatus: ${data.status}\nConfidence: ${data.confidence_level}/5`,
            },
          ],
        };
      }

      case 'search_people': {
        let query = supabase.from('people').select('*').eq('project_id', args.project_id);

        if (args.query) {
          query = query.or(`name.ilike.%${args.query}%,bio.ilike.%${args.query}%`);
        }

        if (args.role) {
          query = query.eq('role', args.role);
        }

        query = query.limit(args.limit || 10).order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Found ${data.length} people:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'search_events': {
        let query = supabase.from('events').select('*').eq('project_id', args.project_id);

        if (args.query) {
          query = query.or(`name.ilike.%${args.query}%,description.ilike.%${args.query}%`);
        }

        if (args.event_type) {
          query = query.eq('event_type', args.event_type);
        }

        query = query.limit(args.limit || 10).order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Found ${data.length} events:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'search_theories': {
        let query = supabase.from('theories').select('*').eq('project_id', args.project_id);

        if (args.query) {
          query = query.or(`name.ilike.%${args.query}%,description.ilike.%${args.query}%`);
        }

        if (args.status) {
          query = query.eq('status', args.status);
        }

        query = query.limit(args.limit || 10).order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Found ${data.length} theories:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'link_annotation_to_person': {
        const { data, error } = await supabase
          .from('annotation_people_links')
          .insert([
            {
              annotation_id: args.annotation_id,
              person_id: args.person_id,
              relationship_type: args.relationship_type || 'mentions',
              quote: args.quote || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Annotation linked to person successfully (${data.relationship_type})`,
            },
          ],
        };
      }

      case 'link_annotation_to_event': {
        const { data, error } = await supabase
          .from('annotation_events_links')
          .insert([
            {
              annotation_id: args.annotation_id,
              event_id: args.event_id,
              relationship_type: args.relationship_type || 'mentions',
              quote: args.quote || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Annotation linked to event successfully (${data.relationship_type})`,
            },
          ],
        };
      }

      case 'link_annotation_to_theory': {
        const { data, error } = await supabase
          .from('annotation_theories_links')
          .insert([
            {
              annotation_id: args.annotation_id,
              theory_id: args.theory_id,
              relationship_type: args.relationship_type || 'supports',
              quote: args.quote || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Annotation linked to theory successfully (${data.relationship_type})`,
            },
          ],
        };
      }

      case 'link_event_to_place': {
        const { data, error } = await supabase
          .from('event_places_links')
          .insert([
            {
              event_id: args.event_id,
              place_id: args.place_id,
              relationship_type: args.relationship_type || 'occurred_at',
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Event linked to place successfully (${data.relationship_type})`,
            },
          ],
        };
      }

      case 'link_person_to_place': {
        const { data, error } = await supabase
          .from('people_places_links')
          .insert([
            {
              person_id: args.person_id,
              place_id: args.place_id,
              relationship_type: args.relationship_type || 'associated_with',
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Person linked to place successfully (${data.relationship_type})`,
            },
          ],
        };
      }

      // Batch Operations & Helper Tools
      case 'batch_create_entities': {
        const results = { people: [], events: [], theories: [] };

        // Create people
        if (args.people && args.people.length > 0) {
          const peopleData = args.people.map((p) => ({
            project_id: args.project_id,
            name: p.name,
            role: p.role || null,
            birth_year: p.birth_year || null,
            death_year: p.death_year || null,
            bio: p.bio || null,
            notes: p.notes || null,
          }));

          const { data, error } = await supabase.from('people').insert(peopleData).select();

          if (error) throw error;
          results.people = data;
        }

        // Create events
        if (args.events && args.events.length > 0) {
          const eventsData = args.events.map((e) => ({
            project_id: args.project_id,
            name: e.name,
            date_year: e.date_year || null,
            date_precision: e.date_precision || 'year',
            event_type: e.event_type || null,
            description: e.description || null,
            notes: e.notes || null,
          }));

          const { data, error } = await supabase.from('events').insert(eventsData).select();

          if (error) throw error;
          results.events = data;
        }

        // Create theories
        if (args.theories && args.theories.length > 0) {
          const theoriesData = args.theories.map((t) => ({
            project_id: args.project_id,
            name: t.name,
            description: t.description || null,
            proposed_location_id: t.proposed_location_id || null,
            status: t.status || 'active',
            confidence_level: t.confidence_level || 3,
            notes: t.notes || null,
          }));

          const { data, error } = await supabase.from('theories').insert(theoriesData).select();

          if (error) throw error;
          results.theories = data;
        }

        return {
          content: [
            {
              type: 'text',
              text: `Batch entities created successfully:\n${results.people.length} people\n${results.events.length} events\n${results.theories.length} theories\n\n${JSON.stringify(results, null, 2)}`,
            },
          ],
        };
      }

      case 'get_annotation_context': {
        const context = { people: [], events: [], theories: [] };

        // Get linked people
        const { data: peopleLinks, error: peopleError } = await supabase
          .from('annotation_people_links')
          .select(
            `
            relationship_type,
            quote,
            person:people(*)
          `
          )
          .eq('annotation_id', args.annotation_id);

        if (peopleError) throw peopleError;
        context.people = peopleLinks;

        // Get linked events
        const { data: eventsLinks, error: eventsError } = await supabase
          .from('annotation_events_links')
          .select(
            `
            relationship_type,
            quote,
            event:events(*)
          `
          )
          .eq('annotation_id', args.annotation_id);

        if (eventsError) throw eventsError;
        context.events = eventsLinks;

        // Get linked theories
        const { data: theoriesLinks, error: theoriesError } = await supabase
          .from('annotation_theories_links')
          .select(
            `
            relationship_type,
            quote,
            theory:theories(*)
          `
          )
          .eq('annotation_id', args.annotation_id);

        if (theoriesError) throw theoriesError;
        context.theories = theoriesLinks;

        return {
          content: [
            {
              type: 'text',
              text: `Annotation context:\n${JSON.stringify(context, null, 2)}`,
            },
          ],
        };
      }

      case 'get_entity_relationships': {
        const relationships = {};

        switch (args.entity_type) {
          case 'person': {
            // Get annotations mentioning this person
            const { data: annotations, error: annoError } = await supabase
              .from('annotation_people_links')
              .select(
                `
                relationship_type,
                annotation:annotations(*)
              `
              )
              .eq('person_id', args.entity_id);

            if (annoError) throw annoError;

            // Get places linked to this person
            const { data: places, error: placesError } = await supabase
              .from('people_places_links')
              .select(
                `
                relationship_type,
                place:places(*)
              `
              )
              .eq('person_id', args.entity_id);

            if (placesError) throw placesError;

            relationships.annotations = annotations;
            relationships.places = places;
            break;
          }

          case 'event': {
            // Get annotations mentioning this event
            const { data: annotations, error: annoError } = await supabase
              .from('annotation_events_links')
              .select(
                `
                relationship_type,
                annotation:annotations(*)
              `
              )
              .eq('event_id', args.entity_id);

            if (annoError) throw annoError;

            // Get places linked to this event
            const { data: places, error: placesError } = await supabase
              .from('event_places_links')
              .select(
                `
                relationship_type,
                place:places(*)
              `
              )
              .eq('event_id', args.entity_id);

            if (placesError) throw placesError;

            relationships.annotations = annotations;
            relationships.places = places;
            break;
          }

          case 'theory': {
            // Get annotations supporting/contradicting this theory
            const { data: annotations, error: annoError } = await supabase
              .from('annotation_theories_links')
              .select(
                `
                relationship_type,
                annotation:annotations(*)
              `
              )
              .eq('theory_id', args.entity_id);

            if (annoError) throw annoError;

            // Get proposed location if exists
            const { data: theory, error: theoryError } = await supabase
              .from('theories')
              .select('proposed_location_id, place:places(*)')
              .eq('id', args.entity_id)
              .single();

            if (theoryError) throw theoryError;

            relationships.annotations = annotations;
            relationships.proposed_location = theory.place || null;
            break;
          }

          default:
            throw new Error(`Unsupported entity type: ${args.entity_type}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Entity relationships:\n${JSON.stringify(relationships, null, 2)}`,
            },
          ],
        };
      }

      case 'bulk_link_annotation_to_entities': {
        const results = { people: [], events: [], theories: [] };

        // Link people
        if (args.people && args.people.length > 0) {
          const peopleLinks = args.people.map((p) => ({
            annotation_id: args.annotation_id,
            person_id: p.person_id,
            relationship_type: p.relationship_type || 'mentions',
            quote: p.quote || null,
          }));

          const { data, error } = await supabase
            .from('annotation_people_links')
            .insert(peopleLinks)
            .select();

          if (error) throw error;
          results.people = data;
        }

        // Link events
        if (args.events && args.events.length > 0) {
          const eventsLinks = args.events.map((e) => ({
            annotation_id: args.annotation_id,
            event_id: e.event_id,
            relationship_type: e.relationship_type || 'mentions',
            quote: e.quote || null,
          }));

          const { data, error } = await supabase
            .from('annotation_events_links')
            .insert(eventsLinks)
            .select();

          if (error) throw error;
          results.events = data;
        }

        // Link theories
        if (args.theories && args.theories.length > 0) {
          const theoriesLinks = args.theories.map((t) => ({
            annotation_id: args.annotation_id,
            theory_id: t.theory_id,
            relationship_type: t.relationship_type || 'supports',
            quote: t.quote || null,
          }));

          const { data, error } = await supabase
            .from('annotation_theories_links')
            .insert(theoriesLinks)
            .select();

          if (error) throw error;
          results.theories = data;
        }

        return {
          content: [
            {
              type: 'text',
              text: `Bulk links created:\n${results.people.length} people\n${results.events.length} events\n${results.theories.length} theories`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Arcanum MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
