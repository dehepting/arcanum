import useStore from '../store/useStore';

export default function Topbar() {
  const currentProject = useStore((state) => state.currentProject);
  const setCurrentProject = useStore((state) => state.setCurrentProject);
  const artifacts = useStore((state) => state.artifacts);
  const setSelectedArtifact = useStore((state) => state.setSelectedArtifact);

  const handleArtifactsClick = () => {
    // Clear selected artifact to show full artifacts list
    setSelectedArtifact(null);
  };

  const handleHomeClick = () => {
    setCurrentProject(null);
    localStorage.removeItem('arcanum_last_project_id');
  };

  return (
    <div className="topbar">
      <div className="brand">
        ARCANUM
        <span className="motto">collige et serva</span>
      </div>
      <div className="topbar-spacer" />
      {currentProject && (
        <>
          <button
            onClick={handleHomeClick}
            className="topbar-link"
            title="Return to project selection"
          >
            <span className="topbar-icon">🏠</span>
            Projects
          </button>
          <button
            onClick={handleArtifactsClick}
            className="topbar-link"
            title="View artifacts database"
          >
            <span className="topbar-icon">🏺</span>
            Artifacts
            {artifacts.length > 0 && <span className="topbar-badge">{artifacts.length}</span>}
          </button>
          <div className="project-name">{currentProject.name}</div>
        </>
      )}
    </div>
  );
}
