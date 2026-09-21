# Phase 1 — PLAN.md: The Spine

## Phase Goal
PDF uploads → becomes clauses → renders in left pane → clicking a clause ID highlights on the correct page.

**Tracer slice:** Upload a PDF → segmented into clauses → view in two-pane layout → click a clause in the right pane → left pane scrolls and highlights the exact text. This end-to-end slice is verified before any expansion.

---

## Wave 1 — Foundation (Tasks 1.1, 1.2)

### Plan 1.1 — Project Scaffold

**Files to create/modify:**

#### [NEW] Project initialization
```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

#### [NEW] Vitest setup
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @testing-library/jest-dom
```

#### [NEW] `vitest.config.mts`
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

#### [NEW] `vitest.setup.ts`
```ts
import '@testing-library/jest-dom/vitest';
```

#### [MODIFY] `package.json` — add scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

#### [NEW] Additional dependencies
```bash
npm install pdfjs-dist @google/generative-ai yaml
```

#### [MODIFY] `src/app/globals.css` — Design tokens from 09-DESIGN-DIRECTION.md
```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --paper:    #FBFBF9;
  --ink:      #16202B;
  --ink-soft: #55606B;
  --rule:     #DCDFD9;
  --marker:   #F2D14E;   /* highlighter — evidence ONLY */
  --flag:     #B3402E;    /* risk findings only */
  --verified: #2F6F5E;    /* verification passed */

  --font-sans: 'Instrument Sans', system-ui, sans-serif;
  --font-serif: 'Source Serif 4', Georgia, serif;
}

body {
  font-family: var(--font-sans);
  color: var(--ink);
  background-color: var(--paper);
  line-height: 1.55;
}
```

#### [MODIFY] `tailwind.config.ts` — extend with design tokens
```ts
// Add to theme.extend:
colors: {
  paper: '#FBFBF9',
  ink: { DEFAULT: '#16202B', soft: '#55606B' },
  rule: '#DCDFD9',
  marker: '#F2D14E',
  flag: '#B3402E',
  verified: '#2F6F5E',
},
fontFamily: {
  sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
  serif: ['Source Serif 4', 'Georgia', 'serif'],
},
fontSize: {
  'xs': '0.8125rem',   // 13px
  'sm': '0.9375rem',   // 15px
  'base': '1.0625rem', // 17px
  'lg': '1.3125rem',   // 21px
  'xl': '1.75rem',     // 28px
  '2xl': '2.375rem',   // 38px
},
```

#### Create directory structure
```
src/lib/
src/lib/prompts/
src/components/
src/config/
eval/
eval/fixtures/
scripts/
```

#### [NEW] `.env.example`
```
GEMINI_API_KEY=your-api-key-here
```

#### [MODIFY] `.gitignore` — ensure `.env.local` is ignored (should be by default)

**Definition of done:** `npm run dev` serves a styled page with design tokens applied; `npm run test` runs with zero tests (but no errors).

---

### Plan 1.2 — Type Definitions

#### [NEW] `src/lib/types.ts`

Copy **verbatim** from `docs/03-DATA-CONTRACTS.md`. All types:
- `Clause`, `Concern`, `Severity`, `Presence`
- `Evidence`, `Claim`
- `AnswerStatus`, `AnswerEnvelope`
- `ExtractedField<T>`, `RawFields`, `VerifiedFields`
- `RubricItem`, `RubricResult`
- `Finding`
- `Session`

Plus the concern labels map from `docs/05-DOMAIN-CONFIG.md`:
```ts
export const CONCERN_LABELS: Record<Concern, string> = {
  exit:        "Leaving the job",
  lockin:      "Being locked in",
  future_work: "My next job and side work",
  pay:         "Pay and benefits",
  ip:          "Who owns what I build",
  termination: "Being let go",
};
```

**Definition of done:** `npx tsc --noEmit` passes.

---

## Wave 2 — PDF Pipeline (Tasks 1.3, 1.4)

