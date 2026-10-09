import { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';
import { renderPdfPage, getPdfInfo, type PdfPageInfo } from '../lib/tauri';
import useStore from '../store/useStore';
import AnnotationOverlay from './AnnotationOverlay';
import InkOverlay from './InkOverlay';
import AnnotationModal from './AnnotationModal';
import PDFThumbnailSidebar from './PDFThumbnailSidebar';
import { loadAnnotations } from '../lib/annotations';

interface ImageSize {
  width: number;
  height: number;
}

export default function PDFView() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfPageInfo | null>(null);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 0, height: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState<string>('1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const activeSourceId = useStore((state) => state.activeSourceId);
  const sources = useStore((state) => state.sources);
  const currentPage = useStore((state) => state.currentPage);
  const pdfScale = useStore((state) => state.pdfScale);
  const setCurrentPage = useStore((state) => state.setCurrentPage);
  const setScale = useStore((state) => state.setScale);
  const activeTool = useStore((state) => state.activeTool);
  const setActiveTool = useStore((state) => state.setActiveTool);
  const setAnnotations = useStore((state) => state.setAnnotations);

  const activeSource = sources.find((s) => s.id === activeSourceId);

  // Load annotations when source changes
  useEffect(() => {
    if (!activeSourceId) return;

    const fetchAnnotations = async () => {
      try {
        const anns = await loadAnnotations(activeSourceId);
        setAnnotations(anns);
      } catch (err) {
        logger.error('Failed to load annotations:', err);
      }
    };

    fetchAnnotations();
  }, [activeSourceId, setAnnotations]);

  // Load PDF info when source changes
  useEffect(() => {
    if (!activeSource?.file_url) {
      logger.warn('No file_url found in source');
      return;
    }

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        logger.debug('Loading PDF info from:', activeSource.file_url);

        const info = await getPdfInfo(activeSource.file_url);
        setPdfInfo(info);
        setCurrentPage(1);
        logger.debug('PDF loaded:', info);
      } catch (err) {
        logger.error('Failed to load PDF:', err);
        setLoadError(`Failed to load PDF: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [activeSource?.file_url, setCurrentPage]);

  // Render current page
  useEffect(() => {
    if (
      !activeSource?.file_url ||
      !pdfInfo ||
      currentPage < 1 ||
      currentPage > pdfInfo.total_pages
    ) {
      return;
    }

    const renderPage = async () => {
      try {
        setIsRendering(true);
        logger.debug(`Rendering page ${currentPage}...`);

        // Render page with Rust backend
        const base64Image = await renderPdfPage(activeSource.file_url, currentPage, pdfScale);
        const imageUrl = `data:image/png;base64,${base64Image}`;

        // Clear old image URL
        if (pageImageUrl) {
          URL.revokeObjectURL(pageImageUrl);
        }

        setPageImageUrl(imageUrl);

        // Calculate rendered size based on PDF dimensions and scale
        const scaledWidth = pdfInfo.width * pdfScale;
        const scaledHeight = pdfInfo.height * pdfScale;
        setImageSize({ width: scaledWidth, height: scaledHeight });

        logger.debug(`Page ${currentPage} rendered`);
      } catch (err) {
        logger.error(`Error rendering page ${currentPage}:`, err);
        setLoadError(
          `Failed to render page ${currentPage}: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();

    // Cleanup function
    return () => {
      if (pageImageUrl) {
        URL.revokeObjectURL(pageImageUrl);
      }
    };
  }, [activeSource?.file_url, pdfInfo, currentPage, pdfScale]);

  // Handle touchpad pinch-to-zoom
  useEffect(() => {
    const container = overlayRef.current?.parentElement;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for pinch gesture (ctrlKey + wheel on Mac trackpad)
      if (e.ctrlKey) {
        e.preventDefault();

        // Adjust scale based on wheel delta
        const delta = -e.deltaY * 0.01;
        const newScale = Math.max(0.5, Math.min(3.0, pdfScale + delta));
        setScale(newScale);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [pdfScale, setScale]);

  // Handle page number input
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    if (!pdfInfo) return;
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= pdfInfo.total_pages) {
      setCurrentPage(page);
    } else {
      // Reset to current page if invalid
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
      e.currentTarget.blur();
    }
  };

  // Update page input when current page changes via other means (arrows, thumbnails)
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  if (!activeSource) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📄</div>
        <div className="empty-state-title">No document selected</div>
        <div className="empty-state-text">
          Open a PDF from the tabs above or click + PDF to upload
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <div className="empty-state-title">Loading PDF...</div>
        <div className="empty-state-text">Reading PDF information</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Failed to load PDF</div>
        <div className="empty-state-text">{loadError}</div>
        <div
          className="empty-state-text"
          style={{
            marginTop: 'var(--space-2)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          File path: {activeSource.file_url}
        </div>
        <button
          onClick={() => {
            setLoadError(null);
            window.location.reload();
          }}
          style={{
            marginTop: 'var(--space-4)',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!pdfInfo) {
    return null;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div className="toolbar">
        {isRendering && (
          <div
            style={{
              marginRight: 'var(--space-3)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
          >
            ⏳ Rendering...
          </div>
        )}
        <div className="toolbar-group">
          <button
            className="btn-icon"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isRendering}
          >
            ←
          </button>
          <button
            className="btn-icon"
            onClick={() => setCurrentPage(Math.min(pdfInfo.total_pages, currentPage + 1))}
            disabled={currentPage >= pdfInfo.total_pages || isRendering}
          >
            →
          </button>
          <input
            type="number"
            min="1"
            max={pdfInfo.total_pages}
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputSubmit}
            onKeyDown={handlePageInputKeyDown}
            style={{
              width: '60px',
              textAlign: 'center',
              padding: 'var(--space-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
            }}
          />
          <span className="toolbar-label">/ {pdfInfo.total_pages}</span>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button className="btn-icon" onClick={() => setScale(Math.max(0.5, pdfScale - 0.2))}>
            −
          </button>
          <button className="btn-icon" onClick={() => setScale(Math.min(3.0, pdfScale + 0.2))}>
            +
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className={`btn-icon ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setActiveTool('select')}
            title="Select & Move"
          >
            ↖️
          </button>
          <button
            className={`btn-icon ${activeTool === 'highlight' ? 'active' : ''}`}
            onClick={() => setActiveTool('highlight')}
            title="Highlight"
          >
            🖍️
          </button>
          <button
            className={`btn-icon ${activeTool === 'ink' ? 'active' : ''}`}
            onClick={() => setActiveTool('ink')}
            title="Draw"
          >
            ✏️
          </button>
          <button
            className={`btn-icon ${activeTool === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTool('text')}
            title="Text note"
          >
            📝
          </button>
        </div>
      </div>

      {/* PDF Image and Overlays */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main PDF View */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: 'var(--bg-canvas)',
            padding: 'var(--space-5)',
          }}
        >
          <div
            style={{
              position: 'relative',
              margin: '0 auto',
              width: 'fit-content',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {pageImageUrl && (
              <img
                ref={imageRef}
                src={pageImageUrl}
                alt={`Page ${currentPage}`}
                style={{
                  display: 'block',
                  width: `${imageSize.width}px`,
                  height: `${imageSize.height}px`,
                }}
              />
            )}
            <div
              ref={overlayRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: activeTool === 'ink' ? 'none' : 'auto',
                  zIndex: 1,
                }}
              >
                <AnnotationOverlay canvasWidth={imageSize.width} canvasHeight={imageSize.height} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: activeTool === 'ink' ? 'auto' : 'none',
                  zIndex: 2,
                }}
              >
                <InkOverlay
                  canvasWidth={imageSize.width}
                  canvasHeight={imageSize.height}
                  active={activeTool === 'ink'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Sidebar - temporarily disabled, will re-enable after testing */}
        {/* <PDFThumbnailSidebar
          pdfDoc={null}
          currentPage={currentPage}
          onPageClick={setCurrentPage}
        /> */}
      </div>

      {/* Annotation Modal */}
      <AnnotationModal />
    </div>
  );
}
