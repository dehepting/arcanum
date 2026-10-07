import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import { createEntitySlice } from './entitySlice';
import type {
  Project,
  Source,
  Annotation,
  Tab,
  CreateTabInput,
  Person,
  Event,
  Theory,
  Place,
  Artifact,
  EntityPage,
  EntityLink,
  MapOverlay,
  PendingLocationEntity,
} from '@/types';

// IndexedDB storage adapter
const storage = {
  getItem: async (name: string) => get(name),
  setItem: async (name: string, value: unknown) => idbSet(name, value),
  removeItem: async (name: string) => del(name),
};

/**
 * Zustand Store State and Actions
 *
 * Central state management for Arcanum.
 * Now fully typed for better DX and type safety!
 */
interface StoreState {
  // Project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Sources (PDFs)
  sources: Source[];
  activeSourceId: string | null;
  setSources: (sources: Source[]) => void;
  addSource: (source: Source) => void;
  removeSource: (id: string) => void;
  setActiveSource: (id: string | null) => void;

  // PDF viewer state
  currentPage: number;
  pdfScale: number;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;

  // Annotation tool
  activeTool: 'select' | 'highlight' | 'ink' | 'text';
  setActiveTool: (tool: 'select' | 'highlight' | 'ink' | 'text') => void;

  // Annotations
  annotations: Annotation[];
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;

  // Map view (deprecated but kept for compatibility)
  mapView: 'map' | 'source';
  setMapView: (view: 'map' | 'source') => void;

  // Tabs
  tabs: Tab[];
  activeTabId: string;
  addTab: (tab: CreateTabInput) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;

  // Places
  places: Place[];
  setPlaces: (places: Place[]) => void;
  addPlace: (place: Place) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  removePlace: (id: string) => void;

  // Selected annotation
  selectedAnnotationId: string | null;
  setSelectedAnnotation: (id: string | null) => void;

  // Annotation modal
  annotationModalOpen: boolean;
  pendingAnnotation: Annotation | null;
  openAnnotationModal: (annotation: Annotation) => void;
  closeAnnotationModal: () => void;

  // Advanced search modal
  advancedSearchModalOpen: boolean;
  openAdvancedSearch: () => void;
  closeAdvancedSearch: () => void;

  // Pin placement mode
  pinPlacementMode: boolean;
  pendingPinAnnotationId: string | null;
  startPinPlacement: (annotationId: string) => void;
  cancelPinPlacement: () => void;

  // Location placement mode
  locationPlacementMode: boolean;
  pendingLocationEntity: PendingLocationEntity | null;
  startLocationPlacement: (entityId: string, entityType: string, entityName: string) => void;
  cancelLocationPlacement: () => void;

  // Artifacts
  artifacts: Artifact[];
  selectedArtifact: Artifact | null;
  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  updateArtifact: (id: string, updates: Partial<Artifact>) => void;
  removeArtifact: (id: string) => void;
  setSelectedArtifact: (artifact: Artifact | null) => void;

  // Map overlays
  mapOverlays: MapOverlay[];
  setMapOverlays: (overlays: MapOverlay[]) => void;
  addMapOverlay: (overlay: MapOverlay) => void;

  // Overlay mode
  overlayMode: boolean;
  openOverlayMode: () => void;
  closeOverlayMode: () => void;
  onOverlayMapClick: ((e: unknown) => void) | null;

  // People
  people: Person[];
  setPeople: (people: Person[]) => void;
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;

  // Events
  events: Event[];
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  removeEvent: (id: string) => void;

  // Theories
  theories: Theory[];
  setTheories: (theories: Theory[]) => void;
  addTheory: (theory: Theory) => void;
  updateTheory: (id: string, updates: Partial<Theory>) => void;
  removeTheory: (id: string) => void;

  // Entity Pages
  entityPages: EntityPage[];
  setEntityPages: (pages: EntityPage[]) => void;
  addEntityPage: (page: EntityPage) => void;
  updateEntityPageInStore: (entityId: string, updates: Partial<EntityPage>) => void;
  removeEntityPage: (entityId: string) => void;

  // Entity Links
  entityLinks: EntityLink[];
  setEntityLinks: (links: EntityLink[]) => void;
  addEntityLink: (link: EntityLink) => void;
  removeEntityLink: (linkId: string) => void;

  // Reset
  resetProjectState: () => void;
}

