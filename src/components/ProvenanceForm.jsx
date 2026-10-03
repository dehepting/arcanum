import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { createProvenanceEntry, updateProvenanceEntry } from '../lib/provenance';
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';
import FormField from './FormField';
import FormSelect from './FormSelect';
import FormTextarea from './FormTextarea';

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

  // Sync form data when editing different entry - intentional pattern
  // eslint-disable-next-line react/set-state-in-effect
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
      logger.error('Failed to save provenance:', err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <ModalHeader>{entry ? 'Edit Provenance Entry' : 'Add Provenance Entry'}</ModalHeader>
      <ModalBody>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {/* Owner Name */}
          <FormField
            label="Owner Name *"
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            placeholder="e.g., British Museum"
            required
          />

          {/* Owner Type & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormSelect
              label="Owner Type"
              value={formData.owner_type}
              onChange={(e) => setFormData({ ...formData, owner_type: e.target.value })}
              options={OWNER_TYPES.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
              }))}
            />

            <FormField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., London, UK"
            />
          </div>

          {/* Date Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              label="From Date"
              type="date"
              value={formData.date_from}
              onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
            />

            <FormField
              label="To Date"
              type="date"
              value={formData.date_to}
              onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
              disabled={formData.is_current}
              inputStyle={{ opacity: formData.is_current ? 0.5 : 1 }}
            />
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
          <FormSelect
            label="Transfer Method"
            value={formData.transfer_method}
            onChange={(e) => setFormData({ ...formData, transfer_method: e.target.value })}
            options={TRANSFER_METHODS.map((method) => ({
              value: method,
              label: method.charAt(0).toUpperCase() + method.slice(1),
            }))}
          />

          {/* Purchase Price */}
          {formData.transfer_method === 'purchase' && (
            <FormField
              label="Purchase Price"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              placeholder="e.g., £500, $1,000,000"
            />
          )}

          {/* Transfer Details */}
          <FormTextarea
            label="Transfer Details"
            value={formData.transfer_details}
            onChange={(e) => setFormData({ ...formData, transfer_details: e.target.value })}
            rows={3}
            placeholder="Additional details about the transfer..."
          />

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
        </form>
      </ModalBody>
      <ModalFooter>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
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
      </ModalFooter>
    </Modal>
  );
}
