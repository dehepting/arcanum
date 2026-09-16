import { render } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Custom render function that wraps components with common providers
 * Usage: render(<MyComponent />, { initialState: {...} })
 */
export function renderWithProviders(ui, { initialState = {}, ...renderOptions } = {}) {
  // If you add providers (like Router, Theme, etc.), wrap them here
  // For now, this is a basic wrapper but easy to extend

  function Wrapper({ children }) {
    // Add providers here as needed, e.g.:
    // return (
    //   <ThemeProvider>
    //     <RouterProvider>
    //       {children}
    //     </RouterProvider>
    //   </ThemeProvider>
    // );
    return children;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  };
}

/**
 * Mock Zustand store for testing
 * Usage: const mockStore = createMockStore({ currentProject: {...} })
 */
export function createMockStore(initialState = {}) {
  const defaultState = {
    currentProject: null,
    sources: [],
    activeSourceId: null,
    currentPage: 1,
    pdfScale: 1.2,
    activeTool: 'select',
    annotations: [],
    mapView: 'map',
    places: [],
    selectedAnnotationId: null,
    annotationModalOpen: false,
    pendingAnnotation: null,
    pinPlacementMode: false,
    pendingPinAnnotationId: null,
    artifacts: [],
    selectedArtifact: null,
    mapOverlays: [],
    overlayMode: false,
    // Add default actions
    setCurrentProject: vi.fn(),
    addSource: vi.fn(),
    removeSource: vi.fn(),
    setActiveSource: vi.fn(),
    setCurrentPage: vi.fn(),
    setScale: vi.fn(),
    setActiveTool: vi.fn(),
    setAnnotations: vi.fn(),
    addAnnotation: vi.fn(),
    setMapView: vi.fn(),
    setPlaces: vi.fn(),
    addPlace: vi.fn(),
    setSelectedAnnotation: vi.fn(),
    openAnnotationModal: vi.fn(),
    closeAnnotationModal: vi.fn(),
    startPinPlacement: vi.fn(),
    cancelPinPlacement: vi.fn(),
    setArtifacts: vi.fn(),
    addArtifact: vi.fn(),
    updateArtifactInStore: vi.fn(),
    removeArtifact: vi.fn(),
    setSelectedArtifact: vi.fn(),
    setMapOverlays: vi.fn(),
    addMapOverlay: vi.fn(),
    openOverlayMode: vi.fn(),
    closeOverlayMode: vi.fn(),
    ...initialState,
  };

  return defaultState;
}

/**
 * Wait for async updates
 */
export const waitFor = (callback, options) => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      try {
        callback();
        clearInterval(interval);
        resolve();
      } catch (error) {
        // Keep waiting
      }
    }, options?.interval || 50);

    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, options?.timeout || 1000);
  });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
