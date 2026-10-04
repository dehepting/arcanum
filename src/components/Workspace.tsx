import { lazy, Suspense } from 'react';
import useStore from '../store/useStore';
import EntityPage from './EntityPage';
import IDEWorkspace from './IDEWorkspace';
import EntityExplorer from './EntityExplorer';
import Tabs from './Tabs';
import AdvancedSearch from './AdvancedSearch';
import type { Tab } from '../types/tabs';

// Lazy load heavy components to reduce initial bundle size
const MapView = lazy(() => import('./MapView'));
const PDFView = lazy(() => import('./PDFView'));
const ResearchCanvas = lazy(() => import('./ResearchCanvas'));

// Loading component for lazy-loaded content
interface LoadingFallbackProps {
  message?: string;
}

const LoadingFallback = ({ message = 'Loading...' }: LoadingFallbackProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-muted)',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
      <p>{message}</p>
    </div>
  </div>
);

export default function Workspace() {
  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const currentProject = useStore((state) => state.currentProject);
  const advancedSearchModalOpen = useStore((state) => state.advancedSearchModalOpen);
  const closeAdvancedSearch = useStore((state) => state.closeAdvancedSearch);

  // Find the active tab
  const activeTab: Tab | undefined = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Render content based on active tab type
  const renderTabContent = () => {
    if (!activeTab) return null;

    switch (activeTab.type) {
      case 'map':
        return (
          <Suspense fallback={<LoadingFallback message="Loading map..." />}>
            <MapView />
          </Suspense>
        );

      case 'pdf':
        return activeTab.data?.source ? (
          <Suspense fallback={<LoadingFallback message="Loading PDF viewer..." />}>
            <PDFView source={activeTab.data.source} />
          </Suspense>
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
        return (
          <Suspense fallback={<LoadingFallback message="Loading canvas..." />}>
            <ResearchCanvas tab={activeTab} />
          </Suspense>
        );

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
      <AdvancedSearch isOpen={advancedSearchModalOpen} onClose={closeAdvancedSearch} />
    </div>
  );
}
