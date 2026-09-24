import useStore from '../store/useStore';
import MapView from './MapView';
import PDFView from './PDFView';
import EntityPage from './EntityPage';
import IDEWorkspace from './IDEWorkspace';
import EntityExplorer from './EntityExplorer';
import Tabs from './Tabs';
import ResearchCanvas from './ResearchCanvas';

export default function Workspace() {
  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const currentProject = useStore((state) => state.currentProject);

  // Find the active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Render content based on active tab type
  const renderTabContent = () => {
    if (!activeTab) return null;

    switch (activeTab.type) {
      case 'map':
        return <MapView />;

      case 'pdf':
        return activeTab.data?.source ? (
          <PDFView source={activeTab.data.source} />
        ) : (
          <div className="tab-empty">No PDF loaded</div>
        );

      case 'person':
      case 'event':
      case 'theory':
      case 'place':
      case 'artifact':
        return (
          <EntityPage
            entityId={activeTab.data?.entityId}
            entityType={activeTab.type}
            title={activeTab.title}
            projectId={currentProject?.id}
            tabId={activeTab.id}
          />
        );

      case 'graph':
        return (
          <div className="tab-empty">
            <p>Network Graph visualization coming soon...</p>
          </div>
        );

      case 'canvas':
        return <ResearchCanvas tab={activeTab} />;

      default:
        return <div className="tab-empty">Unknown tab type</div>;
    }
  };

  // Center Panel: Tabs + active tab content
  const centerPanel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs />
      <div style={{ flex: 1, overflow: 'hidden' }}>{renderTabContent()}</div>
    </div>
  );

  return (
    <div className="workspace">
      <IDEWorkspace leftPanel={<EntityExplorer />} centerPanel={centerPanel} />
    </div>
  );
}
