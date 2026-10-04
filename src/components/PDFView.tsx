import { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';
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

// Set worker path from npm package (ensures version match)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PDFView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [selectedText, setSelectedText] = useState<string>('');

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
    logger.debug('File URL:', (activeSource as any)?.file_url);

    if (!(activeSource as any)?.file_url) {
      logger.warn('No file_url found in source');
      return;
    }

    const loadPDF = async () => {
      try {
        logger.debug('Reading PDF file from:', (activeSource as any).file_url);

        // Read file as binary data using Tauri command
        const fileData = await invoke<number[]>('read_file_bytes', {
          filePath: (activeSource as any).file_url,
        });
        logger.debug('File read successfully, size:', fileData.length, 'bytes');

        // Load PDF from binary data
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fileData) }).promise;
        logger.debug('PDF loaded successfully, pages:', doc.numPages);

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        logger.error('Error loading PDF:', err);
        logger.error('Failed to load from:', (activeSource as any).file_url);
      }
    };

    loadPDF();
  }, [activeSource, setCurrentPage]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: pdfScale });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      // Clear the canvas before rendering new page
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Update canvas size for overlay
      setCanvasSize({ width: viewport.width, height: viewport.height });

      // Set white background for proper PDF rendering
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      } as any).promise;

      // Render text layer for selection
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
          sourceTitle: (activeSource as any).title,
          pageNumber: currentPage,
        },
      })
    );

    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            className="btn-icon"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            ←
          </button>
          <button
            className="btn-icon"
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
          >
            →
          </button>
          <span className="toolbar-label">
            Page {currentPage} / {numPages}
          </span>
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
