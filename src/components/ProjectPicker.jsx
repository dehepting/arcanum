import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import * as tauri from '../lib/tauri';

export default function ProjectPicker() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const setCurrentProject = useStore((state) => state.setCurrentProject);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await tauri.listProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
      alert('Error loading projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    setLoading(true);
    try {
      const data = await tauri.createProject({
        name: newProjectName.trim(),
      });

      setCurrentProject(data);
      localStorage.setItem('arcanum_last_project_id', data.id);
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Error creating project: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openProject = (project) => {
    setCurrentProject(project);
    localStorage.setItem('arcanum_last_project_id', project.id);
  };

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          ARCANUM
          <span className="motto">collige et serva</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
          <h1
            style={{ fontSize: '24px', marginBottom: '12px', fontFamily: 'IBM Plex Serif, serif' }}
          >
            Select a Project
          </h1>
          <p className="text-muted" style={{ marginBottom: '24px' }}>
            Choose an existing research project or create a new one.
          </p>

          {!showCreate ? (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreate(true)}
                style={{ width: '100%', marginBottom: '16px', padding: '10px' }}
              >
                + Create New Project
              </button>

              {loading ? (
                <div className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                  No projects yet. Create your first one above.
                </div>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => openProject(project)}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        background: 'var(--panel-2)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--line)';
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{project.name}</div>
                      <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name (e.g., Atlantis Hunt)"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  marginBottom: '12px',
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createProject();
                  if (e.key === 'Escape') setShowCreate(false);
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={createProject}
                  disabled={!newProjectName.trim() || loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
