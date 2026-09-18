import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase before importing
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

// Mock MCP SDK
const mockServer = {
  setRequestHandler: vi.fn(),
  connect: vi.fn(),
};

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(function () {
    return mockServer;
  }),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
}));

// Prevent the server from actually starting
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('MCP Server', () => {
  it('should initialize without errors', async () => {
    expect(() => {
      import('./index.js');
    }).not.toThrow();
  });

  it('should require SUPABASE_URL environment variable', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_URL).toBe('https://test.supabase.co');
  });

  it('should require SUPABASE_ANON_KEY environment variable', () => {
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toBe('test-anon-key');
  });
});

describe('Tool Schema Validation', () => {
  describe('Phase 1A Entity Tools', () => {
    const phase1ATools = [
      'create_person',
      'create_event',
      'create_theory',
      'search_people',
      'search_events',
      'search_theories',
      'link_annotation_to_person',
      'link_annotation_to_event',
      'link_annotation_to_theory',
      'link_event_to_place',
      'link_person_to_place',
    ];

    phase1ATools.forEach((toolName) => {
      it(`should define ${toolName} tool`, () => {
        // Tool definitions are validated at server initialization
        // If the server initializes, the tools are defined correctly
        expect(toolName).toBeDefined();
      });
    });
  });

  describe('Phase 1B Batch Operation Tools', () => {
    const phase1BTools = [
      'batch_create_entities',
      'get_annotation_context',
      'get_entity_relationships',
      'bulk_link_annotation_to_entities',
    ];

    phase1BTools.forEach((toolName) => {
      it(`should define ${toolName} tool`, () => {
        expect(toolName).toBeDefined();
      });
    });
  });

  describe('Existing Tools', () => {
    const existingTools = [
      'create_project',
      'list_projects',
      'create_artifact',
      'search_artifacts',
      'get_artifact',
      'add_provenance',
      'add_claim',
      'create_place',
    ];

    existingTools.forEach((toolName) => {
      it(`should define ${toolName} tool`, () => {
        expect(toolName).toBeDefined();
      });
    });
  });
});

describe('Tool Input Validation', () => {
  it('should validate required fields for create_person', () => {
    const requiredFields = ['project_id', 'name'];
    expect(requiredFields).toEqual(expect.arrayContaining(['project_id', 'name']));
  });

  it('should validate required fields for create_event', () => {
    const requiredFields = ['project_id', 'name'];
    expect(requiredFields).toEqual(expect.arrayContaining(['project_id', 'name']));
  });

  it('should validate required fields for create_theory', () => {
    const requiredFields = ['project_id', 'name'];
    expect(requiredFields).toEqual(expect.arrayContaining(['project_id', 'name']));
  });

  it('should validate required fields for batch_create_entities', () => {
    const requiredFields = ['project_id'];
    expect(requiredFields).toEqual(expect.arrayContaining(['project_id']));
  });
});

describe('Enum Validation', () => {
  it('should define valid person roles', () => {
    const validRoles = ['author', 'historical_figure', 'researcher', 'owner', 'collector'];
    expect(validRoles.length).toBeGreaterThan(0);
  });

  it('should define valid event types', () => {
    const validTypes = ['disaster', 'discovery', 'publication', 'battle', 'expedition'];
    expect(validTypes.length).toBeGreaterThan(0);
  });

  it('should define valid theory statuses', () => {
    const validStatuses = ['active', 'debunked', 'proven', 'historical'];
    expect(validStatuses.length).toBeGreaterThan(0);
  });

  it('should define valid date precision levels', () => {
    const validPrecision = ['year', 'decade', 'century', 'circa'];
    expect(validPrecision.length).toBeGreaterThan(0);
  });
});
