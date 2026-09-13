# Arcanum MCP Server Setup & Usage Guide

## What Was Built

✅ **Complete MCP Server** (`mcp-server/`)
- 9 powerful tools for artifact management
- Direct Supabase integration
- Project, artifact, provenance, and claims management
- Ready to populate the Atlantis project

✅ **Database Link in Topbar**
- New "Artifacts" button with count badge
- Quick access to artifacts database
- Styled to match Arcanum aesthetic

## Quick Setup (5 minutes)

### Step 1: Get Your Supabase Credentials

You need:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your anonymous/public key

Find these in: Supabase Dashboard → Project Settings → API

### Step 2: Configure MCP Server for Claude Desktop

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "arcanum": {
      "command": "node",
      "args": ["/Users/davidhepting/arcanum/mcp-server/src/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url-here",
        "SUPABASE_ANON_KEY": "your-anon-key-here"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop

The MCP server will now be available in all conversations!

## Available Tools

### Project Management
1. **create_project** - Create research projects
2. **list_projects** - View all projects

### Artifact Database
3. **create_artifact** - Add artifacts with full metadata
4. **search_artifacts** - Query by name, category, etc.
5. **get_artifact** - Detailed artifact info

### Provenance & Claims
6. **add_provenance** - Track artifact history
7. **add_claim** - Document ownership disputes

### Map Integration
8. **create_place** - Add map pins

## Usage Examples

### Create the Atlantis Project

```
Create a new project called "Atlantis: Lost Civilization Artifacts" with description
"Comprehensive catalog of mythological artifacts from the lost city of Atlantis,
focusing on the Bronze Age period and connections to ancient Mediterranean cultures."

Set the map center to the Mediterranean (lng: 25.0, lat: 35.0) with zoom level 4.5.
```

###  Add Mythological Artifacts

**Trident of Poseidon:**
```
Create an artifact in the Atlantis project:
- Name: Trident of Poseidon
- Category: Weaponry & Armor
- Period: Mythological Bronze Age (circa 9600 BCE)
- Material: Divine orichalcum with electrum inlay
- Dimensions: 2.4m length, three prongs each 45cm
- Condition: excellent
- Description: Three-pronged divine weapon said to command the seas and cause earthquakes.
  Forged by the Cyclopes and gifted to Poseidon. Features wave patterns and dolphin motifs.
- Current location: Sunken Temple of Poseidon, Atlantis Central Square
- Findspot: Atlantis Central Temple (lng: 24.5, lat: 35.2)
- Notes: According to Plato's Critias, this artifact was housed in the main temple complex
```

**Atlantean Sun Disc:**
```
Create an artifact:
- Name: Atlantean Sun Disc
- Category: Religious Artifacts
- Period: Late Atlantean Period (9700-9600 BCE)
- Material: Gold with orichalcum core, precious stones
- Dimensions: 1.2m diameter, 8cm thick
- Condition: good
- Description: Massive ceremonial disc used in solar worship ceremonies. Features concentric
  circles representing the ten kingdoms of Atlantis and astronomical alignments.
- Current owner: Submerged Atlantean Archives
- Owner type: government
- Findspot: Temple of Cleito (lng: 24.3, lat: 35.3)
```

**Atlas's Crown:**
```
- Name: Crown of Atlas, First King
- Category: Jewelry & Ornaments
- Period: Early Atlantean Dynasty (10000 BCE)
- Material: Orichalcum with sea pearl incrustations
- Condition: fragmentary
- Description: Royal crown of Atlas, first king and demigod son of Poseidon
- Current location: Royal Vault, Atlantis Museum of Antiquities
```

### Add Provenance

```
Add discovery provenance for the Trident:
- Event type: discovery
- Date: 9600 BCE
- Owner: Poseidon, God of the Sea
- Location: Atlantis Central Temple
- Description: Found in the throne room during the great cataclysm
- Source: Plato's Critias and Timaeus dialogues
- Verified: false
```

```
Add acquisition provenance:
- Event type: acquisition
- Date: 1885-06-15
- Owner: British Museum (rejected acquisition)
- Location: Theoretical Holdings Department
- Description: Proposed acquisition documented in museum archives as "mythological speculation"
- Source: BM Archive Reference: ATL-1885-REF-047
```

### Add Claims

```
Add a claim for the Atlantean Sun Disc:
- Claimant: Hellenic Republic
- Claimant type: government
- Claim basis: Geographic and cultural heritage rights to pre-Hellenic Aegean artifacts
- Status: under_review
- Description: Greece claims cultural patrimony over all Aegean Bronze Age artifacts,
  including hypothetical Atlantean materials
```

## Populating Atlantis - Complete Workflow

Here's the recommended sequence:

1. **Create Project**
2. **Add 10-15 Mythological Artifacts:**
   - Trident of Poseidon
   - Atlantean Sun Disc
   - Crown of Atlas
   - Orichalcum Pillars (Hercules)
   - Library of Cleito (manuscripts)
   - Naval Maps (Atlantean cartography)
   - Ceremonial Bull Statues
   - Temple Frescoes
   - Philosopher's Codex
   - Sea Charts with concentric circles

3. **Add Provenance Entries**
   - Discovery events (9600 BCE cataclysm)
   - Mythological ownership periods
   - Modern "theoretical" acquisitions
   - Archaeological speculation events

4. **Add Modern Claims**
   - Greek government claims
   - UNESCO cultural heritage disputes
   - Academic institution claims
   - Fictional repatriation requests

5. **Add Map Places**
   - Central Temple Complex
   - Royal Palace
   - Temple of Poseidon
   - Temple of Cleito
   - The Citadel
   - Harbor Districts

## Pro Tips

### Batch Creation
Ask Claude to create multiple artifacts in one go:
```
Create 5 artifacts for Atlantis: ceremonial weapons, religious items, and architectural elements
```

### Rich Descriptions
The more detail, the better:
- Include mythological context
- Reference ancient sources (Plato, etc.)
- Add fictional "discovery" narratives
- Create plausible provenance chains

### Realistic Metadata
- Use consistent date formats
- Include accession numbers (even fictional)
- Add dimensions and materials
- Note condition (many should be fragmentary/submerged)

### Provenance Chains
Create believable history:
1. Original creation/use
2. Cataclysm/loss event (9600 BCE)
3. Legendary rediscovery attempts
4. Modern archaeological speculation
5. Museum "theoretical holdings"

## Testing the Topbar Link

After configuring the MCP server:

1. Start the app: `npm run dev`
2. You should see "🏺 Artifacts" in the topbar
3. The badge shows artifact count
4. Click to view the artifacts database

## Example Session

Start a conversation with Claude:

```
Hi! I've configured the Arcanum MCP server. Let's populate the Atlantis project
with mythological artifacts. First, create the project, then add the Trident of
Poseidon with full provenance from its creation to modern times.
```

Claude will:
1. Use `create_project` tool
2. Use `create_artifact` tool with full metadata
3. Use `add_provenance` tool multiple times
4. Provide you with the project ID and artifact IDs

## Troubleshooting

**MCP server not showing in Claude:**
- Check claude_desktop_config.json syntax
- Ensure file paths are absolute
- Restart Claude Desktop completely

**Database errors:**
- Verify Supabase credentials
- Check tables exist (run Phase 3 schema if needed)
- Ensure RLS is disabled

**Tool not found:**
- List available tools: "What MCP tools do you have?"
- Check server is running in Claude's MCP status

## Architecture

```
Claude Desktop
    ↓ (stdio)
MCP Server (Node.js)
    ↓ (Supabase JS Client)
Supabase Database
    ↓
Arcanum App (React)
```

The MCP server provides a Claude-friendly interface to your database,
allowing natural language commands to populate and manage your artifacts.

## Next Steps

After populating Atlantis:
1. Test all artifact features in the UI
2. Create PDF sources with artifact mentions
3. Link artifacts to annotations (Phase 3)
4. Add provenance timelines
5. Document ownership claims
6. Create map pins for findspots

---

**Status:** MCP Server Ready ✅
**Topbar Link:** Implemented ✅
**Next:** Configure + Populate Atlantis 🏛️
