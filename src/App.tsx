import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import Topbar from './components/Topbar';
import Workspace from './components/Workspace';
import ProjectPicker from './components/ProjectPicker';
import { loadSources } from './lib/upload';
import { loadArtifacts } from './lib/artifacts';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './utils/logger';
import './styles/index.css';
import type { Place, Person, Event, Theory } from './types/entities';

function App() {
  const currentProject = useStore((state) => state.currentProject);
  const setPlaces = useStore((state) => state.setPlaces);
  const setArtifacts = useStore((state) => state.setArtifacts);
  const setSources = useStore((state) => state.setSources);
  const setPeople = useStore((state) => state.setPeople);
  const setEvents = useStore((state) => state.setEvents);
  const setTheories = useStore((state) => state.setTheories);
  const resetProjectState = useStore((state) => state.resetProjectState);

  // Load last project from localStorage on mount (when implemented)
  useEffect(() => {
    const lastProjectId = localStorage.getItem('arcanum_last_project_id');
    if (lastProjectId) {
      // TODO: Load project from Supabase by ID
      // When implemented, set loading state appropriately
    }
  }, []);

  // Load project data when project changes
  useEffect(() => {
    if (!currentProject) return;

    // Save to localStorage for persistence
    localStorage.setItem('arcanum_last_project_id', currentProject.id);

    // Reset all project-specific state before loading new data
    resetProjectState();

    const loadProjectData = async () => {
      try {
        logger.debug('Loading project data for:', currentProject.id, currentProject.name);

        // Load each resource type with individual error handling
        let sources: any[] = [];
        let artifacts: any[] = [];
        let places: Place[] = [];
        let people: Person[] = [];
        let events: Event[] = [];
        let theories: Theory[] = [];

        try {
          sources = await loadSources(currentProject.id);
          logger.debug('Loaded sources:', sources.length);
        } catch (e) {
          logger.error('Failed to load sources:', e);
        }

        try {
          artifacts = await loadArtifacts(currentProject.id);
        } catch (e) {
          logger.error('Failed to load artifacts:', e);
        }

        try {
          [places, people, events, theories] = await Promise.all([
            invoke<Place[]>('list_places', { projectId: currentProject.id }),
            invoke<Person[]>('list_people', { projectId: currentProject.id }),
            invoke<Event[]>('list_events', { projectId: currentProject.id }),
            invoke<Theory[]>('list_theories', { projectId: currentProject.id }),
          ]);
        } catch (e) {
          logger.error('Failed to load entities:', e);
        }

        // Update store with all data
        setSources(sources);
        setArtifacts(artifacts);
        setPlaces(places);
        setPeople(people);
        setEvents(events);
        setTheories(theories);

        // Note: Annotations are loaded per-source when a PDF is opened (see PDFView.jsx)
      } catch (err) {
        logger.error('Failed to load project data:', err);
      }
    };

    loadProjectData();
  }, [
    currentProject,
    resetProjectState,
    setPlaces,
    setArtifacts,
    setSources,
    setPeople,
    setEvents,
    setTheories,
  ]);

  if (!currentProject) {
    return <ProjectPicker />;
  }

  return (
    <div className="app">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
          },
          success: {
            iconTheme: {
              primary: 'var(--accent-9)',
              secondary: 'var(--surface)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'var(--surface)',
            },
          },
        }}
      />
      <Topbar />
      <Workspace />
    </div>
  );
}

export default App;
