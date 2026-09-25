// Pure PDF text extraction and validation for Clause Radar (Node / server-side)

// Polyfill Promise.withResolvers for Node runtimes < 22 required by pdfjs-dist
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

export type PdfParseResult = {
  text: string;
  pageBreaks: number[]; // character offsets where each page starts (0-indexed offset in text)
  pageCount: number;
};

export type PdfError =
  | { type: 'not_pdf' }
  | { type: 'too_large'; sizeMB: number }
  | { type: 'too_many_pages'; pageCount: number }
  | { type: 'scan_detected'; avgCharsPerPage: number }
  | { type: 'password_protected' }
  | { type: 'parse_failed'; message: string }
  | { type: 'timeout' };

export class PdfProcessingError extends Error {
  constructor(public readonly error: PdfError) {
    super(error.type);
    this.name = 'PdfProcessingError';
  }
}

interface TextItem {
  str: string;
  hasEOL?: boolean;
}

interface PDFPageProxy {
  getTextContent(): Promise<{ items: unknown[] }>;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface PDFLoadingTask {
  promise: Promise<PDFDocumentProxy>;
}

interface PDFJSLegacyLib {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument(params: {
    data: Uint8Array;
    isEvalSupported?: boolean;
    useSystemFonts?: boolean;
  }): PDFLoadingTask;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_PAGES = 60;
const MIN_AVG_CHARS_PER_PAGE = 200;
const PARSE_TIMEOUT_MS = 20000; // 20 seconds

export async function parsePdf(buffer: ArrayBuffer): Promise<PdfParseResult> {
  // 1. Magic bytes check (%PDF = 0x25, 0x50, 0x44, 0x46)
  if (buffer.byteLength < 4) {
    throw new PdfProcessingError({ type: 'not_pdf' });
  }

  const header = new Uint8Array(buffer, 0, 4);
  if (
    header[0] !== 0x25 || // %
    header[1] !== 0x50 || // P
    header[2] !== 0x44 || // D
    header[3] !== 0x46    // F
  ) {
    throw new PdfProcessingError({ type: 'not_pdf' });
  }

  // 2. File size check
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    const sizeMB = Math.round((buffer.byteLength / (1024 * 1024)) * 10) / 10;
    throw new PdfProcessingError({ type: 'too_large', sizeMB });
  }

  // 3. Dynamic import of pdfjs-dist legacy build for Node.js
  let pdfjsLib: PDFJSLegacyLib;
  try {
    const imported = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as PDFJSLegacyLib;
    pdfjsLib = imported;

    if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = import.meta.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
    }
  } catch (err) {
    throw new PdfProcessingError({
      type: 'parse_failed',
      message: err instanceof Error ? err.message : 'Failed to load PDF engine',
    });
  }

  // 4. Load document with timeout
  const docLoadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(new PdfProcessingError({ type: 'timeout' }));
    }, PARSE_TIMEOUT_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });

  let doc: PDFDocumentProxy;
  try {
    doc = await Promise.race([docLoadingTask.promise, timeoutPromise]);
  } catch (err) {
    if (err instanceof PdfProcessingError) {
      throw err;
    }
    const isPasswordError = Boolean(
      err &&
        typeof err === 'object' &&
        (('name' in err && (err as { name?: string }).name === 'PasswordException') ||
          ('message' in err &&
            typeof (err as { message?: string }).message === 'string' &&
            (err as { message: string }).message.toLowerCase().includes('password')))
    );

    if (isPasswordError) {
      throw new PdfProcessingError({ type: 'password_protected' });
    }

    throw new PdfProcessingError({
      type: 'parse_failed',
      message: err instanceof Error ? err.message : 'Unable to parse document',
    });
  }

  // 5. Page count check
  const pageCount = doc.numPages;
  if (pageCount > MAX_PAGES) {
    throw new PdfProcessingError({ type: 'too_many_pages', pageCount });
  }

  // 6. Extract text page by page
  const pageTexts: string[] = [];
  const pageBreaks: number[] = [];
  let currentOffset = 0;
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    pageBreaks.push(currentOffset);

    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const lineParts: string[] = [];
    for (const item of textContent.items) {
      if (item && typeof item === 'object' && 'str' in item && typeof (item as TextItem).str === 'string') {
        const textItem = item as TextItem;
        lineParts.push(textItem.str + (textItem.hasEOL ? '\n' : ' '));
      }
    }

    const pageRawText = lineParts.join('').replace(/[ \t]+/g, ' ');
    pageTexts.push(pageRawText);
    totalChars += pageRawText.trim().length;

    // + 1 for newline separator between pages
    currentOffset += pageRawText.length + (pageNum < pageCount ? 1 : 0);
  }

  // 7. Scanned PDF detection
  const avgCharsPerPage = pageCount > 0 ? Math.round(totalChars / pageCount) : 0;
  if (avgCharsPerPage < MIN_AVG_CHARS_PER_PAGE) {
    throw new PdfProcessingError({ type: 'scan_detected', avgCharsPerPage });
  }

  const fullText = pageTexts.join('\n');

  return {
    text: fullText,
    pageBreaks,
    pageCount,
  };
}
