import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { createArtifact, updateArtifact, uploadArtifactImage } from '../lib/artifacts';

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

export default function ArtifactForm({ artifact, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Pottery & Ceramics',
    subcategory: '',
    period: '',
    estimated_age: '',
    date_found: '',
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

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const currentProject = useStore((state) => state.currentProject);
  const places = useStore((state) => state.places);
  const addArtifact = useStore((state) => state.addArtifact);
  const updateArtifactInStore = useStore((state) => state.updateArtifactInStore);

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadArtifactImage(file, currentProject.id));
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedUrls]);
    } catch (err) {
      console.error('Failed to upload images:', err);
      alert(`Failed to upload images: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter an artifact name');
      return;
    }

    setUploading(true);
    try {
      const artifactData = {
        ...formData,
        project_id: currentProject.id,
        image_urls: images,
        findspot_place_id: formData.findspot_place_id || null,
      };

      if (artifact) {
        // Update existing
        const updated = await updateArtifact(artifact.id, artifactData);
        updateArtifactInStore(artifact.id, updated);
      } else {
        // Create new
        const created = await createArtifact(artifactData);
        addArtifact(created);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save artifact:', err);
      alert(`Failed to save artifact: ${err.message}`);
    } finally {
      setUploading(false);
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
          width: 'min(700px, 100%)',
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
            {artifact ? 'Edit Artifact' : 'Add Artifact'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            {/* Category */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Period
              </label>
              <input
                type="text"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="e.g., Late Bronze Age"
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

            {/* Estimated Age */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Estimated Age
              </label>
              <input
                type="text"
                value={formData.estimated_age}
                onChange={(e) => setFormData({ ...formData, estimated_age: e.target.value })}
                placeholder="e.g., 550-540 BCE"
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

            {/* Findspot */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Findspot (Link to Place)
              </label>
              <select
                value={formData.findspot_place_id}
                onChange={(e) => setFormData({ ...formData, findspot_place_id: e.target.value })}
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
                <option value="">None</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Owner */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Current Owner
              </label>
              <input
                type="text"
                value={formData.current_owner}
                onChange={(e) => setFormData({ ...formData, current_owner: e.target.value })}
                placeholder="e.g., British Museum"
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

            {/* Owner Type */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
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
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Location */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Current Location
              </label>
              <input
                type="text"
                value={formData.current_location}
                onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                placeholder="e.g., British Museum, London"
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

            {/* Material */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Material
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g., terracotta, bronze"
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

            {/* Dimensions */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Dimensions
              </label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="e.g., H: 45cm, W: 30cm"
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

            {/* Condition */}
            <div>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
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
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
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

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
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
      </div>
    </div>
  );
}
