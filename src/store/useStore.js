import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Current project
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  // Sources (PDFs/documents in tabs)
  sources: [],
  activeSourceId: null,
  setSources: (sources) => set({ sources }),
  addSource: (source) =>
    set((state) => ({
      sources: [...state.sources, source],
      activeSourceId: source.id,
    })),
  removeSource: (id) =>
    set((state) => ({
      sources: state.sources.filter((s) => s.id !== id),
      activeSourceId: state.activeSourceId === id ? null : state.activeSourceId,
    })),
  setActiveSource: (id) => set({ activeSourceId: id }),

  // PDF viewer state
  currentPage: 1,
  pdfScale: 1.2,
  setCurrentPage: (page) => set({ currentPage: page }),
  setScale: (scale) => set({ pdfScale: scale }),

  // Annotation tool
  activeTool: 'select', // 'select', 'highlight', 'ink', 'text'
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Annotations for current source
  annotations: [],
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [...state.annotations, annotation],
    })),

  // Map state (deprecated - kept for backward compatibility)
  mapView: 'map', // 'map' or 'source'
  setMapView: (view) => set({ mapView: view }),

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
  addTab: (tab) =>
    set((state) => {
      const newTab = {
        id: tab.id || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: tab.type,
        title: tab.title,
        data: tab.data || null,
        isDirty: false,
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }),
  removeTab: (tabId) =>
    set((state) => {
      // Don't allow removing the last tab
      if (state.tabs.length <= 1) return state;

      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveTabId = state.activeTabId;

      // If we're removing the active tab, switch to the previous tab
      if (state.activeTabId === tabId) {
        const removedIndex = state.tabs.findIndex((t) => t.id === tabId);
        const newIndex = Math.max(0, removedIndex - 1);
        newActiveTabId = newTabs[newIndex].id;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    }),
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  updateTab: (tabId, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)),
    })),

  // Places (pins)
  places: [],
  setPlaces: (places) => set({ places }),
  addPlace: (place) =>
    set((state) => ({
      places: [...state.places, place],
    })),
  updatePlace: (placeId, updates) =>
    set((state) => ({
      places: state.places.map((p) => (p.id === placeId ? { ...p, ...updates } : p)),
    })),
  removePlace: (placeId) =>
    set((state) => ({
      places: state.places.filter((p) => p.id !== placeId),
    })),

  // Selected annotation (for linking to map)
  selectedAnnotationId: null,
  setSelectedAnnotation: (id) => set({ selectedAnnotationId: id }),

  // Annotation modal
  annotationModalOpen: false,
  pendingAnnotation: null,
  openAnnotationModal: (annotation) =>
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
  startPinPlacement: (annotationId) =>
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

  // Artifacts
  artifacts: [],
  setArtifacts: (artifacts) => set({ artifacts }),
  addArtifact: (artifact) =>
    set((state) => ({
      artifacts: [...state.artifacts, artifact],
    })),
  updateArtifact: (artifactId, updates) =>
    set((state) => ({
      artifacts: state.artifacts.map((a) => (a.id === artifactId ? { ...a, ...updates } : a)),
    })),
  removeArtifact: (artifactId) =>
    set((state) => ({
      artifacts: state.artifacts.filter((a) => a.id !== artifactId),
    })),
  selectedArtifact: null,
  setSelectedArtifact: (artifact) => set({ selectedArtifact: artifact }),

  // Map overlays
  mapOverlays: [],
  setMapOverlays: (overlays) => set({ mapOverlays: overlays }),
  addMapOverlay: (overlay) =>
    set((state) => ({
      mapOverlays: [...state.mapOverlays, overlay],
    })),

  // Overlay georeferencing mode
  overlayMode: false,
  openOverlayMode: () => set({ overlayMode: true }),
  closeOverlayMode: () => set({ overlayMode: false }),
  onOverlayMapClick: null,

  // People (knowledge graph entities)
  people: [],
  setPeople: (people) => set({ people }),
  addPerson: (person) =>
    set((state) => ({
      people: [...state.people, person],
    })),
  updatePerson: (personId, updates) =>
    set((state) => ({
      people: state.people.map((p) => (p.id === personId ? { ...p, ...updates } : p)),
    })),
  removePerson: (personId) =>
    set((state) => ({
      people: state.people.filter((p) => p.id !== personId),
    })),

  // Events (knowledge graph entities)
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),
  updateEvent: (eventId, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
    })),
  removeEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    })),

  // Theories (knowledge graph entities)
  theories: [],
  setTheories: (theories) => set({ theories }),
  addTheory: (theory) =>
    set((state) => ({
      theories: [...state.theories, theory],
    })),
  updateTheory: (theoryId, updates) =>
    set((state) => ({
      theories: state.theories.map((t) => (t.id === theoryId ? { ...t, ...updates } : t)),
    })),
  removeTheory: (theoryId) =>
    set((state) => ({
      theories: state.theories.filter((t) => t.id !== theoryId),
    })),

  // Entity Pages (hybrid storage: metadata in DB, content in Storage)
  entityPages: [], // Array of entity page metadata
  setEntityPages: (pages) => set({ entityPages: pages }),
  addEntityPage: (page) =>
    set((state) => ({
      entityPages: [...state.entityPages, page],
    })),
  updateEntityPageInStore: (entityId, updates) =>
    set((state) => ({
      entityPages: state.entityPages.map((p) =>
        p.entity_id === entityId ? { ...p, ...updates } : p
      ),
    })),
  removeEntityPage: (entityId) =>
    set((state) => ({
      entityPages: state.entityPages.filter((p) => p.entity_id !== entityId),
    })),

  // Entity Links (for network graph)
  entityLinks: [],
  setEntityLinks: (links) => set({ entityLinks: links }),
  addEntityLink: (link) =>
    set((state) => ({
      entityLinks: [...state.entityLinks, link],
    })),
  removeEntityLink: (linkId) =>
    set((state) => ({
      entityLinks: state.entityLinks.filter((l) => l.id !== linkId),
    })),
}));

export default useStore;
