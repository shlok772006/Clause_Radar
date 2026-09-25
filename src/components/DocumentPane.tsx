"use client";

// Polyfill Promise.withResolvers for browsers/environments that lack it
if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers === 'undefined') {
  Object.defineProperty(Promise, 'withResolvers', {
    value: function <T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    },
    writable: true,
    configurable: true,
  });
}

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Clause } from '@/lib/types';
import type * as PdfjsTypes from 'pdfjs-dist';

export interface DocumentPaneHandle {
  highlightClause: (clauseId: string) => void;
  scrollToPage: (pageNum: number) => void;
}

export interface DocumentPaneProps {
  file: File | null;
  clauses: Clause[];
  highlightedClauseId?: string | null;
  onClauseSelect?: (clauseId: string) => void;
  onFileChange?: (file: File) => void;
}

export const DocumentPane = forwardRef<DocumentPaneHandle, DocumentPaneProps>(function DocumentPane(
  { file, clauses, highlightedClauseId, onFileChange },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfjsTypes.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setActiveHighlightId] = useState<string | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  const pdfjsLibRef = useRef<typeof PdfjsTypes | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderTasksRef = useRef<Map<number, { cancel: () => void }>>(new Map());

  // Initialize PDF.js client library
  useEffect(() => {
    let isMounted = true;
    import('pdfjs-dist').then((pdfjs) => {
      if (!isMounted) return;
      pdfjsLibRef.current = pdfjs;
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load PDF Document when file changes
  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadDoc = async () => {
      try {
        const pdfjs = pdfjsLibRef.current || (await import('pdfjs-dist'));
        pdfjsLibRef.current = pdfjs;
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }

        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(buffer),
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to load PDF in viewer.');
      }
    };

    loadDoc();

    return () => {
      isMounted = false;
    };
  }, [file]);

  // Render a specific page
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !pdfjsLibRef.current) return;

      const canvas = canvasRefs.current.get(pageNumber);
      const textLayerDiv = textLayerRefs.current.get(pageNumber);
      if (!canvas || !textLayerDiv) return;

      // Cancel previous render task if running
      const existingTask = renderTasksRef.current.get(pageNumber);
      if (existingTask) {
        existingTask.cancel();
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        // High DPI scaling for sharp text
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.scale(outputScale, outputScale);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.set(pageNumber, renderTask);
        await renderTask.promise;
        ctx.restore();

        // Render TextLayer
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;
        textLayerDiv.style.setProperty('--scale-factor', `${scale}`);

        const textContent = await page.getTextContent();
        const TextLayerClass = pdfjsLibRef.current.TextLayer;
        if (TextLayerClass) {
          const textLayer = new TextLayerClass({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
          });
          await textLayer.render();
        }
      } catch (err: unknown) {
        const isCancelled =
          err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException';
        if (!isCancelled) {
          console.warn(`[DocumentPane] page ${pageNumber} render warning`);
        }
      }
    },
    [pdfDoc, scale]
  );

  // Re-render visible pages when scale or pdfDoc changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    for (let p = 1; p <= numPages; p++) {
      renderPage(p);
    }
  }, [pdfDoc, numPages, scale, renderPage]);

  // Highlight logic for a clause
  const highlightClause = useCallback(
    (clauseId: string) => {
      const clause = clauses.find((c) => c.id === clauseId);
      if (!clause) return;

      setActiveHighlightId(clause.id);
      const targetPage = clause.page;
      setCurrentPage(targetPage);

      // Announce for screen readers
      setSrAnnouncement(`Showing clause ${clause.id} on page ${targetPage}`);

      // Scroll to page container
      const pageContainer = pageRefs.current.get(targetPage);
      if (!pageContainer) return;

      pageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Clear existing highlights across all pages
      document.querySelectorAll('.clause-highlight').forEach((el) => {
        el.classList.remove('clause-highlight');
      });
      document.querySelectorAll('.page-tint-highlight').forEach((el) => {
        el.classList.remove('page-tint-highlight');
      });

      // Match anchor text inside the page's text layer
      const textLayer = textLayerRefs.current.get(targetPage);
      if (!textLayer) {
        pageContainer.classList.add('page-tint-highlight');
        return;
      }

      const spans = Array.from(textLayer.querySelectorAll('span'));
      if (spans.length === 0) {
        pageContainer.classList.add('page-tint-highlight');
        return;
      }

      const cleanAnchor = clause.anchor.replace(/\s+/g, ' ').trim().toLowerCase();
      // Use anchor or first 30 chars of anchor
      const searchNeedle = cleanAnchor.slice(0, Math.min(cleanAnchor.length, 35));

      // Build continuous text map of spans
      let fullPageText = '';
      const spanOffsets: { span: HTMLSpanElement; start: number; end: number }[] = [];

      spans.forEach((span) => {
        const text = (span.textContent || '').replace(/\s+/g, ' ');
        const start = fullPageText.length;
        fullPageText += text + ' ';
        spanOffsets.push({ span, start, end: start + text.length });
      });

      const matchIndex = fullPageText.toLowerCase().indexOf(searchNeedle);

      if (matchIndex !== -1) {
        const matchEnd = matchIndex + searchNeedle.length;
        const matchedSpans: HTMLSpanElement[] = [];

        spanOffsets.forEach(({ span, start, end }) => {
          if (end >= matchIndex && start <= matchEnd) {
            span.classList.add('clause-highlight');
            matchedSpans.push(span);
          }
        });

        if (matchedSpans.length > 0) {
          matchedSpans[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Fallback: Soft page-level tint if anchor text not located
        pageContainer.classList.add('page-tint-highlight');
      }
    },
    [clauses]
  );

  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);
    const pageEl = pageRefs.current.get(pageNum);
    pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [numPages]);

  // Expose highlightClause & scrollToPage via imperative handle
  useImperativeHandle(
    ref,
    () => ({
      highlightClause,
      scrollToPage,
    }),
    [highlightClause, scrollToPage]
  );

  // Synchronize when highlightedClauseId prop changes
  useEffect(() => {
    if (highlightedClauseId) {
      highlightClause(highlightedClauseId);
    }
  }, [highlightedClauseId, highlightClause]);

  // Observe current scroll page
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const handleScroll = () => {
      const containerTop = container.scrollTop;
      for (let p = 1; p <= numPages; p++) {
        const pageEl = pageRefs.current.get(p);
        if (pageEl) {
          const offsetTop = pageEl.offsetTop - container.offsetTop;
          if (offsetTop + pageEl.clientHeight / 2 >= containerTop) {
            setCurrentPage(p);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages]);

  return (
    <div className="flex flex-col h-full bg-[#EAECE9] border-r border-rule overflow-hidden relative select-none">
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>

      {/* Viewer toolbar */}
      <header className="flex items-center justify-between px-4 py-2 bg-paper border-b border-rule z-10 text-xs text-ink font-medium">
        <div className="flex items-center gap-2">
          <span>
            Page <strong className="font-semibold">{currentPage}</strong> of <strong>{numPages || 1}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.75, s - 0.15))}
            className="px-2 py-1 bg-white hover:bg-rule/40 border border-rule rounded text-ink transition-colors cursor-pointer"
            aria-label="Zoom out"
            title="Zoom out"
          >
            -
          </button>
          <span className="w-12 text-center text-ink-soft">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
            className="px-2 py-1 bg-white hover:bg-rule/40 border border-rule rounded text-ink transition-colors cursor-pointer"
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </header>

      {/* Viewer Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-6"
        id="document-viewer-container"
        tabIndex={0}
        aria-label="Document pages viewer"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-ink-soft text-sm gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-ink border-t-transparent rounded-full" />
            <span>Rendering PDF document...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded text-sm max-w-md my-auto">
            <p className="font-semibold mb-1">Viewer Error</p>
            <p>{error}</p>
          </div>
        )}

        {!file && !loading && (
          <div className="flex flex-col items-center justify-center h-full max-w-sm text-center p-6 my-auto">
            <div className="w-12 h-12 mb-3 text-ink-soft opacity-60">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink mb-1">PDF not in memory</p>
            <p className="text-xs text-ink-soft mb-4">
              If you reloaded the page, select the file again to view the rendered pages.
            </p>
            {onFileChange && (
              <label className="inline-flex items-center px-3 py-1.5 bg-white hover:bg-rule/40 border border-rule rounded text-xs font-semibold text-ink cursor-pointer shadow-sm transition">
                <span>Select PDF file</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) onFileChange(selected);
                  }}
                />
              </label>
            )}
          </div>
        )}

        {/* Render pages list */}
        {file &&
          numPages > 0 &&
          Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              id={`pdf-page-${pageNum}`}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el);
                else pageRefs.current.delete(pageNum);
              }}
              className="relative shadow-md bg-white border border-rule transition-shadow duration-300 rounded-sm"
              style={{ minHeight: `${600 * scale}px` }}
            >
              {/* Canvas Visual Layer */}
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el);
                  else canvasRefs.current.delete(pageNum);
                }}
                className="block"
              />

              {/* Text Layer Overlay */}
              <div
                ref={(el) => {
                  if (el) textLayerRefs.current.set(pageNum, el);
                  else textLayerRefs.current.delete(pageNum);
                }}
                className="textLayer absolute inset-0 select-text pointer-events-auto"
              />

              {/* Page Number Watermark */}
              <div className="absolute bottom-2 right-2 text-[10px] text-ink-soft/50 font-mono select-none pointer-events-none">
                p. {pageNum}
              </div>
            </div>
          ))}
      </div>

      <style jsx global>{`
        .textLayer {
          position: absolute;
          text-align: initial;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 1;
          line-height: 1;
          text-size-adjust: none;
          forced-color-adjust: none;
          transform-origin: 0 0;
          z-index: 2;
        }

        .textLayer span,
        .textLayer br {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }

        .textLayer ::selection {
          background: rgba(242, 209, 78, 0.45);
        }

        .clause-highlight {
          background-color: var(--marker) !important;
          color: #16202b !important;
          border-radius: 2px;
          animation: highlight-sweep 400ms ease-out;
          box-shadow: 0 0 0 2px rgba(242, 209, 78, 0.5);
          z-index: 3;
        }

        .page-tint-highlight {
          box-shadow: 0 0 0 3px var(--marker), 0 4px 12px rgba(242, 209, 78, 0.35) !important;
          background-color: rgba(242, 209, 78, 0.08) !important;
        }

        @keyframes highlight-sweep {
          from {
            background-color: rgba(242, 209, 78, 0.2);
          }
          to {
            background-color: #f2d14e;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .clause-highlight {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
});

export default DocumentPane;
