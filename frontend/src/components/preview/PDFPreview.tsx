import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs, type PDFDocumentProxy } from 'react-pdf';

import { useStore } from '../../store/useStore';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// A4 dimensions in px at 96 DPI
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

// Page gap in px
const PAGE_GAP = 16;

/**
 * PDFPreview component - shows actual compiled PDF with multi-page support
 */
export function PDFPreview() {
  const { pdfUrl, zoom, setZoom, compileStatus, setPdfPageCount } = useStore();
  const [renderError, setRenderError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scale = zoom / 100;
  const hasRealPdf = !!pdfUrl && !renderError;

  const handleDocumentLoad = useCallback(({ numPages }: PDFDocumentProxy) => {
    setNumPages(numPages);
    setPdfPageCount(numPages);
    setRenderError(null);
  }, [setPdfPageCount]);

  const handlePageLoadError = useCallback(() => {
    setRenderError('Failed to render PDF page');
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'resume.pdf';
    a.click();
  }, [pdfUrl]);

  // Reset page count when PDF URL changes
  const prevUrlRef = useRef(pdfUrl);
  if (pdfUrl !== prevUrlRef.current) {
    prevUrlRef.current = pdfUrl;
    setNumPages(0);
  }

  const pageCount = numPages || 1;

  return (
    <section className="col-span-4 bg-surface-dim flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-4 bg-surface-container-high">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">picture_as_pdf</span>
          <span className="text-xs font-bold tracking-tight">Preview</span>
          {compileStatus === 'compiling' ? (
            <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
              Compiling...
            </span>
          ) : hasRealPdf ? (
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {numPages > 0 ? `${numPages} page${numPages !== 1 ? 's' : ''}` : 'Loading...'}
            </span>
          ) : compileStatus === 'error' ? (
            <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Compilation Error
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Waiting for compile...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-surface-container-lowest rounded-sm px-2 py-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 hover:bg-surface-container-high rounded-sm transition-colors cursor-pointer"
              aria-label="Zoom out"
            >
              <span className="material-symbols-outlined text-xs">remove</span>
            </button>
            <span className="text-[10px] font-bold w-9 text-center tabular-nums">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1 hover:bg-surface-container-high rounded-sm transition-colors cursor-pointer"
              aria-label="Zoom in"
            >
              <span className="material-symbols-outlined text-xs">add</span>
            </button>
          </div>

          {/* Download */}
          {hasRealPdf && (
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-surface-container-high rounded-sm transition-colors cursor-pointer"
              aria-label="Download PDF"
            >
              <span className="material-symbols-outlined text-xs">download</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#4a4a4a]"
      >
        {compileStatus === 'compiling' && !pdfUrl ? (
          <div className="flex flex-col items-center justify-center gap-4 mt-20">
            <span className="material-symbols-outlined text-3xl text-white/40 animate-spin">refresh</span>
            <p className="text-sm text-white/60">Compiling LaTeX...</p>
          </div>
        ) : compileStatus === 'error' && !pdfUrl ? (
          <div className="flex flex-col items-center justify-center gap-4 mt-20">
            <span className="material-symbols-outlined text-3xl text-red-400">error</span>
            <p className="text-sm text-red-300">Compilation failed</p>
            <p className="text-xs text-white/50 max-w-[240px] text-center">Check the LaTeX code for errors and try again.</p>
          </div>
        ) : hasRealPdf ? (
          /* Real PDF rendering - all pages */
          <div className="flex flex-col items-center animate-fade-in">
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoad}
              onLoadError={() => setRenderError('Failed to load PDF')}
              loading={
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                  <span className="material-symbols-outlined text-2xl text-white/40 animate-spin">refresh</span>
                  <p className="text-sm text-white/50">Loading PDF...</p>
                </div>
              }
            >
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <div
                  key={page}
                  className="pdf-page shadow-2xl bg-white"
                  style={{
                    width: A4_WIDTH * scale,
                    height: A4_HEIGHT * scale,
                    marginBottom: page < pageCount ? PAGE_GAP * scale : 0,
                  }}
                >
                  <Page
                    pageNumber={page}
                    width={A4_WIDTH}
                    height={A4_HEIGHT}
                    scale={scale}
                    onLoadError={handlePageLoadError}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
            </Document>
            {numPages > 0 && (
              <p className="text-center text-[10px] text-white/30 mt-3 tabular-nums">
                {numPages} page{numPages !== 1 ? 's' : ''} — A4 — {zoom}%
              </p>
            )}
          </div>
        ) : (
          /* No PDF yet */
          <div className="flex flex-col items-center justify-center gap-4 mt-20">
            <span className="material-symbols-outlined text-3xl text-white/30">picture_as_pdf</span>
            <p className="text-sm text-white/50">Start editing to compile...</p>
            <p className="text-xs text-white/30 max-w-[240px] text-center">Click Compile to generate a PDF preview.</p>
          </div>
        )}
      </div>
    </section>
  );
}