*Can run in parallel — no dependency between 1.3 and 1.4 during development, though 1.4 consumes 1.3's output type.*

### Plan 1.3 — PDF Text Extraction

#### [NEW] `src/lib/pdf.ts`

```ts
// Exports:
export type PdfParseResult = {
  text: string;
  pageBreaks: number[];   // character offsets where each page starts
  pageCount: number;
};

export type PdfError =
  | { type: 'not_pdf' }
  | { type: 'too_large'; sizeMB: number }
  | { type: 'too_many_pages'; pageCount: number }
  | { type: 'scan_detected'; avgCharsPerPage: number }
  | { type: 'parse_failed'; message: string }
  | { type: 'timeout' };

export async function parsePdf(buffer: ArrayBuffer): Promise<PdfParseResult>
```

**Implementation steps:**
1. **Magic byte check:** First 4 bytes must be `%PDF` (hex `25 50 44 46`). If not → `{ type: 'not_pdf' }`.
2. **Size check:** `buffer.byteLength > 15 * 1024 * 1024` → `{ type: 'too_large', sizeMB }`.
3. **Load with pdfjs:** `pdfjsLib.getDocument({ data: buffer })` with a 20-second timeout via `AbortController` or `Promise.race`.
4. **Page count check:** `doc.numPages > 60` → `{ type: 'too_many_pages' }`.
5. **Extract text page by page:**
   - For each page, call `page.getTextContent()`
   - Join all `items[].str` with appropriate spacing
   - Track `pageBreaks[]` — the character offset where each page's text begins in the concatenated string
6. **Scan detection:** If average characters per page < 200 → `{ type: 'scan_detected' }`.
7. Return `{ text, pageBreaks, pageCount }`.

**Key detail:** Use `pdfjs-dist` in Node.js (server-side). Set the worker to disabled for server use: `pdfjsLib.GlobalWorkerOptions.workerSrc = ''` or use the `--no-worker` approach. Server-side pdfjs doesn't need a web worker.

**Definition of done:** Given a fixture PDF, returns full text plus correct `pageBreaks`.

---

### Plan 1.4 — Clause Segmentation

#### [NEW] `src/lib/segment.ts`

```ts
export function segmentClauses(text: string, pageBreaks: number[]): Clause[]
```

**Algorithm (deterministic, no model call):**

1. **Split text into lines.**
2. **Scan lines in order, maintaining state:**
   - `currentHeadingPath: string[]`
   - `clauses: Clause[]`
   - `currentClause: { lines: string[], startOffset: number } | null`

3. **Line classification (priority order):**
   - **Numbered heading:** regex `^\s*(\d+(\.\d+)*)[\.)]?\s+[A-Z]`
     → Flush current clause. Start new clause. Capture `number` (e.g., "8.2"). Push to `headingPath`.
   - **ALL-CAPS standalone line** (under ~80 chars, all letters uppercase):
     → Section heading. Push onto `headingPath`. Not a clause by itself.
   - **Title Case standalone line** (under ~80 chars):
     → Same as ALL-CAPS — section heading.
   - **`SCHEDULE`/`ANNEXURE`/`EXHIBIT`** keyword:
     → New top-level section. Reset `headingPath`.
   - **Blank line:**
     → If current clause exists and is ≥200 chars, flush it. Start new paragraph group.
   - **Otherwise:** Append to current clause.

4. **Merge rule:** After initial pass, merge any clause under 120 characters forward into the next clause, UNLESS it is itself a heading.

5. **Assign fields to each clause:**
   - `id`: `c_001`, `c_002`, ... (zero-padded 3 digits)
   - `ordinal`: 0-based index
   - `number`: captured number string or `null`
   - `headingPath`: copy of current heading stack
   - `text`: joined text
   - `page`: determine from `pageBreaks` — find which page `charStart` falls in
   - `charStart`, `charEnd`: character offsets in the full text
   - `anchor`: first 60 characters, whitespace-normalised (collapse all whitespace to single spaces, trim)

