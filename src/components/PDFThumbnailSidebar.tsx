import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { logger } from '../utils/logger';

interface Thumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<any>;
}

interface PDFThumbnailSidebarProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  onPageClick: (pageNumber: number) => void;
}

export default function PDFThumbnailSidebar({
  pdfDoc,
  currentPage,
  onPageClick,
}: PDFThumbnailSidebarProps) {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const thumbnailRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfDoc) return;

    const generateThumbnails = async () => {
      const pageCount = pdfDoc.numPages;
      setNumPages(pageCount);

      const thumbs: Thumbnail[] = [];
      const scale = 0.2; // Small scale for thumbnails

      for (let i = 1; i <= pageCount; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale });

          // Create canvas for this thumbnail
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Convert to data URL
          const dataUrl = canvas.toDataURL();

          thumbs.push({
            pageNumber: i,
            dataUrl,
            width: viewport.width,
            height: viewport.height,
          });
        } catch (err) {
          logger.error(`Failed to generate thumbnail for page ${i}:`, err);
        }
      }

      setThumbnails(thumbs);
    };

    generateThumbnails();
  }, [pdfDoc]);

  // Scroll current page thumbnail into view
  useEffect(() => {
    const thumbnailEl = thumbnailRefs.current[currentPage];
    if (thumbnailEl) {
      thumbnailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  const isVisible = isPinned || isExpanded;
  const sidebarWidth = isVisible ? '160px' : '24px';

  if (!pdfDoc || thumbnails.length === 0) {
    return (
      <div
        ref={sidebarRef}
        onMouseEnter={() => !isPinned && setIsExpanded(true)}
        onMouseLeave={() => !isPinned && setIsExpanded(false)}
        style={{
          width: sidebarWidth,
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          transition: 'width 0.2s ease',
          position: 'relative',
        }}
      >
        {isVisible ? 'Loading...' : '📄'}
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={() => !isPinned && setIsExpanded(true)}
      onMouseLeave={() => !isPinned && setIsExpanded(false)}
      style={{
        width: sidebarWidth,
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        overflowY: isVisible ? 'auto' : 'hidden',
        overflowX: 'hidden',
        padding: isVisible ? 'var(--space-3)' : '0',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        transition: 'width 0.2s ease, padding 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Toggle Pin Button */}
      {isVisible && (
        <button
          onClick={() => setIsPinned(!isPinned)}
          style={{
            position: 'sticky',
            top: '8px',
            alignSelf: 'center',
            background: isPinned ? 'var(--accent)' : 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: isPinned ? 'white' : 'var(--text-secondary)',
            zIndex: 10,
            marginBottom: 'var(--space-2)',
          }}
          title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
        >
          {isPinned ? '📌' : '📍'}
        </button>
      )}

      {/* Collapsed state indicator */}
      {!isVisible && (
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            padding: 'var(--space-3) 0',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            userSelect: 'none',
            textAlign: 'center',
            width: '100%',
          }}
        >
          Pages
        </div>
      )}
      {isVisible &&
        thumbnails.map((thumb) => (
          <div
            key={thumb.pageNumber}
            ref={(el) => (thumbnailRefs.current[thumb.pageNumber] = el)}
            onClick={() => onPageClick(thumb.pageNumber)}
            style={{
              cursor: 'pointer',
              border:
                currentPage === thumb.pageNumber
                  ? '2px solid var(--accent)'
                  : '1px solid var(--border)',
              borderRadius: '4px',
              overflow: 'hidden',
              background: 'white',
              transition: 'all 0.2s ease',
              boxShadow: currentPage === thumb.pageNumber ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            }}
            title={`Page ${thumb.pageNumber}`}
          >
            <img
              src={thumb.dataUrl}
              alt={`Page ${thumb.pageNumber}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
            <div
              style={{
                padding: '4px 8px',
                textAlign: 'center',
                fontSize: '11px',
                background: currentPage === thumb.pageNumber ? 'var(--accent)' : 'var(--bg-panel)',
                color: currentPage === thumb.pageNumber ? 'white' : 'var(--text-secondary)',
                fontWeight: currentPage === thumb.pageNumber ? '600' : '400',
              }}
            >
              {thumb.pageNumber}
            </div>
          </div>
        ))}
    </div>
  );
}
