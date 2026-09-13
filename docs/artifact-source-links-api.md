# Artifact-Source Links API Reference

## Overview
The artifact-source linking system connects artifact records to mentions in PDF source documents. This enables researchers to track where artifacts are referenced in the literature.

## Database Schema

### Table: `artifact_source_links`
```sql
CREATE TABLE artifact_source_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  quote TEXT,                    -- Excerpt from PDF
  context TEXT,                  -- Additional notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artifact_id, annotation_id)
);
```

**Cascade Behavior:**
- Deleting an artifact → Deletes all its source links
- Deleting an annotation → Deletes all its artifact links
- No orphaned links possible

## JavaScript API

### Import
```javascript
import {
  linkArtifactToAnnotation,
  unlinkArtifactFromAnnotation,
  getSourcesForArtifact,
  getArtifactsForAnnotation,
  getArtifactsForSource,
  checkArtifactLink
} from '../lib/artifact-sources';
```

---

## Functions

### `linkArtifactToAnnotation(artifactId, annotationId, quote, context)`

Create a link between an artifact and an annotation.

**Parameters:**
- `artifactId` (string) - UUID of the artifact
- `annotationId` (string) - UUID of the annotation
- `quote` (string, optional) - Text excerpt from PDF, default: ''
- `context` (string, optional) - Additional notes, default: ''

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: {
    id: string,
    artifact_id: string,
    annotation_id: string,
    quote: string,
    context: string,
    created_at: string
  },
  error?: string
}>
```

**Example:**
```javascript
const result = await linkArtifactToAnnotation(
  'artifact-uuid-123',
  'annotation-uuid-456',
  'A black-figure amphora was discovered in sector B...',
  'Primary discovery report'
);

if (result.success) {
  console.log('Link created:', result.data.id);
} else {
  console.error('Error:', result.error);
}
```

**Notes:**
- Unique constraint prevents duplicate links
- Returns error if link already exists
- Foreign key constraints ensure referential integrity

---

### `unlinkArtifactFromAnnotation(artifactId, annotationId)`

Remove the link between an artifact and annotation.

**Parameters:**
- `artifactId` (string) - UUID of the artifact
- `annotationId` (string) - UUID of the annotation

**Returns:**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

**Example:**
```javascript
const result = await unlinkArtifactFromAnnotation(
  'artifact-uuid-123',
  'annotation-uuid-456'
);

if (result.success) {
  console.log('Link removed');
}
```

**Notes:**
- Safe to call even if link doesn't exist (no error)
- Soft operation - only affects junction table

---

### `getSourcesForArtifact(artifactId)`

Get all PDF source references (linked annotations) for an artifact.

**Parameters:**
- `artifactId` (string) - UUID of the artifact

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: Array<{
    id: string,              // Link ID
    annotation_id: string,
    quote: string,
    context: string,
    created_at: string,
    annotations: {
      id: string,
      source_id: string,
      page_number: number,
      type: string,
      text: string,
      content: string,
      sources: {
        id: string,
        title: string,
        filename: string
      }
    }
  }>,
  error?: string
}>
```

**Example:**
```javascript
const result = await getSourcesForArtifact('artifact-uuid-123');

if (result.success) {
  result.data.forEach(source => {
    console.log(`${source.annotations.sources.title} - Page ${source.annotations.page_number}`);
    console.log(`Quote: "${source.quote}"`);
  });
}
```

**Notes:**
- Returns empty array if no sources linked
- Includes full annotation and source details via joins
- Ordered by created_at DESC (newest first)

---

### `getArtifactsForAnnotation(annotationId)`

Get all artifacts linked to a specific annotation.

**Parameters:**
- `annotationId` (string) - UUID of the annotation

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: Array<{
    id: string,              // Link ID
    artifact_id: string,
    quote: string,
    context: string,
    created_at: string,
    artifacts: {
      id: string,
      name: string,
      category: string,
      image_urls: string[],
      description: string
    }
  }>,
  error?: string
}>
```

**Example:**
```javascript
const result = await getArtifactsForAnnotation('annotation-uuid-456');