#### [NEW] `src/lib/segment.test.ts`

**Test cases (8+ assertions):**

```ts
describe('segmentClauses', () => {
  test('detects numbered clause: "8.2 Notice Period" → number: "8.2"');
  test('detects nested numbering: "1.1.1 Sub clause"');
  test('heading path accumulates across sections');
  test('heading path resets on SCHEDULE/ANNEXURE');
  test('fragments under 120 chars merge forward');
  test('fragments that ARE headings do NOT merge');
  test('page numbers correct across a page boundary');
  test('empty input returns []');
  test('anchor is first 60 chars, whitespace normalised');
  test('ALL-CAPS line under 80 chars is treated as heading, not clause');
});
```

**Test data:** Inline strings simulating document text with `pageBreaks` array — no PDF needed for unit tests.

**Definition of done:** 8+ passing assertions.

---

## Wave 3 — The Viewer (Task 1.5) ⚠️ HIGHEST RISK

### Plan 1.5 — DocumentPane with Click-to-Highlight

#### [NEW] `src/components/DocumentPane.tsx`

This is a **client component** (`"use client"`) that:
1. Renders a PDF using pdfjs canvas + text layer
2. Exposes a `highlightClause(clauseId: string)` method
3. Handles the highlight sweep animation

**Architecture:**

```
DocumentPane (client component, dynamic import with ssr: false)
├── state: currentPage, scale, clauses[], highlightedClauseId
├── useEffect: load PDF from File object via pdfjsLib.getDocument()
├── renders: page canvas + text layer div overlay per visible page
├── exposes: highlightClause(id) via ref (useImperativeHandle) or callback prop
└── sub-components:
    ├── PageRenderer — canvas + text layer for one page
    ├── PageNav — page indicator + zoom controls
    └── highlight logic (see below)
```

**Rendering approach:**
1. Load PDF: `pdfjsLib.getDocument({ data: arrayBuffer })`
2. Set worker: `pdfjsLib.GlobalWorkerOptions.workerSrc = \`//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs\``
3. For each page:
   - Get page: `doc.getPage(pageNum)`
   - Create viewport: `page.getViewport({ scale })`
   - Render canvas: `page.render({ canvasContext, viewport })`
   - Render text layer: `new TextLayer({ textContent, container, viewport })`
4. **Lazy rendering:** Only render visible pages + 1 above/below for scroll performance

**Highlight algorithm (`highlightClause`):**

```
function highlightClause(clauseId: string):
  1. Find clause by id from clauses[]
  2. Scroll to clause.page
  3. Wait for page render to complete
  4. Get the text layer div for that page
  5. Walk all <span> elements in the text layer:
     - Build a running normalised string (collapse whitespace)
     - Find the index of clause.anchor in this normalised string
  6. If found:
     - Identify the span range that covers the anchor text
     - Wrap those spans with <mark class="clause-highlight">
     - Apply the highlight sweep animation (400ms left-to-right wipe via CSS)
  7. If NOT found (fallback):
     - Apply a soft page-level tint to the entire page
     - Still cite the page number
  8. Set aria-live announcement: "Showing clause {id} on page {page}"
```

**The highlight sweep CSS:**
```css
.clause-highlight {
  background-color: var(--marker);
  animation: highlight-sweep 400ms ease-out;
}

@keyframes highlight-sweep {
  from { background-size: 0% 100%; }
  to   { background-size: 100% 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .clause-highlight {
    animation: none;
  }
}
```

**Page controls:**
- Page indicator: "page 14 of 24"
- Zoom in/out buttons with scale state
- Scroll container with overflow-y: auto

**Accessibility:**
- Skip link target for "Skip to findings"
- No keyboard traps in the scroll container
- Focus management: when highlightClause is called, focus moves to the highlighted region
- `aria-live="polite"` region for highlight announcements

