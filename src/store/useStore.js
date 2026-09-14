import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Current project
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  // Sources (PDFs/documents in tabs)
  sources: [],
  activeSourceId: null,
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

  // Map state
  mapView: 'map', // 'map' or 'source'
  setMapView: (view) => set({ mapView: view }),

  // Places (pins)
  places: [],
  setPlaces: (places) => set({ places }),
  addPlace: (place) =>
    set((state) => ({
      places: [...state.places, place],
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
  updateArtifactInStore: (artifactId, updates) =>
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
}));

export default useStore;
