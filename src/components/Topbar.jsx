import useStore from '../store/useStore';

export default function Topbar() {
  const currentProject = useStore((state) => state.currentProject);
  const setCurrentProject = useStore((state) => state.setCurrentProject);
  const openAdvancedSearch = useStore((state) => state.openAdvancedSearch);

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
          <button onClick={openAdvancedSearch} className="topbar-link" title="Search (Cmd+K)">
            <span className="topbar-icon">🔍</span>
            Search
          </button>
          <button
            onClick={handleHomeClick}
            className="topbar-link"
            title="Return to project selection"
          >
            <span className="topbar-icon">🏠</span>
            Projects
          </button>
          <div className="project-name">{currentProject.name}</div>
        </>
      )}
    </div>
  );
}
