import useStore from '../store/useStore';

export default function Topbar() {
  const currentProject = useStore((state) => state.currentProject);
  const artifacts = useStore((state) => state.artifacts);
  const setMapView = useStore((state) => state.setMapView);

  const handleArtifactsClick = () => {
    setMapView('artifacts');
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
