import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import useStore from '../store/useStore';
import AnnotationOverlay from './AnnotationOverlay';
import InkOverlay from './InkOverlay';
import AnnotationModal from './AnnotationModal';
import { loadAnnotations } from '../lib/annotations';
import { invoke } from '@tauri-apps/api/core';

// Set worker path from npm package (ensures version match)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PDFView() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const textLayerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedText, setSelectedText] = useState('');

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
        console.error('Failed to load annotations:', err);
      }
    };

    fetchAnnotations();
  }, [activeSourceId, setAnnotations]);

  // Load PDF
  useEffect(() => {
    console.log('Active source:', activeSource);
    console.log('File URL:', activeSource?.file_url);

    if (!activeSource?.file_url) {
      console.warn('No file_url found in source');
      return;
    }

    const loadPDF = async () => {
      try {
        console.log('Loading PDF from:', activeSource.file_url);
        const doc = await pdfjsLib.getDocument({ url: activeSource.file_url }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
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
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Update canvas size for overlay
      setCanvasSize({ width: viewport.width, height: viewport.height });

      await page.render({ canvasContext: ctx, viewport }).promise;

      // Render text layer for selection
      const textContent = await page.getTextContent();
      const textLayer = textLayerRef.current;
      textLayer.innerHTML = '';
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;

      // Simple text layer rendering
      textContent.items.forEach((item) => {
        const div = document.createElement('div');
        div.textContent = item.str;
        div.style.position = 'absolute';
        div.style.left = `${item.transform[4]}px`;
        div.style.top = `${item.transform[5]}px`;
        div.style.fontSize = `${Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1])}px`;
        div.style.fontFamily = item.fontName;
        textLayer.appendChild(div);
      });
    };

    renderPage();
  }, [pdfDoc, currentPage, pdfScale]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      setSelectedText(text);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

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
    window.getSelection().removeAllRanges();
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

      {/* PDF Canvas */}
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
              pointerEvents: activeTool === 'select' ? 'none' : 'auto',
            }}
          >
            <AnnotationOverlay canvasWidth={canvasSize.width} canvasHeight={canvasSize.height} />
            <InkOverlay
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              active={activeTool === 'ink'}
            />
          </div>
        </div>
      </div>

      {/* Annotation Modal */}
      <AnnotationModal />
    </div>
  );
}
