import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import useStore from '../store/useStore';

// Set worker path - use a stable CDN URL
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

export default function PDFView() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);

  const activeSourceId = useStore((state) => state.activeSourceId);
  const sources = useStore((state) => state.sources);
  const currentPage = useStore((state) => state.currentPage);
  const pdfScale = useStore((state) => state.pdfScale);
  const setCurrentPage = useStore((state) => state.setCurrentPage);
  const setScale = useStore((state) => state.setScale);
  const activeTool = useStore((state) => state.activeTool);
  const setActiveTool = useStore((state) => state.setActiveTool);

  const activeSource = sources.find((s) => s.id === activeSourceId);

  // Load PDF
  useEffect(() => {
    if (!activeSource?.file_url) return;

    const loadPDF = async () => {
      try {
        const doc = await pdfjsLib.getDocument(activeSource.file_url).promise;
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
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: pdfScale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    };

    renderPage();
  }, [pdfDoc, currentPage, pdfScale]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <button
            className="btn-icon"
            onClick={() => setScale(Math.max(0.5, pdfScale - 0.2))}
          >
            −
          </button>
          <button
            className="btn-icon"
            onClick={() => setScale(Math.min(3.0, pdfScale + 0.2))}
          >
            +
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
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

      {/* PDF Canvas */}
      <div style={{ flex: 1, overflow: 'auto', background: '#0a0b0d', padding: '20px' }}>
        <div style={{ position: 'relative', margin: '0 auto', width: 'fit-content', boxShadow: '0 8px 40px rgba(0,0,0,.45)' }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          <div
            ref={overlayRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: activeTool === 'highlight' ? 'crosshair' : 'default',
            }}
          >
            {/* TODO: Render annotations overlay */}
          </div>
        </div>
      </div>
    </div>
  );
}
