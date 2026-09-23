import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import Topbar from './components/Topbar';
import Workspace from './components/Workspace';
import ProjectPicker from './components/ProjectPicker';
import { loadSources } from './lib/upload';
import { loadAnnotations } from './lib/annotations';
import { loadArtifacts } from './lib/artifacts';
import { invoke } from '@tauri-apps/api/core';
import './styles/index.css';

function App() {
  const currentProject = useStore((state) => state.currentProject);
  const setCurrentProject = useStore((state) => state.setCurrentProject);
  const setAnnotations = useStore((state) => state.setAnnotations);
  const setPlaces = useStore((state) => state.setPlaces);
  const setArtifacts = useStore((state) => state.setArtifacts);
  const setSources = useStore((state) => state.setSources);
  const setPeople = useStore((state) => state.setPeople);
  const setEvents = useStore((state) => state.setEvents);
  const setTheories = useStore((state) => state.setTheories);
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

    const loadProjectData = async () => {
      try {
        const [sources, artifacts, places, people, events, theories] = await Promise.all([
          loadSources(currentProject.id),
          loadArtifacts(currentProject.id),
          invoke('list_places', { projectId: currentProject.id }),
          invoke('list_people', { projectId: currentProject.id }),
          invoke('list_events', { projectId: currentProject.id }),
          invoke('list_theories', { projectId: currentProject.id }),
        ]);

        // Update store with all data
        setSources(sources);
        setArtifacts(artifacts);
        setPlaces(places);
        setPeople(people);
        setEvents(events);
        setTheories(theories);

        // TODO: Load annotations
        setAnnotations([]);
      } catch (err) {
        console.error('Failed to load project data:', err);
      }
    };

    loadProjectData();
  }, [
    currentProject,
    setAnnotations,
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
