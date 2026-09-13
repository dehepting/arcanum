import useStore from '../store/useStore';

export default function Topbar() {
  const currentProject = useStore((state) => state.currentProject);

  return (
    <div className="topbar">
      <div className="brand">
        ARCANUM
        <span className="motto">collige et serva</span>
      </div>
      <div className="topbar-spacer" />
      {currentProject && (
        <div className="project-name">{currentProject.name}</div>
      )}
    </div>
  );
}
