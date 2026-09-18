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

### Knowledge Graph Entities
- **create_person** - Create a person (historical figure, author, researcher, collector)
- **create_event** - Create a historical event (discovery, publication, battle, expedition)
- **create_theory** - Create a research theory about a location, civilization, or artifact
- **search_people** - Search for people by name or role
- **search_events** - Search for events by name or type
- **search_theories** - Search for theories by name or status

### Entity Relationships
- **link_annotation_to_person** - Link a source annotation to a person mentioned in it
- **link_annotation_to_event** - Link a source annotation to an event mentioned in it
- **link_annotation_to_theory** - Link a source annotation to a theory
- **link_event_to_place** - Link an event to a geographic location
- **link_person_to_place** - Link a person to a geographic location

### Batch Operations & Helpers
- **batch_create_entities** - Create multiple people, events, and theories in a single operation
- **get_annotation_context** - Get all entities (people, events, theories) linked to an annotation
- **get_entity_relationships** - Get all relationships for a given entity across the knowledge graph
- **bulk_link_annotation_to_entities** - Link an annotation to multiple entities at once

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

### Create Knowledge Graph Entities
```
Create a person:
- Name: Plato
- Role: historical_figure
- Birth year: -427 (427 BC)
- Death year: -347 (347 BC)
- Bio: Ancient Greek philosopher who first mentioned Atlantis

Create an event:
- Name: Plato writes Timaeus
- Date: -360 (360 BC)
- Precision: circa
- Type: publication
- Description: First known mention of Atlantis

Create a theory:
- Name: Atlantis in Mediterranean
- Description: Theory that Atlantis was located near Santorini
- Status: active
- Confidence level: 3 (out of 5)
```

### Link Entities to Sources
```
Link an annotation to a person:
- Annotation ID: [uuid]
- Person ID: [uuid]
- Relationship: mentions
- Quote: "Plato describes the island..."

Link an event to a place:
- Event ID: [uuid]
- Place ID: [uuid]
- Relationship: occurred_at
```

### Batch Operations (Efficient Workflows)
```
Create multiple entities at once:
batch_create_entities({
  project_id: "[uuid]",
  people: [
    { name: "Plato", role: "historical_figure", birth_year: -427 },
    { name: "Solon", role: "historical_figure", birth_year: -638 }
  ],
  events: [
    { name: "Plato writes Timaeus", date_year: -360, event_type: "publication" }
  ],
  theories: [
    { name: "Atlantis in Mediterranean", status: "active", confidence_level: 3 }
  ]
})

Link multiple entities to an annotation:
bulk_link_annotation_to_entities({
  annotation_id: "[uuid]",
  people: [
    { person_id: "[uuid]", relationship_type: "mentions", quote: "..." }
  ],
  theories: [
    { theory_id: "[uuid]", relationship_type: "supports", quote: "..." }
  ]
})

Get all context for an annotation:
get_annotation_context({ annotation_id: "[uuid]" })
// Returns all linked people, events, and theories

Get all relationships for an entity:
get_entity_relationships({ entity_type: "person", entity_id: "[uuid]" })
// Returns all annotations and places linked to this person
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
