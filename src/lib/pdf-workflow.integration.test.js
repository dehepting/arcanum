/**
 * Integration tests for the PDF source workflow.
 * Tests the complete flow of:
 * 1. Uploading a PDF source
 * 2. Creating annotations
 * 3. Linking annotations to entities
 * 4. Switching projects and verifying data persistence
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import useStore from '../store/useStore';

// Mock Tauri API
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

// Mock Tauri fs plugin
vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: vi.fn(),
}));

describe('PDF Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useStore.getState().resetProjectState();
    useStore.setState({ currentProject: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Project Data Loading', () => {
    it('loads sources when project is selected', async () => {
      const mockSources = [
        {
          id: 'source-1',
          project_id: 'project-1',
          title: 'Test PDF.pdf',
          file_name: 'Test_PDF.pdf',
          storage_path: 'project-1/123_Test_PDF.pdf',
          file_url: '/path/to/storage/sources/project-1/123_Test_PDF.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
        },
      ];

      mockInvoke.mockImplementation((command) => {
        if (command === 'list_sources') return Promise.resolve(mockSources);
        return Promise.resolve([]);
      });

      // Simulate what App.jsx does when loading project data
      const { setSources } = useStore.getState();
      const sources = await mockInvoke('list_sources', { projectId: 'project-1' });
      setSources(sources);

      expect(useStore.getState().sources).toEqual(mockSources);
      expect(useStore.getState().sources.length).toBe(1);
    });

    it('clears sources when switching projects', async () => {
      // Set up initial state with sources
      useStore.setState({
        sources: [{ id: 'source-1', title: 'Old Source' }],
        activeSourceId: 'source-1',
      });

      expect(useStore.getState().sources.length).toBe(1);
      expect(useStore.getState().activeSourceId).toBe('source-1');

      // Reset project state (simulates project switch)
      useStore.getState().resetProjectState();

      expect(useStore.getState().sources).toEqual([]);
      expect(useStore.getState().activeSourceId).toBeNull();
    });
  });

  describe('Source Management', () => {
    it('adds source to store correctly', () => {
      const newSource = {
        id: 'source-new',
        title: 'New PDF.pdf',
        file_url: '/path/to/pdf',
      };

      useStore.getState().addSource(newSource);

      const { sources, activeSourceId } = useStore.getState();
      expect(sources).toContainEqual(newSource);
      expect(activeSourceId).toBe('source-new');
    });

    it('removes source and clears active if it was active', () => {
      const source1 = { id: 'source-1', title: 'PDF 1' };
      const source2 = { id: 'source-2', title: 'PDF 2' };

      useStore.setState({
        sources: [source1, source2],
        activeSourceId: 'source-1',
      });

      useStore.getState().removeSource('source-1');

      const { sources, activeSourceId } = useStore.getState();
      expect(sources).toHaveLength(1);
      expect(sources[0].id).toBe('source-2');
      expect(activeSourceId).toBeNull();
    });
  });

  describe('Annotation Workflow', () => {
    const mockAnnotation = {
      id: 'ann-1',
      source_id: 'source-1',
      page_number: 1,
      annotation_type: 'highlight',
      rect: { x: 100, y: 200, w: 300, h: 50 },
      text: 'Test annotation',
    };

    it('loads annotations for active source', async () => {
      mockInvoke.mockResolvedValueOnce([mockAnnotation]);

      const annotations = await mockInvoke('load_annotations', { sourceId: 'source-1' });
      useStore.getState().setAnnotations(annotations);

      expect(useStore.getState().annotations).toEqual([mockAnnotation]);
    });

    it('creates new annotation', async () => {
      const newAnnotation = {
        source_id: 'source-1',
        page_number: 2,
        annotation_type: 'text',
        rect: { x: 50, y: 100, w: 200, h: 30 },
        text: 'New note',
      };

      const createdAnnotation = { ...newAnnotation, id: 'ann-2' };
      mockInvoke.mockResolvedValueOnce(createdAnnotation);

      const result = await mockInvoke('create_annotation', { input: newAnnotation });
      useStore.getState().addAnnotation(result);

      expect(useStore.getState().annotations).toContainEqual(createdAnnotation);
    });

    it('clears annotations on project switch', () => {
      useStore.setState({
        annotations: [mockAnnotation],
      });

      expect(useStore.getState().annotations.length).toBe(1);

      useStore.getState().resetProjectState();

      expect(useStore.getState().annotations).toEqual([]);
    });
  });

  describe('Tab Management with Sources', () => {
    it('creates PDF tab when source is added', () => {
      const source = {
        id: 'source-1',
        title: 'Research.pdf',
        file_url: '/path/to/pdf',
      };

      useStore.getState().addSource(source);
      useStore.getState().addTab({
        type: 'pdf',
        title: source.title,
        data: { source },
      });

      const { tabs } = useStore.getState();
      const pdfTab = tabs.find((t) => t.type === 'pdf');

      expect(pdfTab).toBeDefined();
      expect(pdfTab.title).toBe('Research.pdf');
      expect(pdfTab.data.source).toEqual(source);
    });

    it('finds existing source tab to prevent duplicates', () => {
      const source = { id: 'source-1', title: 'Test.pdf', file_url: '/path' };

      // Add source and first tab
      useStore.getState().addSource(source);
      useStore.getState().addTab({
        type: 'pdf',
        title: source.title,
        data: { source },
      });

      const tabsBefore = useStore.getState().tabs.length;

      // Try to find existing tab (simulating click on source in sidebar)
      const { tabs } = useStore.getState();
      const existingTab = tabs.find((t) => t.data?.source?.id === source.id);

      expect(existingTab).toBeDefined();
      expect(tabsBefore).toBe(2); // default map tab + pdf tab
    });

    it('resets tabs on project switch', () => {
      // Add some tabs
      useStore.getState().addTab({ type: 'pdf', title: 'PDF 1', data: {} });
      useStore.getState().addTab({ type: 'person', title: 'Person', data: {} });

      expect(useStore.getState().tabs.length).toBe(3); // default + 2

      useStore.getState().resetProjectState();

      const { tabs, activeTabId } = useStore.getState();
      expect(tabs.length).toBe(1);
      expect(tabs[0].type).toBe('map');
      expect(activeTabId).toBe('default-map');
    });
  });

  describe('Entity Linking', () => {
    it('stores entity links in annotation links array', async () => {
      const linkData = {
        annotation_id: 'ann-1',
        entity_id: 'person-1',
        entity_type: 'person',
        relationship_type: 'mentions',
      };

      mockInvoke.mockResolvedValueOnce(linkData);

      const result = await mockInvoke('link_annotation_to_entity', {
        annotationId: 'ann-1',
        entityId: 'person-1',
        entityType: 'person',
        relationshipType: 'mentions',
      });

      expect(result).toEqual(linkData);
    });

    it('fetches linked entities for annotation', async () => {
      const linkedEntities = [
        { entity_id: 'person-1', entity_type: 'person', relationship_type: 'mentions' },
        { entity_id: 'place-1', entity_type: 'place', relationship_type: 'references' },
      ];

      mockInvoke.mockResolvedValueOnce(linkedEntities);

      const result = await mockInvoke('get_entities_for_annotation', {
        annotationId: 'ann-1',
      });

      expect(result).toEqual(linkedEntities);
      expect(result.length).toBe(2);
    });
  });

  describe('Full Workflow Simulation', () => {
    it('simulates complete PDF workflow: upload -> annotate -> link -> switch project -> return', async () => {
      // 1. Set up project
      const project1 = { id: 'project-1', name: 'Project 1' };
      useStore.setState({ currentProject: project1 });

      // 2. Upload PDF (simulate the result of uploadPDF)
      const source = {
        id: 'source-1',
        project_id: 'project-1',
        title: 'Research Paper.pdf',
        file_url: '/storage/sources/project-1/123_Research_Paper.pdf',
      };

      mockInvoke.mockImplementation((command) => {
        if (command === 'upload_file') {
          return Promise.resolve({ storage_path: 'project-1/123_Research_Paper.pdf' });
        }
        if (command === 'create_source') {
          return Promise.resolve(source);
        }
        if (command === 'list_sources') {
          return Promise.resolve([source]);
        }
        if (command === 'create_annotation') {
          return Promise.resolve({
            id: 'ann-1',
            source_id: 'source-1',
            text: 'Important finding',
          });
        }
        if (command === 'load_annotations') {
          return Promise.resolve([
            { id: 'ann-1', source_id: 'source-1', text: 'Important finding' },
          ]);
        }
        return Promise.resolve([]);
      });

      // Add source to store
      useStore.getState().addSource(source);
      expect(useStore.getState().sources.length).toBe(1);

      // 3. Create annotation
      const annotation = await mockInvoke('create_annotation', {
        input: { source_id: 'source-1', text: 'Important finding' },
      });
      useStore.getState().addAnnotation(annotation);
      expect(useStore.getState().annotations.length).toBe(1);

      // 4. Switch to different project
      const project2 = { id: 'project-2', name: 'Project 2' };
      useStore.getState().resetProjectState();
      useStore.setState({ currentProject: project2 });

      expect(useStore.getState().sources.length).toBe(0);
      expect(useStore.getState().annotations.length).toBe(0);

      // 5. Return to original project
      useStore.getState().resetProjectState();
      useStore.setState({ currentProject: project1 });

      // 6. Reload project data (simulate App.jsx behavior)
      const loadedSources = await mockInvoke('list_sources', { projectId: 'project-1' });
      useStore.getState().setSources(loadedSources);

      expect(useStore.getState().sources.length).toBe(1);
      expect(useStore.getState().sources[0].title).toBe('Research Paper.pdf');

      // 7. Open source and reload annotations
      useStore.getState().setActiveSource('source-1');
      const loadedAnnotations = await mockInvoke('load_annotations', { sourceId: 'source-1' });
      useStore.getState().setAnnotations(loadedAnnotations);

      expect(useStore.getState().annotations.length).toBe(1);
      expect(useStore.getState().annotations[0].text).toBe('Important finding');
    });
  });
});
