import { useState, useCallback } from 'react';
import { getProvenance, deleteProvenanceEntry } from '../lib/provenance';
import { useAsync } from '../hooks/useAsync';
import { showError, showSuccess } from '../utils/errorHandling';

const TRANSFER_METHODS: Record<string, string> = {
  excavation: '🔨 Excavation',
  purchase: '💰 Purchase',
  gift: '🎁 Gift',
  inheritance: '👨‍👩‍👧 Inheritance',
  theft: '⚠️ Theft',
  loan: '🤝 Loan',
  repatriation: '🏛️ Repatriation',
  unknown: '❓ Unknown',
};

interface ProvenanceEntry {
  id: string;
  owner_name: string;
  owner_type?: string;
  location?: string;
  date_from?: string;
  date_to?: string;
  is_current?: boolean;
  transfer_method?: string;
  transfer_details?: string;
  purchase_price?: string;
  verified?: boolean;
  [key: string]: any;
}

interface ProvenanceTimelineProps {
  artifactId: string;
  onEdit: (entry: ProvenanceEntry | null) => void;
}

export default function ProvenanceTimeline({ artifactId, onEdit }: ProvenanceTimelineProps) {
  const [provenance, setProvenance] = useState<ProvenanceEntry[]>([]);

  // Load provenance using useAsync hook
  const loadProvenance = useCallback(async () => {
    const data = await getProvenance(artifactId);
    setProvenance(data as any);
    return data;
  }, [artifactId]);

  const { loading } = useAsync(loadProvenance, true);

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this provenance entry?')) return;

    try {
      await deleteProvenanceEntry(entryId);
      setProvenance(provenance.filter((p) => p.id !== entryId));
      showSuccess('Provenance entry deleted');
    } catch (err) {
      showError(`Failed to delete entry: ${(err as Error).message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading provenance...
      </div>
    );
  }

  if (provenance.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        <div style={{ marginBottom: '8px' }}>No provenance history recorded</div>
        <button
          onClick={() => onEdit(null)}
          style={{
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          + Add Provenance Entry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: '20px',
            top: '10px',
            bottom: '10px',
            width: '2px',
            background: 'var(--line)',
          }}
        />

        {/* Entries */}
        {provenance.map((entry) => (
          <div
            key={entry.id}
            style={{
              position: 'relative',
              paddingLeft: '50px',
              marginBottom: '24px',
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: 'absolute',
                left: '14px',
                top: '0',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: entry.is_current ? 'var(--accent)' : 'var(--accent-2)',
                border: '2px solid var(--bg)',
                zIndex: 1,
              }}
            />

            {/* Content */}
            <div
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              {/* Date range */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                {entry.date_from || '?'} — {entry.is_current ? 'Present' : entry.date_to || '?'}
                {entry.is_current && (
                  <span
                    style={{
                      marginLeft: '8px',
                      background: 'var(--accent)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}
                  >
                    CURRENT
                  </span>
                )}
              </div>

              {/* Owner */}
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                {entry.owner_name}
              </div>

              {/* Location */}
              {entry.location && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  📍 {entry.location}
                </div>
              )}

              {/* Transfer method */}
              {entry.transfer_method && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--accent-2)',
                    marginBottom: '4px',
                  }}
                >
                  {TRANSFER_METHODS[entry.transfer_method] || entry.transfer_method}
                  {entry.purchase_price && <span> • {entry.purchase_price}</span>}
                </div>
              )}

              {/* Transfer details */}
              {entry.transfer_details && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {entry.transfer_details}
                </div>
              )}

              {/* Verified badge */}
              {entry.verified && (
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    fontSize: '10px',
                    color: 'var(--accent-2)',
                    background: 'var(--bg)',
                    padding: '3px 8px',
                    borderRadius: '3px',
                  }}
                >
                  ✓ Verified
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onEdit(entry)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--text)',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--accent)',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--accent)',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => onEdit(null)}
        style={{
          width: '100%',
          background: 'var(--panel)',
          border: '1px dashed var(--line)',
          padding: '10px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '8px',
        }}
      >
        + Add Provenance Entry
      </button>
    </div>
  );
}