if (result.success && result.data.length > 0) {
  const firstArtifact = result.data[0].artifacts;
  console.log('Linked to:', firstArtifact.name);
}
```

**Notes:**
- Supports multiple artifacts per annotation
- Used by AnnotationOverlay to show badges
- Returns empty array if no artifacts linked

---

### `getArtifactsForSource(sourceId)`

Get all artifacts mentioned anywhere in a PDF source.

**Parameters:**
- `sourceId` (string) - UUID of the source (PDF)

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: Array<{
    id: string,              // Link ID
    artifact_id: string,
    annotation_id: string,
    quote: string,
    context: string,
    artifacts: {
      id: string,
      name: string,
      category: string,
      image_urls: string[],
      description: string
    },
    annotations: {
      id: string,
      page_number: number,
      text: string
    }
  }>,
  error?: string
}>
```

**Example:**
```javascript
const result = await getArtifactsForSource('source-uuid-789');

if (result.success) {
  console.log(`Found ${result.data.length} artifacts in this document`);

  // Group by artifact
  const byArtifact = {};
  result.data.forEach(link => {
    const artifactId = link.artifacts.id;
    if (!byArtifact[artifactId]) {
      byArtifact[artifactId] = {
        artifact: link.artifacts,
        mentions: []
      };
    }
    byArtifact[artifactId].mentions.push({
      page: link.annotations.page_number,
      quote: link.quote
    });
  });
}
```

**Notes:**
- Useful for "Artifacts in this document" feature
- Returns all annotation-artifact pairs
- Same artifact may appear multiple times (different pages)

---

### `checkArtifactLink(artifactId, annotationId)`

Check if an artifact and annotation are linked.

**Parameters:**
- `artifactId` (string) - UUID of the artifact
- `annotationId` (string) - UUID of the annotation

**Returns:**
```javascript
Promise<{
  success: boolean,
  linked: boolean,
  data?: {
    id: string,
    artifact_id: string,
    annotation_id: string,
    quote: string,
    context: string,
    created_at: string
  },
  error?: string
}>
```

**Example:**
```javascript
const result = await checkArtifactLink('artifact-123', 'annotation-456');

if (result.success && result.linked) {
  console.log('Already linked');
  console.log('Quote:', result.data.quote);
} else {
  console.log('Not linked');
}
```

**Notes:**
- Fast check before creating link
- Returns link details if exists
- Use before attempting to create duplicate link

---

## UI Components

### `<ArtifactBadge artifact={artifact} onClick={handler} />`

Badge overlay for annotations linked to artifacts.

**Props:**
- `artifact` (object) - Artifact object with name, category, description
- `onClick` (function) - Callback when badge clicked

**Usage:**
```jsx
<ArtifactBadge
  artifact={{
    id: 'uuid',
    name: 'Athenian Amphora',
    category: 'pottery',
    description: 'Black-figure amphora...'
  }}
  onClick={(artifact) => {
    // Navigate to artifact detail
    setSelectedArtifact(artifact);
  }}
/>
```

---

### `<ArtifactLinkModal annotation={ann} onClose={fn} onLink={fn} />`

Modal for linking annotations to artifacts.

**Props:**
- `annotation` (object) - Annotation object with id, text, content
- `onClose` (function) - Callback when modal closed
- `onLink` (function) - Callback when link created

**Usage:**
```jsx
<ArtifactLinkModal
  annotation={selectedAnnotation}
  onClose={() => setShowModal(false)}
  onLink={(linkData) => {
    // Reload linked artifacts
    loadLinks();
  }}
/>
```

**Modes:**
1. Link to existing artifact (searchable list)
2. Create new artifact (opens ArtifactForm)

---

### `<ArtifactSourcesList artifactId={id} />`

List of source references for an artifact.

**Props:**
- `artifactId` (string) - UUID of the artifact

**Usage:**
```jsx
{activeTab === 'sources' && (
  <ArtifactSourcesList artifactId={artifact.id} />
)}
```

**Features:**
- Shows all linked PDF annotations
- "View in PDF" button (navigates to page)
- "Unlink" button (removes reference)
- Empty state with instructions

---

## Integration Examples

### Adding Link When Creating Artifact

