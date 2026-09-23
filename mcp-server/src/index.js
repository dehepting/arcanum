#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import database connection
import { getDatabase, closeDatabase } from './db.js';

// Import tool modules
import { projectTools, projectHandlers } from './tools/projects.js';
import { placeTools, placeHandlers } from './tools/places.js';
import { peopleTools, peopleHandlers } from './tools/people.js';
import { eventTools, eventHandlers } from './tools/events.js';
import { theoryTools, theoryHandlers } from './tools/theories.js';
import { artifactTools, artifactHandlers } from './tools/artifacts.js';
import { provenanceTools, provenanceHandlers } from './tools/provenance.js';
import { annotationTools, annotationHandlers } from './tools/annotations.js';
import { entityPageTools, entityPageHandlers } from './tools/entity-pages.js';

// Import error formatter
import { formatErrorResponse } from './utils/formatters.js';

// Combine all tools
const TOOLS = [
  ...projectTools,
  ...placeTools,
  ...peopleTools,
  ...eventTools,
  ...theoryTools,
  ...artifactTools,
  ...provenanceTools,
  ...annotationTools,
  ...entityPageTools,
];

// Combine all handlers
const HANDLERS = {
  ...projectHandlers,
  ...placeHandlers,
  ...peopleHandlers,
  ...eventHandlers,
  ...theoryHandlers,
  ...artifactHandlers,
  ...provenanceHandlers,
  ...annotationHandlers,
  ...entityPageHandlers,
};

// Create MCP server
const server = new Server(
  {
    name: 'arcanum-artifacts',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Ensure database connection is established
    getDatabase();

    // Find and execute handler
    const handler = HANDLERS[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return handler(args);
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    return formatErrorResponse(error);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Arcanum MCP Server v2.0 running on stdio');
  console.error(`Total tools available: ${TOOLS.length}`);
}

// Handle shutdown
process.on('SIGINT', () => {
  console.error('Shutting down...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down...');
  closeDatabase();
  process.exit(0);
});

main().catch((error) => {
  console.error('Server error:', error);
  closeDatabase();
  process.exit(1);
});
