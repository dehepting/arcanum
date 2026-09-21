-- Create entity_pages table for hybrid storage
-- Metadata stored here, content stored in Supabase Storage

CREATE TABLE IF NOT EXISTS entity_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'event', 'theory', 'place', 'artifact')),
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- path to .md file in storage: {project_id}/entities/{entity_type}/{entity_id}.md
  metadata JSONB DEFAULT '{}', -- tags, related entities, custom fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_entity_pages_entity ON entity_pages(entity_id);
CREATE INDEX idx_entity_pages_project ON entity_pages(project_id);
CREATE INDEX idx_entity_pages_type ON entity_pages(entity_type);
CREATE INDEX idx_entity_pages_metadata ON entity_pages USING GIN (metadata);

-- Unique constraint: one page per entity
CREATE UNIQUE INDEX idx_entity_pages_unique_entity ON entity_pages(entity_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_entity_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entity_pages_updated_at
  BEFORE UPDATE ON entity_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_pages_updated_at();

-- Create entity_links table for network graph relationships
CREATE TABLE IF NOT EXISTS entity_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_entity_id UUID NOT NULL,
  from_entity_type TEXT NOT NULL,
  to_entity_id UUID NOT NULL,
  to_entity_type TEXT NOT NULL,
  relationship_type TEXT, -- 'mentions', 'influenced', 'located_at', 'authored', etc.
  verified BOOLEAN DEFAULT false, -- whether relationship is verified/confirmed
  notes TEXT, -- additional context about the relationship
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for entity links
CREATE INDEX idx_entity_links_from ON entity_links(from_entity_id);
CREATE INDEX idx_entity_links_to ON entity_links(to_entity_id);
CREATE INDEX idx_entity_links_project ON entity_links(project_id);
CREATE INDEX idx_entity_links_type ON entity_links(relationship_type);

-- Prevent duplicate links (same entities, same relationship type)
CREATE UNIQUE INDEX idx_entity_links_unique ON entity_links(from_entity_id, to_entity_id, relationship_type);

-- Comments for documentation
COMMENT ON TABLE entity_pages IS 'Entity pages with hybrid storage: metadata in DB, content in Storage';
COMMENT ON COLUMN entity_pages.storage_path IS 'Path to markdown file in entity-pages bucket';
COMMENT ON COLUMN entity_pages.metadata IS 'JSONB field for tags, related entities, custom fields';
COMMENT ON TABLE entity_links IS 'Relationships between entities for network graph visualization';
