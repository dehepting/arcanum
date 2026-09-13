import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import Topbar from './components/Topbar';
import Tabs from './components/Tabs';
import Workspace from './components/Workspace';
import ProjectPicker from './components/ProjectPicker';
import { loadSources } from './lib/upload';
import { loadAnnotations } from './lib/annotations';
import './styles/index.css';

function App() {
  const currentProject = useStore((state) => state.currentProject);
  const setCurrentProject = useStore((state) => state.setCurrentProject);
  const setAnnotations = useStore((state) => state.setAnnotations);
  const setPlaces = useStore((state) => state.setPlaces);
  const setArtifacts = useStore((state) => state.setArtifacts);
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

    const loadProjectData = async () => {
      try {
        const sources = await loadSources(currentProject.id);
        // Update store with sources
        sources.forEach((source) => {
          useStore.getState().addSource(source);
        });

        // TODO: Load annotations, places, artifacts
        setAnnotations([]);
        setPlaces([]);
        setArtifacts([]);
      } catch (err) {
        console.error('Failed to load project data:', err);
      }
    };

    loadProjectData();
  }, [currentProject, setAnnotations, setPlaces, setArtifacts]);

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
      <Tabs />
      <Workspace />
    </div>
  );
}

export default App;
