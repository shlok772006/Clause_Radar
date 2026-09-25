# Phase 4 — CONTEXT.md: Score and Ship

## Goal
Implement candidate action features (`/api/explain` plain-language rewrites, `/api/act` negotiation email and lawyer questions), document deletion privacy controls (F11), resolve Phase 3 code review carry-overs, and finalize production readiness.

---

## Decisions Locked

### 1. Plain-Language Rewrite (`/api/explain`, Prompt P3)
- **Endpoint:** `POST /api/explain` accepting `{ sessionId, clauseId }`.
- **Model & Temp:** Gemini 2.5 Flash with `temperature: 0`.
- **Prompt:** Standard P3 prompt from `docs/04-PROMPT-STRATEGY.md` (no legal jargon, keep numbers/durations/party names, 2–4 sentences).
- **Verification Rule:** Verifier confirms that every numeric token and duration in the rewrite appears verbatim in the source clause text. If unverified, falls back safely to original text with a warning badge.
- **UI:** A toggle on the selected clause: `"Original"` vs `"Plain English"`, with client-side caching so toggling is instant after first fetch.

### 2. Take Action Surface (`/api/act`, Prompts P5 & P6)
- **UI Placement:** A primary `"Take Action"` button in the `RiskDashboard` and review header opening an interactive modal/drawer.
- **Tab 1 — Candidate Negotiation Email (Prompt P5):**
  - Synthesizes active findings and selected concerns into a polite, professional email to HR.
  - Constraints: References clause numbers, under 200 words, asks questions/proposes alternatives, expresses enthusiasm for the role.
  - Interactive: Fully editable textarea with a 1-click `"Copy Email"` button.
- **Tab 2 — Questions for Lawyer / Professional (Prompt P6):**
  - Generates 5 specific, high-leverage legal questions derived directly from the contract's high/medium risk findings.
  - Each question cites the relevant clause (§ number).
  - Includes a 1-click `"Copy Questions"` button.

### 3. "Delete My Document" (F11)
- **Endpoint:** `DELETE /api/session/[id]`.
- **Behavior:** Removes session and all extracted clauses/vectors from the server-side in-memory `store.ts`. Subsequent requests return 404.
- **UX:** Prominent button in the document header. Confirms with the user, displays `"Deleted. The extracted text is gone from the server."`, and clears client state before redirecting to `/`.

### 4. Phase 3 Code Review Carry-over Fixes
- **CR-01 (Background Vector Embeddings):** In `src/app/api/ingest/route.ts`, trigger `embedTexts` asynchronously in the background. Once clause embeddings are calculated, re-run `matchRubric` in vector mode and update the session in `store.ts`.
- **CR-02 (Strict TypeScript):** Eliminate all explicit `any` types in `src/lib/rules.ts` and `src/lib/rubric.ts`.

---

## Out of Scope / Deferred
- **F9 Regional Language & TTS:** Kept deferred/cut per PRD P2 prioritization to maximize score on core grounding, action workflows, and deployment.
- **PDF Export of Report:** Plain text and copy-to-clipboard prioritized over client-side PDF generation.

---

## Downstream Guidance for Planning (`4-PLAN.md`)
- Downstream planner should split Phase 4 into 3 clean waves:
  1. **Wave 1:** Phase 3 cleanups (background embedding update & strict typing) + F11 Session Deletion endpoint.
  2. **Wave 2:** `/api/explain` (P3) + `/api/act` (P5, P6) endpoints with verifier tests.
  3. **Wave 3:** UI components: Clause Plain-English Toggle + Take Action Modal (Email & Lawyer Questions) + Header Delete button.
