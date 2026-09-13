import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import Topbar from './components/Topbar';
import Tabs from './components/Tabs';
import Workspace from './components/Workspace';
import ProjectPicker from './components/ProjectPicker';
import './styles/index.css';

function App() {
  const currentProject = useStore((state) => state.currentProject);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Check localStorage for last project or show project picker
    setLoading(false);
  }, []);

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