**Dynamic import wrapper:**
```tsx
// In the review page:
const DocumentPane = dynamic(() => import('@/components/DocumentPane'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-rule/30 h-full" />
});
```

**Definition of done:** Calling `highlightClause(clauseId)` scrolls and highlights correctly on page 1, a middle page, and the last page. Fallback to page-level highlight when anchor not found.

---

## Wave 4 — Ingest API + Upload UI + Review Page (Task 1.6)

### Plan 1.6 — Ingest API, Session Store, Upload UI, Review Page

#### [NEW] `src/lib/store.ts` — Session Store

```ts
const sessions = new Map<string, Session>();

export function createSession(data: Omit<Session, 'id' | 'createdAt'>): string
  // crypto.randomUUID(), set createdAt = Date.now()
  // sweep() before insert

export function getSession(id: string): Session | null
  // sweep() then get

export function deleteSession(id: string): boolean
  // returns true if found and deleted

function sweep(): void
  // Delete entries older than 30 minutes
  // Run on every request
```

**Rules:**
- Never stores PDF bytes — only extracted text (clauses)
- Never logs session content — only IDs, counts, timings
- `crypto.randomUUID()` for unguessable session IDs

#### [NEW] `src/app/api/ingest/route.ts`

```ts
export async function POST(req: Request): Promise<Response>
```

**Steps:**
1. Rate limit check: 5 uploads/hour per IP (in-memory counter map)
2. Read FormData, get the file
3. Read file as ArrayBuffer
4. Call `parsePdf(buffer)` — handle all error types with user-facing messages
5. Call `segmentClauses(text, pageBreaks)` — produce `Clause[]`
6. Create session with clauses (fields/rubric/findings/vectors empty for now — Phase 2+3 will fill them)
7. Return JSON: `{ sessionId, clauses, pageCount, filename }`

**Error responses (typed, user-facing copy):**
```ts
const ERROR_MESSAGES: Record<PdfError['type'], string> = {
  not_pdf: "This doesn't look like a PDF file. Please upload the PDF version of your agreement.",
  too_large: "This file is over 15 MB. Employment agreements are usually smaller — check if you have a compressed version.",
  too_many_pages: "This document is over 60 pages. Clause Radar is designed for standard employment agreements.",
  scan_detected: "This looks like a scanned image, so there's no text to read. If you have the original PDF from HR, that will work.",
  parse_failed: "We couldn't read this PDF. It may be corrupted or password-protected.",
  timeout: "This document is taking too long to process. Try a smaller file.",
};
```

#### [NEW] `src/app/api/session/[id]/route.ts`

```ts
export async function GET(req, { params }): Promise<Response>
  // Return session data (clauses, findings, concerns, etc.) as JSON
  // 404 if not found or expired

export async function DELETE(req, { params }): Promise<Response>
  // deleteSession(id)
  // 204 if deleted, 404 if not found
```

#### [NEW] `src/lib/upload-context.tsx` — Client-side file context

```tsx
"use client";
// React context to hold the File object across page navigation
// Provides: file, setFile, clearFile
// Used by upload page (set) and review page (read for pdfjs viewer)
```

#### [MODIFY] `src/app/page.tsx` — Upload Page

**Layout:**
- Centered upload zone with drag-and-drop
- Privacy line below: *"Your contract is processed in memory and deleted after 30 minutes. It is never written to a database."*
- Error states rendered inline with the copy from ERROR_MESSAGES
- Processing state with real labels: *"Reading N pages" → "Finding clauses" → redirect*

**Flow:**
1. User drops/selects PDF
2. Read File → validate client-side (type, size)
3. Send FormData to `/api/ingest`
4. Store File in upload context
5. On success: `router.push(\`/review/${sessionId}\`)`
6. On error: show error message inline

#### [NEW] `src/app/review/[sessionId]/page.tsx` — Review Page

