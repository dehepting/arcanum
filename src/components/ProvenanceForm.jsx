import { useState, useEffect } from 'react';
import { createProvenanceEntry, updateProvenanceEntry } from '../lib/provenance';

const TRANSFER_METHODS = [
  'excavation',
  'purchase',
  'gift',
  'inheritance',
  'theft',
  'loan',
  'repatriation',
  'unknown',
];

const OWNER_TYPES = [
  'museum',
  'private',
  'government',
  'religious',
  'in_situ',
  'unknown',
  'destroyed',
];

export default function ProvenanceForm({ artifactId, entry, isOpen, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    owner_name: '',
    owner_type: 'museum',
    location: '',
    date_from: '',
    date_to: '',
    is_current: false,
    transfer_method: 'purchase',
    transfer_details: '',
    purchase_price: '',
    verified: false,
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        owner_name: entry.owner_name || '',
        owner_type: entry.owner_type || 'museum',
        location: entry.location || '',
        date_from: entry.date_from || '',
        date_to: entry.date_to || '',
        is_current: entry.is_current || false,
        transfer_method: entry.transfer_method || 'purchase',
        transfer_details: entry.transfer_details || '',
        purchase_price: entry.purchase_price || '',
        verified: entry.verified || false,
        notes: entry.notes || '',
      });
    } else {
      setFormData({
        owner_name: '',
        owner_type: 'museum',
        location: '',
        date_from: '',
        date_to: '',
        is_current: false,
        transfer_method: 'purchase',
        transfer_details: '',
        purchase_price: '',
        verified: false,
        notes: '',
      });
    }
  }, [entry, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.owner_name.trim()) {
      alert('Please enter an owner name');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        artifact_id: artifactId,
      };

      if (entry) {
        await updateProvenanceEntry(entry.id, data);
      } else {
        await createProvenanceEntry(data);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save provenance:', err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(500px, 100%)',
          maxHeight: '90vh',
          background: 'var(--panel-2)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'IBM Plex Serif, serif' }}>
            {entry ? 'Edit Provenance Entry' : 'Add Provenance Entry'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Owner Name */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Owner Name *
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="e.g., British Museum"
                required
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--line)',
                  padding: '8px',
                  borderRadius: '4px',
                  font: 'inherit',
                }}
              />
            </div>

            {/* Owner Type & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Owner Type
                </label>
                <select
                  value={formData.owner_type}
                  onChange={(e) => setFormData({ ...formData, owner_type: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                    padding: '8px',
                    borderRadius: '4px',
                    font: 'inherit',
                  }}
                >
                  {OWNER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., London, UK"
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                    padding: '8px',
                    borderRadius: '4px',
                    font: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  From Date
                </label>
                <input
                  type="date"
                  value={formData.date_from}
                  onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                    padding: '8px',
                    borderRadius: '4px',
                    font: 'inherit',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  To Date
                </label>
                <input
                  type="date"
                  value={formData.date_to}
                  onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                  disabled={formData.is_current}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                    padding: '8px',
                    borderRadius: '4px',
                    font: 'inherit',
                    opacity: formData.is_current ? 0.5 : 1,
                  }}
                />
              </div>
            </div>

            {/* Is Current */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={formData.is_current}
                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              Current owner (present day)
            </label>

            {/* Transfer Method */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Transfer Method
              </label>
              <select
                value={formData.transfer_method}
                onChange={(e) => setFormData({ ...formData, transfer_method: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--line)',
                  padding: '8px',
                  borderRadius: '4px',
                  font: 'inherit',
                }}
              >
                {TRANSFER_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Price */}
            {formData.transfer_method === 'purchase' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Purchase Price
                </label>
                <input
                  type="text"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="e.g., £500, $1,000,000"
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                    padding: '8px',
                    borderRadius: '4px',
                    font: 'inherit',
                  }}
                />
              </div>
            )}

            {/* Transfer Details */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Transfer Details
              </label>
              <textarea
                value={formData.transfer_details}
                onChange={(e) => setFormData({ ...formData, transfer_details: e.target.value })}
                rows={3}
                placeholder="Additional details about the transfer..."
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--line)',
                  padding: '8px',
                  borderRadius: '4px',
                  font: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Verified */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              Verified (with documentation)
            </label>
          </div>
        </form>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" onClick={onClose} className="btn" disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : entry ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
