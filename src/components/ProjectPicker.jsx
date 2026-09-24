import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import * as tauri from '../lib/tauri';

export default function ProjectPicker() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
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

  const handleDeleteClick = (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (!projectToDelete || deleteConfirmText !== projectToDelete.name) {
      return;
    }

    setLoading(true);
    try {
      await tauri.deleteProject(projectToDelete.id);
      await loadProjects();
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Error deleting project: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
    setDeleteConfirmText('');
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
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--line)';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{project.name}</div>
                        <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(project, e)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--red-9)';
                          e.currentTarget.style.borderColor = 'var(--red-7)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'var(--line)';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                      >
                        Delete
                      </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={cancelDelete}
        >
          <div
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--red-7)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--red-9)', fontSize: '18px' }}>
              ⚠️ Delete Project
            </h3>
            <p style={{ margin: '0 0 16px 0', lineHeight: 1.5 }}>
              This will permanently delete <strong>{projectToDelete.name}</strong> and all its data:
            </p>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', lineHeight: 1.5 }}>
              <li>All entities (people, places, events, theories, artifacts)</li>
              <li>All entity pages and content</li>
              <li>All sources and annotations</li>
              <li>This action cannot be undone</li>
            </ul>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500 }}>
              Type{' '}
              <code style={{ background: 'var(--panel)', padding: '2px 6px', borderRadius: '3px' }}>
                {projectToDelete.name}
              </code>{' '}
              to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Type "${projectToDelete.name}" to confirm`}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                color: 'var(--text)',
                fontSize: '14px',
                marginBottom: '16px',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deleteConfirmText === projectToDelete.name) {
                  confirmDelete();
                }
                if (e.key === 'Escape') cancelDelete();
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" onClick={cancelDelete} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== projectToDelete.name || loading}
                style={{
                  flex: 1,
                  background:
                    deleteConfirmText === projectToDelete.name ? 'var(--red-9)' : 'var(--panel)',
                  color: deleteConfirmText === projectToDelete.name ? 'white' : 'var(--text-muted)',
                  cursor: deleteConfirmText === projectToDelete.name ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
