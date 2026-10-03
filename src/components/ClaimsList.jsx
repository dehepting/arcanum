import { useState, useCallback } from 'react';
import { getClaims, createClaim, updateClaim, deleteClaim } from '../lib/provenance';
import { useAsync } from '../hooks/useAsync';
import { showError, showSuccess } from '../utils/errorHandling';
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';

const CLAIM_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#e8b86d' },
  { value: 'under_review', label: 'Under Review', color: '#d4a373' },
  { value: 'accepted', label: 'Accepted', color: '#6ea36e' },
  { value: 'rejected', label: 'Rejected', color: '#c45c4a' },
  { value: 'settled', label: 'Settled', color: '#8b8f99' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#8b8f99' },
];

export default function ClaimsList({ artifactId }) {
  const [claims, setClaims] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Load claims using useAsync hook
  const loadClaims = useCallback(async () => {
    const data = await getClaims(artifactId);
    setClaims(data);
    return data;
  }, [artifactId]);

  const { loading } = useAsync(loadClaims, true);

  const handleDelete = async (claimId) => {
    if (!confirm('Delete this claim?')) return;

    try {
      await deleteClaim(claimId);
      setClaims(claims.filter((c) => c.id !== claimId));
      showSuccess('Claim deleted');
    } catch (err) {
      showError(`Failed to delete claim: ${err.message || 'Unknown error'}`);
    }
  };

  const handleStatusChange = async (claimId, newStatus) => {
    try {
      const updated = await updateClaim(claimId, { status: newStatus });
      setClaims(claims.map((c) => (c.id === claimId ? updated : c)));
      showSuccess('Status updated');
    } catch (err) {
      showError(`Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading claims...
      </div>
    );
  }

  const activeClaims = claims.filter((c) => c.status === 'pending' || c.status === 'under_review');
  const resolvedClaims = claims.filter(
    (c) => c.status !== 'pending' && c.status !== 'under_review'
  );

  return (
    <div style={{ padding: '16px' }}>
      {claims.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}
        >
          <div style={{ marginBottom: '8px' }}>No ownership claims recorded</div>
          <div style={{ fontSize: '11px', marginBottom: '12px' }}>
            Track repatriation requests and disputed ownership
          </div>
          <button
            onClick={() => setShowForm(true)}
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
            + Add Claim
          </button>
        </div>
      ) : (
        <>
          {/* Active Claims */}
          {activeClaims.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}
              >
                Active Claims ({activeClaims.length})
              </div>
              {activeClaims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--accent)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{claim.claimant_name}</div>
                    <select
                      value={claim.status}
                      onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                      style={{
                        background: CLAIM_STATUSES.find((s) => s.value === claim.status)?.color,
                        color: '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {CLAIM_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {claim.claim_basis && (
                    <div
                      style={{ fontSize: '12px', color: 'var(--accent-2)', marginBottom: '6px' }}
                    >
                      Basis: {claim.claim_basis.replace('_', ' ')}
                    </div>
                  )}

                  {claim.details && (
                    <div
                      style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}
                    >
                      {claim.details}
                    </div>
                  )}

                  {claim.claim_date && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Filed: {new Date(claim.claim_date).toLocaleDateString()}
                    </div>
                  )}

                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleDelete(claim.id)}
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
              ))}
            </div>
          )}

          {/* Resolved Claims */}
          {resolvedClaims.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}
              >
                Resolved Claims ({resolvedClaims.length})
              </div>
              {resolvedClaims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    opacity: 0.7,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{claim.claimant_name}</div>
                    <div
                      style={{
                        background: CLAIM_STATUSES.find((s) => s.value === claim.status)?.color,
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      {CLAIM_STATUSES.find((s) => s.value === claim.status)?.label}
                    </div>
                  </div>

                  {claim.resolution_details && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {claim.resolution_details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              background: 'var(--panel)',
              border: '1px dashed var(--line)',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            + Add Claim
          </button>
        </>
      )}

      {/* Simple inline form */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} maxWidth="400px">
        <ModalHeader>Add Ownership Claim</ModalHeader>
        <ModalBody>
          <form
            id="claim-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              try {
                const newClaim = await createClaim({
                  artifact_id: artifactId,
                  claimant_name: formData.get('claimant_name'),
                  claimant_type: formData.get('claimant_type'),
                  claim_basis: formData.get('claim_basis'),
                  details: formData.get('details'),
                  claim_date: formData.get('claim_date') || new Date().toISOString().split('T')[0],
                  status: 'pending',
                });
                setClaims([newClaim, ...claims]);
                setShowForm(false);
                showSuccess('Claim added successfully');
              } catch (err) {
                showError(`Failed to add claim: ${err.message || 'Unknown error'}`);
              }
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                name="claimant_name"
                required
                placeholder="Claimant name *"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  padding: '8px',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  font: 'inherit',
                }}
              />
              <select
                name="claim_basis"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  padding: '8px',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  font: 'inherit',
                }}
              >
                <option value="cultural_heritage">Cultural Heritage</option>
                <option value="illegal_export">Illegal Export</option>
                <option value="looted">Looted</option>
                <option value="stolen">Stolen</option>
                <option value="sacred_object">Sacred Object</option>
              </select>
              <textarea
                name="details"
                rows={3}
                placeholder="Details..."
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  padding: '8px',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  font: 'inherit',
                }}
              />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button type="submit" form="claim-form" className="btn btn-primary" style={{ flex: 1 }}>
              Add
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
}
