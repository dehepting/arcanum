import { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

// Polyfill ReadableStream for Tauri webview environment
// PDF.js requires ReadableStream which isn't available in Tauri
import * as streamPolyfill from 'web-streams-polyfill';
if (typeof globalThis.ReadableStream === 'undefined') {
  (globalThis as any).ReadableStream = streamPolyfill.ReadableStream;
  (globalThis as any).TransformStream = streamPolyfill.TransformStream;
  logger.debug('ReadableStream polyfill installed for Tauri compatibility');
}

import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import useStore from '../store/useStore';
import AnnotationOverlay from './AnnotationOverlay';
import InkOverlay from './InkOverlay';
import AnnotationModal from './AnnotationModal';
import PDFThumbnailSidebar from './PDFThumbnailSidebar';
import { loadAnnotations } from '../lib/annotations';
import { invoke } from '@tauri-apps/api/core';

interface CanvasSize {
  width: number;
  height: number;
}

// Don't set workerSrc at all - PDF.js will run without a worker
// This avoids the ReadableStream issues in the worker context
// The polyfill in the main thread will be used instead
// Trade-off: Slower rendering but compatible with Tauri
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker; // Commented out for Tauri compatibility

export default function PDFView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [selectedText, setSelectedText] = useState<string>('');
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

  // Load PDF
  useEffect(() => {
    logger.debug('Active source:', activeSource);
    logger.debug('File URL:', activeSource?.file_url);

    if (!activeSource?.file_url) {
      logger.warn('No file_url found in source');
      return;
    }

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        logger.debug('Reading PDF file from:', activeSource.file_url);

        // Read file as binary data using Tauri command
        const fileData = await invoke<number[]>('read_file_bytes', {
          filePath: activeSource.file_url,
        });
        logger.debug('File read successfully, size:', fileData.length, 'bytes');

        // Check if file data is empty
        if (!fileData || fileData.length === 0) {
          throw new Error('PDF file is empty or could not be read');
        }

        logger.debug('Converting to Uint8Array...');
        const uint8Array = new Uint8Array(fileData);

        logger.debug('Loading PDF document...');
        // Load PDF from binary data with polyfilled stream support
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          // Disable auto-fetch to prevent additional stream usage
          disableAutoFetch: true,
          // Disable range requests
          disableRange: true,
          // Use standard fonts
          useSystemFonts: false,
        });

        const doc = await loadingTask.promise;
        logger.debug('PDF loaded successfully, pages:', doc.numPages);

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setPageInput('1');
        setIsLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error('Error loading PDF:', err);
        logger.error('Failed to load from:', activeSource.file_url);
        setLoadError(`Failed to load PDF: ${errorMsg}`);
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [activeSource, setCurrentPage]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    const renderPage = async () => {
      try {
        setIsRendering(true);
        logger.debug(`Rendering page ${currentPage}...`);

        const page = await pdfDoc.getPage(currentPage);
        logger.debug(`Page ${currentPage} loaded, rendering viewport...`);

        const viewport = page.getViewport({ scale: pdfScale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Clear the canvas before rendering new page
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Update canvas size for overlay
        setCanvasSize({ width: viewport.width, height: viewport.height });

        // Set white background for proper PDF rendering
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        logger.debug(`Rendering page ${currentPage} to canvas...`);
        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        } as any);

        await renderTask.promise;
        logger.debug(`Page ${currentPage} rendered successfully`);

        // Render text layer for selection
        logger.debug(`Rendering text layer for page ${currentPage}...`);
        const textContent = await page.getTextContent();
        const textLayer = textLayerRef.current!;
        textLayer.innerHTML = '';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;

        // Simple text layer rendering (invisible but selectable)
        textContent.items.forEach((item) => {
          // Filter out marked content (only process TextItem)
          if (!('str' in item)) return;

          const textItem = item as TextItem;
          const div = document.createElement('div');
          div.textContent = textItem.str;
          div.style.position = 'absolute';
          div.style.left = `${textItem.transform[4]}px`;
          div.style.top = `${textItem.transform[5]}px`;
          div.style.fontSize = `${Math.sqrt(textItem.transform[0] * textItem.transform[0] + textItem.transform[1] * textItem.transform[1])}px`;
          div.style.fontFamily = textItem.fontName;
          div.style.color = 'transparent'; // Make text invisible but still selectable
          div.style.userSelect = 'text';
          textLayer.appendChild(div);
        });

        logger.debug(`Page ${currentPage} fully rendered with text layer`);
        setIsRendering(false);
      } catch (err) {
        logger.error(`Error rendering page ${currentPage}:`, err);
        setIsRendering(false);
        setLoadError(
          `Failed to render page ${currentPage}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, pdfScale]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';
      setSelectedText(text);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

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

  // Add selected text to canvas
  const addToCanvas = () => {
    if (!selectedText || !activeSource) return;

    window.dispatchEvent(
      new CustomEvent('addPDFExcerptToCanvas', {
        detail: {
          text: selectedText,
          sourceId: activeSource.id,
          sourceTitle: activeSource.title,
          pageNumber: currentPage,
        },
      })
    );

    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  // Handle page number input
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
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
        <div className="empty-state-text">Reading file data</div>
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
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages || isRendering}
          >
            →
          </button>
          <input
            type="number"
            min="1"
            max={numPages}
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
          <span className="toolbar-label">/ {numPages}</span>
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

        {selectedText && (
          <>
            <div className="toolbar-separator" />
            <div className="toolbar-group">
              <button
                className="btn-primary"
                onClick={addToCanvas}
                title="Add selected text to Research Canvas"
              >
                Add to Canvas
              </button>
            </div>
          </>
        )}
      </div>

      {/* PDF Canvas and Thumbnails */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main PDF Canvas */}
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
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div
              ref={textLayerRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'auto',
                userSelect: 'text',
              }}
            />
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
                <AnnotationOverlay
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                />
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
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  active={activeTool === 'ink'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Sidebar */}
        <PDFThumbnailSidebar
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          onPageClick={setCurrentPage}
        />
      </div>

      {/* Annotation Modal */}
      <AnnotationModal />
    </div>
  );
}
