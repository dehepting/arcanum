import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from 'react';
import useStore from '../store/useStore';
import { createArtifact, updateArtifact, uploadArtifactImage } from '../lib/artifacts';
import { showError, showSuccess } from '../utils/errorHandling';
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';
import FormField from './FormField';
import FormSelect from './FormSelect';
import FormTextarea from './FormTextarea';
import type { Artifact } from '../types/entities';

const CATEGORIES = [
  'Pottery & Ceramics',
  'Coins & Currency',
  'Sculptures & Statues',
  'Paintings & Frescoes',
  'Manuscripts & Documents',
  'Jewelry & Ornaments',
  'Architecture',
  'Weaponry & Armor',
  'Textiles',
  'Religious Artifacts',
  'Other',
];

const OWNER_TYPES = ['museum', 'private', 'government', 'unknown'];
const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'fragmentary'];

interface ArtifactFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  period: string;
  estimated_age: string;
  date_found: string;
  findspot_place_id: string;
  findspot_description: string;
  excavation_notes: string;
  current_location: string;
  current_owner: string;
  owner_type: string;
  accession_number: string;
  material: string;
  dimensions: string;
  weight: string;
  condition: string;
  notes: string;
}

interface ArtifactFormProps {
  artifact?: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArtifactForm({ artifact, isOpen, onClose }: ArtifactFormProps) {
  const [formData, setFormData] = useState<ArtifactFormData>({
    name: '',
    description: '',
    category: 'Pottery & Ceramics',
    subcategory: '',
    period: '',
    estimated_age: '',
    date_found: '',
    findspot_place_id: '',
    findspot_description: '',
    excavation_notes: '',
    current_location: '',
    current_owner: '',
    owner_type: 'museum',
    accession_number: '',
    material: '',
    dimensions: '',
    weight: '',
    condition: 'good',
    notes: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProject = useStore((state) => state.currentProject);
  const places = useStore((state) => state.places);
  const addArtifact = useStore((state) => state.addArtifact);
  const updateArtifactStore = useStore((state) => state.updateArtifact);

  // Sync form data when editing different artifact - intentional pattern
  // Alternative would be using key prop, but that loses unsaved changes on tab switch
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    if (artifact) {
      setFormData({
        name: artifact.name || '',
        description: artifact.description || '',
        category: artifact.category || 'Pottery & Ceramics',
        subcategory: artifact.subcategory || '',
        period: artifact.period || '',
        estimated_age: artifact.estimated_age || '',
        date_found: artifact.date_found || '',
        findspot_place_id: artifact.findspot_place_id || '',
        findspot_description: artifact.findspot_description || '',
        excavation_notes: artifact.excavation_notes || '',
        current_location: artifact.current_location || '',
        current_owner: artifact.current_owner || '',
        owner_type: artifact.owner_type || 'museum',
        accession_number: artifact.accession_number || '',
        material: artifact.material || '',
        dimensions: artifact.dimensions || '',
        weight: artifact.weight || '',
        condition: artifact.condition || 'good',
        notes: artifact.notes || '',
      });
      setImages(artifact.image_urls || []);
    } else {
      // Reset for new artifact
      setFormData({
        name: '',
        description: '',
        category: 'Pottery & Ceramics',
        subcategory: '',
        period: '',
        estimated_age: '',
        date_found: '',
        findspot_place_id: '',
        findspot_description: '',
        excavation_notes: '',
        current_location: '',
        current_owner: '',
        owner_type: 'museum',
        accession_number: '',
        material: '',
        dimensions: '',
        weight: '',
        condition: 'good',
        notes: '',
      });
      setImages([]);
    }
  }, [artifact, isOpen]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadArtifactImage(file, currentProject!.id));
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedUrls]);
    } catch (err) {
      showError(`Failed to upload images: ${(err as Error).message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter an artifact name');
      return;
    }

    setUploading(true);
    try {
      const artifactData = {
        ...formData,
        project_id: currentProject!.id,
        image_urls: images,
        findspot_place_id: formData.findspot_place_id || null,
      };

      if (artifact) {
        // Update existing
        const updated = await updateArtifact(artifact.id, artifactData);
        updateArtifactStore(artifact.id, updated);
      } else {
        // Create new
        const created = await createArtifact(artifactData);
        addArtifact(created);
      }

      showSuccess(artifact ? 'Artifact updated successfully!' : 'Artifact created successfully!');
      onClose();
    } catch (err) {
      showError(`Failed to save artifact: ${(err as Error).message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="700px">
      <ModalHeader>{artifact ? 'Edit Artifact' : 'Add Artifact'}</ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Name */}
            <FormField
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              containerStyle={{ gridColumn: '1 / -1' }}
            />

            {/* Category */}
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={CATEGORIES}
            />

            {/* Period */}
            <FormField
              label="Period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              placeholder="e.g., Late Bronze Age"
            />

            {/* Estimated Age */}
            <FormField
              label="Estimated Age"
              value={formData.estimated_age}
              onChange={(e) => setFormData({ ...formData, estimated_age: e.target.value })}
              placeholder="e.g., 550-540 BCE"
            />

            {/* Findspot */}
            <FormSelect
              label="Findspot (Link to Place)"
              value={formData.findspot_place_id}
              onChange={(e) => setFormData({ ...formData, findspot_place_id: e.target.value })}
              options={[
                { value: '', label: 'None' },
                ...places.map((place) => ({ value: place.id, label: place.name })),
              ]}
            />

            {/* Current Owner */}
            <FormField
              label="Current Owner"
              value={formData.current_owner}
              onChange={(e) => setFormData({ ...formData, current_owner: e.target.value })}
              placeholder="e.g., British Museum"
            />

            {/* Owner Type */}
            <FormSelect
              label="Owner Type"
              value={formData.owner_type}
              onChange={(e) => setFormData({ ...formData, owner_type: e.target.value })}
              options={OWNER_TYPES.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              }))}
            />

            {/* Current Location */}
            <FormField
              label="Current Location"
              value={formData.current_location}
              onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
              placeholder="e.g., British Museum, London"
            />

            {/* Material */}
            <FormField
              label="Material"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              placeholder="e.g., terracotta, bronze"
            />

            {/* Dimensions */}
            <FormField
              label="Dimensions"
              value={formData.dimensions}
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              placeholder="e.g., H: 45cm, W: 30cm"
            />

            {/* Condition */}
            <FormSelect
              label="Condition"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              options={CONDITIONS.map((cond) => ({
                value: cond,
                label: cond.charAt(0).toUpperCase() + cond.slice(1),
              }))}
            />

            {/* Description */}
            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              containerStyle={{ gridColumn: '1 / -1' }}
            />

            {/* Images */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Images
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: uploading ? 'wait' : 'pointer',
                  fontSize: '12px',
                }}
              >
                {uploading ? 'Uploading...' : '+ Add Images'}
              </button>
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {images.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <img
                        src={url}
                        alt={`Artifact ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" onClick={onClose} className="btn" disabled={uploading}>
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? 'Saving...' : artifact ? 'Update' : 'Create'}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