// Store configuration - conditionally enable persistence based on environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storeConfig = (set: any) => ({
  // Current project
  currentProject: null,
  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  // Sources (PDFs/documents in tabs)
  sources: [],
  activeSourceId: null,
  setSources: (sources: Source[]) => set({ sources }),
  addSource: (source: Source) =>
    set((state: StoreState) => ({
      sources: [...state.sources, source],
      activeSourceId: source.id,
    })),
  removeSource: (id: string) =>
    set((state: StoreState) => ({
      sources: state.sources.filter((s: Source) => s.id !== id),
      activeSourceId: state.activeSourceId === id ? null : state.activeSourceId,
    })),
  setActiveSource: (id: string | null) => set({ activeSourceId: id }),

  // PDF viewer state
  currentPage: 1,
  pdfScale: 1.2,
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setScale: (scale: number) => set({ pdfScale: scale }),

  // Annotation tool
  activeTool: 'select',
  setActiveTool: (tool: string) => set({ activeTool: tool }),

  // Annotations for current source
  annotations: [],
  setAnnotations: (annotations: Annotation[]) => set({ annotations }),
  addAnnotation: (annotation: Annotation) =>
    set((state: StoreState) => ({
      annotations: [...state.annotations, annotation],
    })),

  // Map state (deprecated - kept for backward compatibility)
  mapView: 'map',
  setMapView: (view: string) => set({ mapView: view }),

  // Dynamic Tabs
  tabs: [
    {
      id: 'default-map',
      type: 'map',
      title: 'Map',
      data: null,
      isDirty: false,
    },
  ],
  activeTabId: 'default-map',
  addTab: (tab: Partial<Tab>) =>
    set((state: StoreState) => {
      const newTab = {
        id: tab.id || `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: tab.type || 'map',
        title: tab.title || 'Untitled',
        data: tab.data || null,
        isDirty: tab.isDirty || false,
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }),
  removeTab: (tabId: string) =>
    set((state: StoreState) => {
      // Don't allow removing the last tab
      if (state.tabs.length <= 1) return {};

      const newTabs = state.tabs.filter((t: Tab) => t.id !== tabId);
      let newActiveTabId = state.activeTabId;

      // If we're removing the active tab, switch to the previous tab
      if (state.activeTabId === tabId) {
        const removedIndex = state.tabs.findIndex((t: Tab) => t.id === tabId);
        const newIndex = Math.max(0, removedIndex - 1);
        newActiveTabId = newTabs[newIndex].id;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    }),
  setActiveTab: (tabId: string) =>
    set((state: StoreState) => {
      const tab = state.tabs.find((t: Tab) => t.id === tabId);
      // If switching to a PDF tab, also update activeSourceId
      const updates: Partial<StoreState> = { activeTabId: tabId };
      if (tab?.type === 'pdf' && tab.data?.source?.id) {
        updates.activeSourceId = tab.data.source.id;
      }
      return updates;
    }),
  updateTab: (tabId: string, updates: Partial<Tab>) =>
    set((state: StoreState) => ({
      tabs: state.tabs.map((t: Tab) => (t.id === tabId ? { ...t, ...updates } : t)),
    })),

  // Places (pins) - generated by entitySlice factory
  ...createEntitySlice<Place>('place')(set),

  // Selected annotation (for linking to map)
  selectedAnnotationId: null,
  setSelectedAnnotation: (id: string | null) => set({ selectedAnnotationId: id }),

  // Annotation modal
  annotationModalOpen: false,
  pendingAnnotation: null,
  openAnnotationModal: (annotation: Annotation) =>
    set({
      annotationModalOpen: true,
      pendingAnnotation: annotation,
    }),
  closeAnnotationModal: () =>
    set({
      annotationModalOpen: false,
      pendingAnnotation: null,
    }),

  // Advanced search modal
  advancedSearchModalOpen: false,
  openAdvancedSearch: () => set({ advancedSearchModalOpen: true }),
  closeAdvancedSearch: () => set({ advancedSearchModalOpen: false }),

  // Pin placement mode (for linking annotations to map)
  pinPlacementMode: false,
  pendingPinAnnotationId: null,
  startPinPlacement: (annotationId: string) =>
    set({
      pinPlacementMode: true,
      pendingPinAnnotationId: annotationId,
      mapView: 'map', // Switch to map view
    }),
  cancelPinPlacement: () =>
    set({
      pinPlacementMode: false,
      pendingPinAnnotationId: null,
    }),

  // Location placement mode (for setting entity coordinates)
  locationPlacementMode: false,
  pendingLocationEntity: null,
  startLocationPlacement: (entityId: string, entityType: string, entityName: string) =>
    set({
      locationPlacementMode: true,
      pendingLocationEntity: { entityId, entityType, entityName },
    }),
  cancelLocationPlacement: () =>
    set({
      locationPlacementMode: false,
      pendingLocationEntity: null,
    }),

  // Artifacts - generated by entitySlice factory
  ...createEntitySlice<Artifact>('artifact')(set),
  selectedArtifact: null,
  setSelectedArtifact: (artifact: Artifact | null) => set({ selectedArtifact: artifact }),

  // Map overlays
  mapOverlays: [],
  setMapOverlays: (overlays: MapOverlay[]) => set({ mapOverlays: overlays }),
  addMapOverlay: (overlay: MapOverlay) =>
    set((state: StoreState) => ({
      mapOverlays: [...state.mapOverlays, overlay],
    })),

  // Overlay georeferencing mode
  overlayMode: false,
  openOverlayMode: () => set({ overlayMode: true }),
  closeOverlayMode: () => set({ overlayMode: false }),
  onOverlayMapClick: null,

  // People (knowledge graph entities) - generated by entitySlice factory
  ...createEntitySlice<Person>('person', 'people')(set),

  // Events (knowledge graph entities) - generated by entitySlice factory
  ...createEntitySlice<Event>('event')(set),

  // Theories (knowledge graph entities) - generated by entitySlice factory
  ...createEntitySlice<Theory>('theory', 'theories')(set),

  // Entity Pages (hybrid storage: metadata in DB, content in Storage)
  entityPages: [],
  setEntityPages: (pages: EntityPage[]) => set({ entityPages: pages }),
  addEntityPage: (page: EntityPage) =>
    set((state: StoreState) => ({
      entityPages: [...state.entityPages, page],
    })),
  updateEntityPageInStore: (entityId: string, updates: Partial<EntityPage>) =>
    set((state: StoreState) => ({
      entityPages: state.entityPages.map((p: EntityPage) =>
        p.entity_id === entityId ? { ...p, ...updates } : p
      ),
    })),
  removeEntityPage: (entityId: string) =>
    set((state: StoreState) => ({
      entityPages: state.entityPages.filter((p: EntityPage) => p.entity_id !== entityId),
    })),

  // Entity Links (for network graph)
  entityLinks: [],
  setEntityLinks: (links: EntityLink[]) => set({ entityLinks: links }),
  addEntityLink: (link: EntityLink) =>
    set((state: StoreState) => ({
      entityLinks: [...state.entityLinks, link],
    })),
  removeEntityLink: (linkId: string) =>
    set((state: StoreState) => ({
      entityLinks: state.entityLinks.filter((l: EntityLink) => l.id !== linkId),
    })),

  // Reset project-specific state (called when switching projects)
  resetProjectState: () =>
    set({
      sources: [],
      activeSourceId: null,
      annotations: [],
      tabs: [
        {
          id: 'default-map',
          type: 'map',
          title: 'Map',
          data: null,
          isDirty: false,
        },
      ],
      activeTabId: 'default-map',
      places: [],
      artifacts: [],
      selectedArtifact: null,
      mapOverlays: [],
      people: [],
      events: [],
      theories: [],
      entityPages: [],
      entityLinks: [],
      currentPage: 1,
      selectedAnnotationId: null,
      pinPlacementMode: false,
      pendingPinAnnotationId: null,
      locationPlacementMode: false,
      pendingLocationEntity: null,
    }),
});

// Persistence configuration
const persistConfig = {
  name: 'arcanum-storage',
  storage: createJSONStorage(() => storage),
  partialize: (state: StoreState) => ({
    // Persist essential user data
    currentProject: state.currentProject,
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    places: state.places,
    people: state.people,
    events: state.events,
    theories: state.theories,
    artifacts: state.artifacts,
    entityPages: state.entityPages,
    entityLinks: state.entityLinks,
    mapOverlays: state.mapOverlays,

    // Persist UI preferences
    currentPage: state.currentPage,
    pdfScale: state.pdfScale,

    // DON'T persist heavy/temporary data:
    // - sources (large PDF data)
    // - annotations (loaded from DB per source)
    // - canvases (large binary data)
    // - modal states
    // - selection/placement modes
  }),
  version: 1, // For future data migrations
  migrate: (persistedState: unknown, version: number) => {
    // Handle future schema changes
    if (version === 0) {
      // Migration example for v0 to v1
      // (persistedState as any).newField = 'default';
    }
    return persistedState as StoreState;
  },
};

// Create store with conditional persistence
// In test environment, skip persistence to avoid async hydration issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTestEnv = (import.meta as any).env?.MODE === 'test';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useStore = isTestEnv
  ? create<StoreState>(storeConfig as any)
  : create<StoreState>()(persist(storeConfig as any, persistConfig));

export default useStore;
