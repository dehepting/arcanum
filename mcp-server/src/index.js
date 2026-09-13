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
        event_type: {
          type: 'string',
          description: 'Type of provenance event',
          enum: [
            'discovery',
            'acquisition',
            'sale',
            'transfer',
            'loan',
            'exhibition',
            'conservation',
            'repatriation',
            'theft',
            'recovery',
            'other',
          ],
        },
        date_start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        owner_name: { type: 'string', description: 'Owner/custodian name' },
        location: { type: 'string', description: 'Location during this period' },
        description: { type: 'string', description: 'Description of the event' },
        source: { type: 'string', description: 'Source of information' },
        verified: { type: 'boolean', description: 'Is this verified?', default: false },
      },
      required: ['artifact_id', 'event_type'],
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
            'religious_body',
            'other',
          ],
        },
        claim_basis: { type: 'string', description: 'Basis for the claim' },
        claim_date: { type: 'string', description: 'Date claim was filed' },
        status: {
          type: 'string',
          description: 'Current status',
          enum: ['pending', 'under_review', 'accepted', 'rejected', 'settled', 'withdrawn'],
          default: 'pending',
        },
        description: { type: 'string', description: 'Detailed description' },
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
          event_type: args.event_type,
          date_start: args.date_start || null,
          date_end: args.date_end || null,
          owner_name: args.owner_name || null,
          location: args.location || null,
          description: args.description || null,
          source: args.source || null,
          verified: args.verified || false,
        };

        const { data, error } = await supabase
          .from('provenance')
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
          description: args.description || null,
        };

        const { data, error } = await supabase.from('claims').insert([claimData]).select().single();

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
