import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import Topbar from './components/Topbar';
import Workspace from './components/Workspace';
import ProjectPicker from './components/ProjectPicker';
import { loadSources } from './lib/upload';
import { loadArtifacts } from './lib/artifacts';
import { invoke } from '@tauri-apps/api/core';
import './styles/index.css';

function App() {
  const currentProject = useStore((state) => state.currentProject);
  const setPlaces = useStore((state) => state.setPlaces);
  const setArtifacts = useStore((state) => state.setArtifacts);
  const setSources = useStore((state) => state.setSources);
  const setPeople = useStore((state) => state.setPeople);
  const setEvents = useStore((state) => state.setEvents);
  const setTheories = useStore((state) => state.setTheories);
  const resetProjectState = useStore((state) => state.resetProjectState);
  const [loading, setLoading] = useState(true);

  // Load last project from localStorage on mount
  useEffect(() => {
    const lastProjectId = localStorage.getItem('arcanum_last_project_id');
    if (lastProjectId) {
      // TODO: Load project from Supabase by ID
    }
    setLoading(false);
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
        console.log('Loading project data for:', currentProject.id, currentProject.name);

        // Load each resource type with individual error handling
        let sources = [];
        let artifacts = [];
        let places = [];
        let people = [];
        let events = [];
        let theories = [];

        try {
          sources = await loadSources(currentProject.id);
          console.log('Loaded sources:', sources.length, sources);
        } catch (e) {
          console.error('Failed to load sources:', e);
          console.error('Error details:', JSON.stringify(e, null, 2));
          console.error('Error message:', e?.message || e?.toString?.() || String(e));
        }

        try {
          artifacts = await loadArtifacts(currentProject.id);
        } catch (e) {
          console.error('Failed to load artifacts:', e);
        }

        try {
          [places, people, events, theories] = await Promise.all([
            invoke('list_places', { projectId: currentProject.id }),
            invoke('list_people', { projectId: currentProject.id }),
            invoke('list_events', { projectId: currentProject.id }),
            invoke('list_theories', { projectId: currentProject.id }),
          ]);
        } catch (e) {
          console.error('Failed to load entities:', e);
        }

        // Update store with all data
        console.log('Setting sources in store:', sources.length);
        setSources(sources);
        setArtifacts(artifacts);
        setPlaces(places);
        setPeople(people);
        setEvents(events);
        setTheories(theories);

        // Note: Annotations are loaded per-source when a PDF is opened (see PDFView.jsx)
      } catch (err) {
        console.error('Failed to load project data:', err);
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

  if (loading) {
    return (
      <div className="app">
        <div className="empty-state">
          <div className="empty-state-title">Loading Arcanum...</div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return <ProjectPicker />;
  }

  return (
    <div className="app">
      <Topbar />
      <Workspace />
    </div>
  );
}

export default App;
