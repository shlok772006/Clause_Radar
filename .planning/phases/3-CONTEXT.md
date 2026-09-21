# Phase 3 — CONTEXT.md: The Differentiator

## Phase Goal
Ship the missing-clause report and risk dashboard, ranked dynamically by user concerns. This is the core differentiator of Clause Radar — auditing agreements against standard Indian employment terms and evaluating 14 legal risk rules with clause citations.

---

## Locked Decisions (From PRD & Domain Config)

1. **Domain Config is Data, Not Code:**
   - Copy `config/clause-rubric.yaml` and `config/risk-rules.yaml` verbatim from `docs/05-DOMAIN-CONFIG.md`.
   - Never hardcode rules or rubric items in code or components.
   - 20 rubric items covering standard employment clauses.
   - 14 risk rules with severity, conditions, explanations, benchmarks, and legal context notes.

2. **Rules Fire ONLY with Evidence:**
   - AGENTS.md rule 5: A risk finding that cannot point to a clause does not exist.
   - Every `Finding` must have a non-empty `evidence` array with valid `clauseId`, `quote`, and `page`.
   - The asymmetric notice rule does not fire if employee and employer notice periods are equal.

3. **In-Memory Matching with Fallback:**
   - No vector database. In-memory cosine similarity over arrays.
   - Precompute embeddings for rubric queries via `scripts/build-vectors.ts` (`text-embedding-004`) saved to `config/rubric-vectors.json`.
   - Automatic deterministic keyword search fallback if embeddings are unavailable or during test runs.

---

## Discussed & Confirmed Decisions

### 1. Vector & Rubric Matching Strategy
- Precompute rubric vectors in `config/rubric-vectors.json`.
- At runtime, embed document clauses or compute keyword scores.
- Thresholds:
  - `score >= 0.62` $\rightarrow$ `present`
  - `0.50 <= score < 0.62` $\rightarrow$ `unclear`
  - `score < 0.50` $\rightarrow$ `missing`

### 2. User Concern Ranking
- 6 standard concerns from `src/lib/types.ts`:
  - `exit`: Leaving the job
  - `lockin`: Being locked in
  - `future_work`: My next job and side work
  - `pay`: Pay and benefits
  - `ip`: Who owns what I build
  - `termination`: Being let go
- Interactive pills rendered at the top of FindingsPane tabs allowing users to toggle their primary concerns.
- Re-ranks both Risks and Missing reports dynamically:
  1. Matched user concerns first
  2. Severity (`high` $\rightarrow$ `medium` $\rightarrow$ `low` $\rightarrow$ `info`)
  3. Score / confidence

### 3. Pipeline Integration
- Run rubric audit and risk rule evaluation eagerly during document ingest / review initialization so that the "Risks" and "Missing" tabs are fully populated and interactive immediately.

### 4. Legal Context & Disclaimer Display
- High severity risks (e.g. non-compete restrictions referencing Section 27, Indian Contract Act 1872) render an authoritative legal context note alongside *"Confirm this with a professional"*.
- Every risk card and missing item carries a "Show me" citation link to `DocumentPane`.

---

## Downstream Deliverables

- `config/clause-rubric.yaml` & `config/risk-rules.yaml`: Domain config files.
- `scripts/build-vectors.ts` & `config/rubric-vectors.json`: Rubric embeddings precomputed.
- `src/lib/embed.ts`: Cosine similarity and embedding caller.
- `src/lib/rubric.ts` & `src/lib/rubric.test.ts`: Pure rubric matcher with keyword fallback.
- `src/lib/rules.ts` & `src/lib/rules.test.ts`: Pure risk rules evaluator with evidence attachment.
- `src/components/ConcernPicker.tsx`: Dynamic concern filter pills.
- `src/components/RiskDashboard.tsx`: Interactive risk cards with citations and legal notes.
- `src/components/MissingReport.tsx`: 20-clause audit dashboard with "Why it matters" and "If missing ask" scripts.
- Review page wiring: Eager execution on ingest and real data bound to tabs.
