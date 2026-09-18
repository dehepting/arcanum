# MCP Server Testing Guide

## Overview

The Arcanum MCP server has comprehensive test coverage for all entity management tools added in Phase 1 (Knowledge Graph Foundation).

## Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Test Files

- `src/index.test.js` - Main test file covering all MCP tools
- `src/test/setup.js` - Test environment setup and global mocks

### Test Coverage

The test suite covers:

**Phase 1A - Entity Tools (11 tools)**
- Entity creation: `create_person`, `create_event`, `create_theory`
- Entity search: `search_people`, `search_events`, `search_theories`
- Entity linking: `link_annotation_to_person`, `link_annotation_to_event`, `link_annotation_to_theory`, `link_event_to_place`, `link_person_to_place`

**Phase 1B - Batch Operations (4 tools)**
- `batch_create_entities` - Bulk entity creation
- `get_annotation_context` - Retrieve all linked entities
- `get_entity_relationships` - Graph traversal
- `bulk_link_annotation_to_entities` - Bulk linking

**Existing Tools (8 tools)**
- Project management: `create_project`, `list_projects`
- Artifact management: `create_artifact`, `search_artifacts`, `get_artifact`
- Provenance: `add_provenance`, `add_claim`
- Map: `create_place`

## Coverage Thresholds

The MCP server maintains these minimum coverage thresholds:

- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

These are enforced in CI - builds will fail if coverage drops below these levels.

## Test Categories

### 1. Server Initialization
- Verifies server starts without errors
- Validates environment variable requirements
- Confirms Supabase client initialization

### 2. Tool Schema Validation
- Validates all tool definitions exist
- Confirms tool categorization (Phase 1A, Phase 1B, existing)
- Ensures proper tool registration with MCP SDK

### 3. Input Validation
- Validates required fields for each tool
- Confirms proper schema definitions
- Tests field combinations

### 4. Enum Validation
- Person roles: author, historical_figure, researcher, owner, collector
- Event types: disaster, discovery, publication, battle, expedition
- Theory statuses: active, debunked, proven, historical
- Date precision: year, decade, century, circa

## Mocking Strategy

### Supabase Client
The Supabase client is mocked to avoid requiring database access during tests:

```javascript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ /* mock query builder */ }))
  }))
}));
```

### MCP SDK
The MCP Server and Transport classes are mocked to prevent actual server startup:

```javascript
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(function () {
    this.setRequestHandler = vi.fn();
    this.connect = vi.fn();
    return this;
  })
}));
```

## CI Integration

The MCP server tests are integrated into the main CI workflow at `.github/workflows/ci.yml`:

```yaml
- name: Install MCP server dependencies
  run: npm ci
  working-directory: ./mcp-server

- name: Run MCP server tests with coverage
  run: npm run test:coverage
  working-directory: ./mcp-server
```

## Future Improvements

Potential enhancements for the test suite:

1. **Integration Tests**: Test actual Supabase interactions with test database
2. **E2E Tests**: Test full MCP protocol communication
3. **Performance Tests**: Benchmark batch operations
4. **Error Handling Tests**: Comprehensive error scenario coverage
5. **Tool Response Validation**: Validate response formats match MCP spec

## Contributing

When adding new tools to the MCP server:

1. Add test cases to `src/index.test.js`
2. Update this documentation
3. Ensure coverage thresholds are maintained
4. Run `npm run test:coverage` before committing
