# Arcanum MCP Server

Model Context Protocol (MCP) server for managing Arcanum artifacts, projects, and provenance data.

## Setup

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Configure in Claude Desktop:

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arcanum": {
      "command": "node",
      "args": ["/Users/davidhepting/arcanum/mcp-server/src/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-key"
      }
    }
  }
}
```

## Available Tools

### Project Management
- **create_project** - Create a new research project
- **list_projects** - List all projects

### Artifact Management
- **create_artifact** - Create a new artifact with full metadata
- **search_artifacts** - Search artifacts by query, category, etc.
- **get_artifact** - Get detailed artifact information

### Provenance & Claims
- **add_provenance** - Add provenance events (discovery, acquisition, etc.)
- **add_claim** - Add ownership claims or disputes

### Map Integration
- **create_place** - Create map pins/places

## Usage Examples

### Create a Project
```
Use the create_project tool to create a new project called "Atlantis Expedition"
focused on mythological artifacts.
```

### Add an Artifact
```
Create an artifact in project [uuid] for the Trident of Poseidon:
- Category: Weaponry & Armor
- Period: Mythological Bronze Age
- Material: Orichalcum
- Current location: Sunken Temple of Poseidon
```

### Add Provenance
```
Add a discovery provenance event for artifact [uuid]:
- Event type: discovery
- Date: 9600 BCE
- Location: Atlantis Central Temple
- Description: Discovered in the throne room
```

## Tool Schemas

All tools have JSON schemas that define:
- Required parameters
- Optional parameters
- Valid enum values
- Data types

See the source code for complete schemas.

## Development

Run in watch mode:
```bash
npm run dev
```

## Architecture

- Built on @modelcontextprotocol/sdk
- Direct Supabase integration
- Stdio transport for Claude Desktop
- Comprehensive error handling