**Layout (two-pane):**
```
┌─────────────────────────────────────────────────────────────┐
│  Clause Radar        filename.pdf       expires in 29:42  ⌫ │
├───────────────────────────────┬─────────────────────────────┤
│                               │  Clauses  Risks  Missing  Ask│
│   [ DocumentPane ]            │ ─────────────────────────── │
│                               │  Clause list (clickable)    │
│                               │  c_001 · p.1 · 1. Defini...│
│                               │  c_002 · p.1 · 1.1 Empl... │
│                               │  ...                        │
│                               │                             │
│         page 1 of N           │  Risks: Coming in Phase 2   │
│                               │  Missing: Coming in Phase 3 │
│                               │  Ask: Coming in Phase 2     │
└───────────────────────────────┴─────────────────────────────┘
```

**Components on this page:**
- Header: app name, filename, session timer (countdown from 30 min), Delete now button
- Left: `DocumentPane` (loaded via dynamic import)
- Right: `FindingsPane` with tab bar

**Session timer:**
- Computed from `session.createdAt` vs now
- Counts down in real time (setInterval)
- When expired: shows *"This review expired after 30 minutes, which is how we keep your contract private. Upload it again to continue."*

**Delete now:**
- `DELETE /api/session/[id]` → on success: *"Deleted. The extracted text is gone from the server."* → redirect to `/`

#### [NEW] `src/components/FindingsPane.tsx`

**Day 1 implementation:**
- Tab bar: Clauses (active), Risks, Missing, Ask
- Clauses tab: scrollable list of all clauses
  - Each item: `clause.number || clause.ordinal` · `p.{clause.page}` · first ~80 chars of text
  - Click → calls `onHighlightClause(clause.id)` prop
- Other tabs: placeholder text

**Footer (persistent, quiet):**
*"Clause Radar helps you understand your document. It is not legal advice."*

#### [NEW] `src/app/layout.tsx` — Root layout

- Wrap with `UploadContextProvider`
- Set `lang="en"` on `<html>`
- Meta: title "Clause Radar", description
- Semantic landmarks: `<main>`

---

## Wave 5 — Test Fixture

### Synthetic fixture creation

#### [NEW] `eval/fixtures/test-agreement.txt`

A plain text file (5–10 pages worth of text) with known structure:
- Numbered clauses: 1, 1.1, 2, 2.1, 3, 3.1, 3.2, etc.
- An ALL-CAPS section: `CONFIDENTIALITY AND NON-DISCLOSURE`
- A SCHEDULE: `SCHEDULE A — COMPENSATION`
- Short fragments (under 120 chars) that should merge
- A clause that spans a page boundary
- Known content for testing (notice period of "sixty (60) days", etc.)

This will be converted to PDF manually or via a simple script. The text file is the ground truth source.

---

## Verification Checklist

After all waves complete, verify:

- [ ] `npm run dev` serves the app with design tokens visible
- [ ] `npm run test` — all segment.test.ts assertions pass (8+)
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Upload a PDF → ingest returns sessionId + clauses
- [ ] Navigate to `/review/[sessionId]` → PDF renders in left pane
- [ ] Clause list appears in right pane
- [ ] Click a clause → left pane scrolls to correct page and highlights text
- [ ] Highlight works on page 1, a middle page, and the last page
- [ ] If anchor not found → page-level tint fallback
- [ ] Non-PDF rejected with clear message
- [ ] File > 15MB rejected with clear message
- [ ] Session timer counts down in header
- [ ] Delete removes session and redirects to upload
- [ ] Mobile (< 768px): toggle between document and findings
- [ ] No document text in console logs
- [ ] No TypeScript errors or `any` types

---

## Commit Strategy

One commit per completed wave:
1. `feat: scaffold project with Next.js 15, Tailwind, Vitest, design tokens`
2. `feat: add type definitions from data contracts`
3. `feat: PDF text extraction with validation and page mapping`
4. `feat: deterministic clause segmentation with tests`
5. `feat: PDF viewer with click-to-highlight and sweep animation`
6. `feat: ingest API, session store, upload UI, review page`