```javascript
import { createArtifact } from '../lib/artifacts';
import { linkArtifactToAnnotation } from '../lib/artifact-sources';

// In ArtifactForm or similar
const handleSave = async (formData) => {
  // Create artifact
  const artifact = await createArtifact(formData);

  // If created from annotation, link it
  if (sourceAnnotationId) {
    await linkArtifactToAnnotation(
      artifact.id,
      sourceAnnotationId,
      formData.description, // Use description as quote
      'Created from PDF annotation'
    );
  }

  onSaved(artifact);
};
```

### Showing Linked Artifacts Count

```javascript
import { getArtifactsForAnnotation } from '../lib/artifact-sources';

const [linkedCount, setLinkedCount] = useState(0);

useEffect(() => {
  const loadCount = async () => {
    const result = await getArtifactsForAnnotation(annotation.id);
    if (result.success) {
      setLinkedCount(result.data.length);
    }
  };
  loadCount();
}, [annotation.id]);

return (
  <div>
    Linked to {linkedCount} artifact{linkedCount !== 1 ? 's' : ''}
  </div>
);
```

### Bulk Linking

```javascript
// Link multiple annotations to same artifact
const linkMultiple = async (artifactId, annotationIds) => {
  const results = await Promise.all(
    annotationIds.map(id =>
      linkArtifactToAnnotation(artifactId, id)
    )
  );

  const succeeded = results.filter(r => r.success).length;
  console.log(`Linked ${succeeded}/${annotationIds.length} annotations`);
};
```

---

## Common Patterns

### Check Before Link
```javascript
// Avoid duplicate link errors
const safeLinkArtifact = async (artifactId, annotationId) => {
  const check = await checkArtifactLink(artifactId, annotationId);

  if (check.linked) {
    console.log('Already linked');
    return check.data;
  }

  return await linkArtifactToAnnotation(artifactId, annotationId);
};
```

### List All Sources for Project
```javascript
const getAllProjectSources = async (artifacts) => {
  const allSources = await Promise.all(
    artifacts.map(a => getSourcesForArtifact(a.id))
  );

  return allSources
    .filter(r => r.success)
    .flatMap(r => r.data);
};
```

### Find Artifacts Without Sources
```javascript
const artifactsWithoutSources = [];

for (const artifact of artifacts) {
  const sources = await getSourcesForArtifact(artifact.id);
  if (sources.success && sources.data.length === 0) {
    artifactsWithoutSources.push(artifact);
  }
}

console.log(`${artifactsWithoutSources.length} artifacts need sources`);
```

---

## Error Handling

All functions return a consistent error structure:

```javascript
{
  success: false,
  error: "Error message string"
}
```

**Common Errors:**
- "duplicate key value violates unique constraint" → Link already exists
- "violates foreign key constraint" → Artifact or annotation doesn't exist
- Database connection errors → Check Supabase status

**Best Practice:**
```javascript
const result = await linkArtifactToAnnotation(...);

if (!result.success) {
  if (result.error.includes('duplicate key')) {
    console.log('Already linked');
  } else if (result.error.includes('foreign key')) {
    alert('Artifact or annotation not found');
  } else {
    console.error('Unknown error:', result.error);
  }
}
```

---

## Performance Tips

1. **Batch queries** when loading multiple artifacts:
   ```javascript
   const results = await Promise.all(
     artifactIds.map(id => getSourcesForArtifact(id))
   );
   ```

2. **Cache results** in component state:
   ```javascript
   const [artifactLinks, setArtifactLinks] = useState(new Map());
   ```

3. **Load on demand** - Don't load sources until Sources tab opened

4. **Use indexes** - Queries are indexed on both artifact_id and annotation_id

---

## TypeScript Types (Optional)

```typescript
interface ArtifactSourceLink {
  id: string;
  artifact_id: string;
  annotation_id: string;
  quote: string;
  context: string;
  created_at: string;
}

interface LinkResult {
  success: boolean;
  data?: ArtifactSourceLink;
  error?: string;
}

interface SourcesResult {
  success: boolean;
  data?: Array<{
    id: string;
    annotation_id: string;
    quote: string;
    context: string;
    created_at: string;
    annotations: {
      id: string;
      page_number: number;
      sources: {
        id: string;
        title: string;
      };
    };
  }>;
  error?: string;
}
```
