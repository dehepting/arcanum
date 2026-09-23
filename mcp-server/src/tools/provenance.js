import { getDatabase } from '../db.js';
import { generateUUID } from '../utils/uuid.js';
import { getCurrentTimestamp, formatToolResponse } from '../utils/formatters.js';

export const provenanceTools = [
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
    name: 'batch_add_provenance',
    description: 'Add multiple provenance entries in a single operation for efficiency',
    inputSchema: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              artifact_id: { type: 'string' },
              date_from: { type: 'string' },
              date_to: { type: 'string' },
              is_current: { type: 'boolean' },
              owner_name: { type: 'string' },
              owner_type: { type: 'string' },
              location: { type: 'string' },
              transfer_method: { type: 'string' },
              transfer_details: { type: 'string' },
              purchase_price: { type: 'string' },
              notes: { type: 'string' },
              verified: { type: 'boolean' },
            },
            required: ['artifact_id', 'owner_name'],
          },
          description: 'Array of provenance entries to create',
        },
      },
      required: ['entries'],
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
];

export const provenanceHandlers = {
  add_provenance: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO artifact_provenance (
        id, artifact_id, date_from, date_to, is_current,
        owner_name, owner_type, location, transfer_method,
        transfer_details, purchase_price, notes, verified,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const provenance = stmt.get(
      id,
      args.artifact_id,
      args.date_from || null,
      args.date_to || null,
      args.is_current ? 1 : 0,
      args.owner_name,
      args.owner_type || null,
      args.location || null,
      args.transfer_method || null,
      args.transfer_details || null,
      args.purchase_price || null,
      args.notes || null,
      args.verified ? 1 : 0,
      now,
      now
    );

    return formatToolResponse(
      `Provenance entry added successfully:\n${JSON.stringify(provenance, null, 2)}`
    );
  },

  batch_add_provenance: (args) => {
    const db = getDatabase();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO artifact_provenance (
        id, artifact_id, date_from, date_to, is_current,
        owner_name, owner_type, location, transfer_method,
        transfer_details, purchase_price, notes, verified,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const entries = [];
    const insertMany = db.transaction((entriesData) => {
      for (const e of entriesData) {
        const id = generateUUID();
        const entry = stmt.get(
          id,
          e.artifact_id,
          e.date_from || null,
          e.date_to || null,
          e.is_current ? 1 : 0,
          e.owner_name,
          e.owner_type || null,
          e.location || null,
          e.transfer_method || null,
          e.transfer_details || null,
          e.purchase_price || null,
          e.notes || null,
          e.verified ? 1 : 0,
          now,
          now
        );
        entries.push(entry);
      }
    });

    insertMany(args.entries);

    return formatToolResponse(
      `Batch provenance entries added successfully:\n${entries.length} entries created`
    );
  },

  add_claim: (args) => {
    const db = getDatabase();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO artifact_claims (
        id, artifact_id, claimant_name, claimant_type,
        claim_basis, claim_date, status, details,
        legal_reference, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const claim = stmt.get(
      id,
      args.artifact_id,
      args.claimant_name,
      args.claimant_type || null,
      args.claim_basis,
      args.claim_date || null,
      args.status || 'pending',
      args.details || null,
      args.legal_reference || null,
      now,
      now
    );

    return formatToolResponse(`Claim added successfully:\n${JSON.stringify(claim, null, 2)}`);
  },
};
