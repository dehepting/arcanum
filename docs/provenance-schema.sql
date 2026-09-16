  -- Provenance & Ownership Tracking - Phase 2
  -- Run this in Supabase SQL Editor

  -- Create provenance table
  CREATE TABLE artifact_provenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,

    -- Time period
    date_from DATE,
    date_to DATE,
    is_current BOOLEAN DEFAULT false,

    -- Owner info
    owner_name TEXT NOT NULL,
    owner_type TEXT, -- 'museum', 'private', 'government', 'religious', 'in_situ', 'unknown', 'destroyed'
    location TEXT,

    -- Transfer details
    transfer_method TEXT, -- 'excavation', 'purchase', 'gift', 'inheritance', 'theft', 'loan', 'repatriation', 'unknown'
    transfer_details TEXT,
    purchase_price TEXT, -- e.g., "£500", "$1,000,000"

    -- Documentation
    documentation_urls TEXT[],
    verified BOOLEAN DEFAULT false,
    notes TEXT,

    -- Order for display
    sequence_order INT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Create claims table for disputed ownership
  CREATE TABLE artifact_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,

    -- Claimant info
    claimant_name TEXT NOT NULL,
    claimant_type TEXT, -- 'government', 'institution', 'individual', 'indigenous_group', 'religious_organization'

    -- Claim details
    claim_basis TEXT, -- 'cultural_heritage', 'illegal_export', 'looted', 'stolen', 'rightful_heir', 'sacred_object'
    claim_date DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'under_review', 'accepted', 'rejected', 'settled', 'withdrawn'

    -- Details
    details TEXT,
    documentation_urls TEXT[],
    legal_reference TEXT,

    -- Resolution
    resolution_date DATE,
    resolution_details TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Add provenance fields to artifacts table
  ALTER TABLE artifacts
  ADD COLUMN provenance_summary TEXT,
  ADD COLUMN has_disputed_ownership BOOLEAN DEFAULT false,
  ADD COLUMN legal_status TEXT; -- 'clear', 'disputed', 'under_investigation', 'restricted'

  -- Create indexes
  CREATE INDEX idx_provenance_artifact ON artifact_provenance(artifact_id);
  CREATE INDEX idx_provenance_sequence ON artifact_provenance(artifact_id, sequence_order);
  CREATE INDEX idx_claims_artifact ON artifact_claims(artifact_id);
  CREATE INDEX idx_claims_status ON artifact_claims(status);

  -- Create function to update artifact dispute status
  CREATE OR REPLACE FUNCTION update_artifact_dispute_status()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Check if there are any active claims
    UPDATE artifacts
    SET has_disputed_ownership = EXISTS (
      SELECT 1 FROM artifact_claims
      WHERE artifact_id = NEW.artifact_id
      AND status IN ('pending', 'under_review')
    )
    WHERE id = NEW.artifact_id;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create trigger to auto-update dispute status
  CREATE TRIGGER update_dispute_status_trigger
  AFTER INSERT OR UPDATE ON artifact_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_artifact_dispute_status();
