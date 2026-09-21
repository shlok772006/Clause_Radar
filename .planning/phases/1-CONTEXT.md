# Phase 1 — CONTEXT.md

## Phase: The Spine (Day 1)
## Status: Decisions gathered, ready for planning

---

## Objective

PDF uploads → becomes clauses → renders in left pane → clicking a clause ID highlights on the correct page.

**Tasks covered:** 1.1 through 1.6

---

## Decisions

### D1.1 — pdfjs-dist version and worker strategy
**Decision:** Use `pdfjs-dist` v4.x with a **CDN-hosted worker** from Mozilla's CDN.
**Rationale:** Avoids webpack worker bundling complexity in Next.js 15. The worker URL is set via `pdfjs.GlobalWorkerOptions.workerSrc` pointing to the unpkg/cdnjs hosted version matching the installed pdfjs-dist version.
**Impact:** No custom webpack config needed in `next.config.js` for the worker. CSP must allow the CDN domain in `worker-src`.

### D1.2 — PDF upload flow
**Decision:** Client reads the `File` into an `ArrayBuffer`, sends it to `/api/ingest` as `FormData`. Server extracts text via pdfjs and returns `sessionId` + `Clause[]`. Client **keeps the original File object in memory** (React state / context) for the pdfjs viewer — no re-download needed.
**Rationale:** PDF bytes never touch the server's filesystem. Server only stores extracted text in the session. Client has the bytes for rendering without a second network trip.
**Impact:**
- The `File` object must survive navigation from `/` to `/review/[id]`. Use a client-side context or store (NOT localStorage — AGENTS.md forbids storing document content there).
- The ingest API returns JSON (sessionId, clauses, metadata), NOT the PDF bytes.
- If the user hard-refreshes `/review/[id]`, the File is lost → show "session expired, re-upload" message.

### D1.3 — Review page data loading
**Decision:** Client-side fetch. The `/review/[sessionId]` page is a **client component** that calls `GET /api/session/[id]` on mount to load clauses + findings as JSON.
**Rationale:** The in-memory `Map` store is server-side only. A server component could read from it directly, but client components are needed anyway for the interactive PDF viewer and highlighting. Client fetch is simpler and cleaner.
**Impact:**
- Need a `GET /api/session/[id]` route handler that returns session data (clauses, findings, concerns, etc.) — same route used for `DELETE`.
- Loading state needed on the review page while data is fetched.
- 404 handling if session expired or doesn't exist.

### D1.4 — Responsive layout
**Decision:** Tailwind `md:` breakpoint (768px). Below that, switch to a **two-state toggle** between Document and Findings views. "Show me in the document" automatically switches to the Document pane and highlights.
**Rationale:** Matches the design direction doc's mobile guidance. md: is the standard tablet/desktop breakpoint.
**Impact:**
- Desktop (≥768px): side-by-side two-pane layout.
- Mobile (<768px): toggle UI at the top (Document / Findings), only one pane visible at a time.
- `highlightClause()` on mobile must: switch to Document pane → scroll → highlight.

### D1.5 — Day 1 right pane scope
**Decision:** Show a **clause list** in the right pane — all segmented clauses as clickable items that trigger highlighting. The tab structure (Risks / Missing / Ask) is present but Risks and Missing show placeholder text, Ask shows placeholder. The clause list lives under a "Clauses" heading above the tabs or as a default view.
**Rationale:** Gives us something interactive and testable on Day 1 without needing Phase 2–3 data. Clicking a clause → highlight tests the entire highlighting pipeline end-to-end.
**Impact:**
- `FindingsPane.tsx` is created on Day 1 with a clause list view.
- Tab navigation is built but Risks/Missing/Ask content is stubbed.
- Clause list items show: clause number (or ordinal), first ~80 chars of text, page number.
- Clicking a clause calls `highlightClause(clauseId)` on the DocumentPane.

### D1.6 — Test fixture
**Decision:** Create a **short synthetic test PDF** (5–10 pages) with known clause structure. Include: numbered headings (decimal: 1, 1.1, 1.1.1), an ALL-CAPS section heading, a SCHEDULE annexure, short paragraphs that should merge, and a page boundary mid-clause.
**Rationale:** Ground truth is controlled — we know exactly which clauses should be produced, which pages they're on, and which anchors to expect. Essential for deterministic segment.test.ts assertions.
**Impact:**
- Create `eval/fixtures/test-fixture.pdf` (or generate from a .txt via a script).
- segment.test.ts assertions are written against this known structure.
- This is NOT one of the three eval fixtures (A/B/C) from the eval plan — those come on Day 3–4.

---

## Deferred Decisions (Not Phase 1)

- Gemini model version → Phase 2 (when model calls start)
- Prompt templates → Phase 2
- Eval fixture creation (A/B/C) → Phase 3–4
- Cloud Run deployment config → Phase 4
- Translation/TTS provider → Phase 4

---

## Codebase Scout (Reusable Assets)

**Current state:** No application code exists. Greenfield.

**Assets from docs to use directly:**
- `03-DATA-CONTRACTS.md` → copy types verbatim into `lib/types.ts`
- `09-DESIGN-DIRECTION.md` → design tokens into `globals.css`
- `02-ARCHITECTURE.md` → file tree structure to scaffold

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| pdfjs text layer anchor matching fails | HIGH | Fallback to page-level tint. Budget 4 hours for Task 1.5. |
| pdfjs worker loading fails in Next.js | MEDIUM | CDN worker avoids bundling. Fallback: copy worker to public/ |
| File object lost on navigation | LOW | Client context persists across route. Hard refresh → re-upload prompt. |
| Segmentation produces bad clauses | MEDIUM | 8+ test assertions. Manual visual check on fixture. |

---

## Next Step

```
/gsd:plan-phase 1
```

Produce the detailed PLAN.md with file-level implementation for Tasks 1.1–1.6.
