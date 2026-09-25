# Phase 4 — PLAN.md: Score and Ship

## Phase Goal
Ship the candidate action surfaces (`/api/explain` plain-language rewrites, `/api/act` negotiation email and lawyer questions), provide privacy controls (F11 "Delete My Document"), resolve Phase 3 code review findings, and ensure accessible, grounded production readiness.

**Tracer slice:** User views flagged clause $\rightarrow$ clicks "Plain English" toggle to view verified plain explanation with preserved numbers $\rightarrow$ opens "Take Action" modal from Risk Dashboard $\rightarrow$ generates editable candidate email to HR citing clause numbers and 5 focused questions for a lawyer $\rightarrow$ 1-click copies generated action copy $\rightarrow$ clicks "Delete Document" in header to purge server session and return cleanly home.

---

## Wave 1 — Foundation & Privacy Infrastructure (Tasks 4.1, 4.2)

### Plan 4.1 — Phase 3 Review Carry-overs: Strict Typing & Background Embeddings
- **Files:** `src/lib/rules.ts`, `src/lib/rubric.ts`, `src/lib/embed.ts`, `src/app/api/ingest/route.ts`
- **Actions:**
  1. Eliminate all explicit `any` types in `src/lib/rules.ts` and `src/lib/rubric.ts` per AGENTS.md rule. Use typed record access, unknown guards, and `ExtractedField<unknown>`.
  2. In `src/lib/embed.ts`, optimize `embedTexts` with concurrency batching (`Promise.all` in chunks of 5) rather than serial iteration.
  3. In `src/app/api/ingest/route.ts`, run `embedTexts` asynchronously in the background. Once clause vectors are generated, re-run `matchRubric(clauses, RUBRIC_ITEMS, precomputedVectors, clauseVectors)` and update the session in `store.ts`.

### Plan 4.2 — Session Deletion (F11 "Delete My Document")
- **Files:** `src/lib/store.ts`, `src/app/api/session/[sessionId]/route.ts`
- **Actions:**
  1. Add `deleteSession(sessionId: string): boolean` to `src/lib/store.ts`.
  2. Implement `DELETE` route handler in `src/app/api/session/[sessionId]/route.ts` returning `{ success: true, message: "Document deleted from server memory" }`.
  3. Subsequent `GET /api/session/[sessionId]` requests return 404.
  4. Unit test `deleteSession` in `src/lib/store.test.ts`.

---

## Wave 2 — Pure Engines & API Routes (Tasks 4.3, 4.4)

### Plan 4.3 — Plain-Language Rewrite Engine (`/api/explain`, Prompt P3)
- **Files:** `src/lib/explain.ts`, `src/lib/explain.test.ts`, `src/app/api/explain/route.ts`
- **Actions:**
  1. Create pure function `explainClause(clause: Clause, apiKey?: string): Promise<{ text: string; verified: boolean; fallback: boolean }>`:
     - Prompt P3 (temperature 0): Explain in 2–4 sentences for a candidate without legal training. Keep every number, duration, amount, and party name.
     - Verification: Extracts all digits/numbers from explanation and verifies they exist in source clause text.
     - Fallback: If verification fails or model unavailable, safely returns original text with `fallback: true`.
  2. Route handler `POST /api/explain`:
     - Accepts `{ sessionId: string, clauseId: string }`.
     - Validates session and clause existence.
     - Returns `{ text: string, verified: boolean, clauseId: string }`.
  3. Pure unit tests in `src/lib/explain.test.ts`.

### Plan 4.4 — Candidate Action Generation (`/api/act`, Prompts P5 & P6)
- **Files:** `src/lib/act.ts`, `src/lib/act.test.ts`, `src/app/api/act/route.ts`
- **Actions:**
  1. Create `src/lib/act.ts`:
     - `generateNegotiationEmail(findings: Finding[], concerns: Concern[], clauses: Clause[]): Promise<string>`
       - Prompt P5 (temperature 0.4): Short polite email to HR, under 200 words, references clause numbers (§), asks questions/alternatives, affirms enthusiasm for the role.
     - `generateLawyerQuestions(findings: Finding[], clauses: Clause[]): Promise<string[]>`
       - Prompt P6 (temperature 0.4): Exactly 5 sharp questions referencing clause citations from active risk findings.
     - Fallback template generator if `GEMINI_API_KEY` is unset or fails, using static structured finding data.
  2. Route handler `POST /api/act`:
     - Accepts `{ sessionId: string, type: "email" | "questions", selectedConcerns?: Concern[] }`.
     - Returns `{ content: string | string[], type: "email" | "questions" }`.
  3. Pure unit tests in `src/lib/act.test.ts`.

---

## Wave 3 — UI Surfaces & Polish (Tasks 4.5, 4.6, 4.7)

### Plan 4.5 — Per-Clause Plain-English Toggle in Document View
- **Files:** `src/components/DocumentPane.tsx` or clause inspection header
- **Actions:**
  1. Add an "As written" vs "In plain English" toggle button when inspecting a clause.
  2. On toggle, fetch `/api/explain` and cache result in client memory.
  3. Render simplified text with a subtle "Plain English" badge and grounding indicator.

### Plan 4.6 — "Take Action" Modal & "Delete Document" Button
- **Files:** `src/components/TakeActionModal.tsx`, `src/components/RiskDashboard.tsx`, `src/app/review/[sessionId]/page.tsx`
- **Actions:**
  1. Build `TakeActionModal.tsx`:
     - Accessible modal dialog (`role="dialog"`, escape key listener, focus trap).
     - Two tabs: **HR Negotiation Email** (editable textarea, copy button) and **Questions for Lawyer** (5 cited questions, copy button).
     - Visual copy confirmation feedback ("Copied to clipboard!").
  2. Add primary **"Take Action"** trigger button on `RiskDashboard` header and top navigation bar.
  3. Add **"Delete Document"** button in top header:
     - Confirmation modal/dialog.
     - Calls `DELETE /api/session/[sessionId]`.
     - Displays confirmation toast: *"Deleted. The extracted text is gone from the server."*
     - Navigates back to `/`.

### Plan 4.7 — Accessibility & Eval Verification
- **Files:** `src/components/FindingsPane.tsx`, `eval/rubric-eval.test.ts`
- **Actions:**
  1. Add missing ARIA tab controls (`aria-controls`, `role="tabpanel"`) identified in CR-05.
  2. Run `npm run test:run` ensuring all unit and integration tests pass.
  3. Verify keyboard reachability, color contrast, and screen reader labels per `08-ACCESSIBILITY.md`.
