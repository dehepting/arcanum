/**
 * Store Type Definitions
 *
 * Types for Zustand store state and actions.
 */

import type { Person, Event, Theory, Place, Artifact, EntityLink, EntityPage } from './entities';
import type { Annotation } from './annotations';
import type { Tab, CreateTabInput } from './tabs';

/**
 * Project (from backend)
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * PDF Source
 */
export interface Source {
  id: string;
  project_id: string;
  title: string;
  file_name: string;
  storage_path: string;
  file_url: string;
  file_size?: number | null;
  mime_type?: string | null;
  metadata?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Map overlay (georeferenced image on map)
 */
export interface MapOverlay {
  id: string;
  project_id: string;
  name: string;
  image_path: string;
  bounds: [[number, number], [number, number]]; // [[sw_lat, sw_lng], [ne_lat, ne_lng]]
  opacity: number;
  created_at: string;
  updated_at: string;
}

/**
 * Location placement mode state
 */
export interface PendingLocationEntity {
  entityId: string;
  entityType: string;
  entityName: string;
}

/**
 * Zustand Store State
 */
export interface StoreState {
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

  // Map coordinates to fly to (set by EntityPage for places)
  flyToCoordinates?: {
    lat: number;
    lng: number;
    zoom: number;
  };

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

  // Pin placement mode (for linking annotations to map)
  pinPlacementMode: boolean;
  pendingPinAnnotationId: string | null;
  startPinPlacement: (annotationId: string) => void;
  cancelPinPlacement: () => void;

  // Location placement mode (for setting entity coordinates)
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

  // Overlay georeferencing mode
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

  // Entity Links (knowledge graph edges)
  entityLinks: EntityLink[];
  setEntityLinks: (links: EntityLink[]) => void;
  addEntityLink: (link: EntityLink) => void;
  removeEntityLink: (linkId: string) => void;

  // Reset project state (called when switching projects)
  resetProjectState: () => void;
}
