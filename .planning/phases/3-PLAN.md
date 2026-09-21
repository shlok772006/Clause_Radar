# Phase 3 — PLAN.md: The Differentiator

## Phase Goal
Ship the missing-clause report and risk dashboard, dynamically ranked by user concerns. Evaluate 20 standard Indian employment agreement clauses (missing clause rubric) and 14 legal risk rules with clause citations.

**Tracer slice:** Document uploads $\rightarrow$ P1 fields extracted $\rightarrow$ rubric matches clauses against 20 standard items $\rightarrow$ 14 risk rules evaluated $\rightarrow$ Risks tab displays high/medium/low findings with evidence quotes and "Show me" buttons $\rightarrow$ Missing tab audits all 20 clauses with "Why it matters" and "If missing ask" $\rightarrow$ clicking a Concern pill dynamically re-ranks findings to the top.

---

## Wave 1 — Domain Configuration & Rubric Vectors (Tasks 3.1, 3.2)

### Plan 3.1 — Domain Configuration Files

#### [NEW] `config/clause-rubric.yaml`
- Copied **verbatim** from `docs/05-DOMAIN-CONFIG.md`.
- 20 standard clauses with `id`, `label`, `concern`, `severityIfMissing`, `whyItMatters`, `ifMissingAsk`, `queries`, and `keywords`.

#### [NEW] `config/risk-rules.yaml`
- Copied **verbatim** from `docs/05-DOMAIN-CONFIG.md`.
- 14 risk rules with `id`, `when`, `severity`, `concern`, `title`, `explanation`, `benchmark`, `legalNote`, `suggestedQuestion`, and `evidenceFrom`.

---

### Plan 3.2 — Precomputed Rubric Vectors

#### [NEW] `scripts/build-vectors.ts`
- Node script using `@google/generative-ai` (`text-embedding-004`) to generate embeddings for all `queries` in `config/clause-rubric.yaml`.
- Outputs `config/rubric-vectors.json` as a map of `{ [itemId: string]: number[][] }`.

#### [NEW] `config/rubric-vectors.json`
- Precomputed embeddings file checked into git so tests and builds run fast without requiring runtime embedding generation for the static rubric.

---

## Wave 2 — Pure Engines: Rubric & Rules (Tasks 3.3, 3.4)

### Plan 3.3 — Rubric Matching Engine

#### [NEW] `src/lib/embed.ts`
- Pure math: `cosineSimilarity(a: number[], b: number[]): number`.
- Runtime clause embedding caller using Gemini `text-embedding-004` (with graceful fallback).

#### [NEW] `src/lib/rubric.ts`
- Pure function:
  ```ts
  export function matchRubric(
    clauses: Clause[],
    rubricItems: RubricItem[],
    precomputedVectors?: Record<string, number[][]>,
    clauseVectors?: number[][]
  ): RubricResult[]
  ```
- Matching strategy:
  1. Computes max cosine similarity between clause embeddings and precomputed rubric queries.
  2. If embeddings unavailable or error, falls back to deterministic keyword matching (`method: "keyword"`).
  3. Threshold classification:
     - `score >= 0.62` $\rightarrow$ `presence: "present"`
     - `0.50 <= score < 0.62` $\rightarrow$ `presence: "unclear"`
     - `score < 0.50` $\rightarrow$ `presence: "missing"`
  4. Identifies `bestClauseId` for citations.

#### [NEW] `src/lib/rubric.test.ts`
- Unit tests covering:
  - Score above threshold $\rightarrow$ `present`.
  - Score in middle band $\rightarrow$ `unclear`.
  - Score below threshold $\rightarrow$ `missing`.
  - Keyword fallback path when vectors are absent (`method: "keyword"`).

---

### Plan 3.4 — Risk Rules Engine

#### [NEW] `src/lib/rules.ts`
- Pure function:
  ```ts
  export function evaluateRules(
    fields: VerifiedFields,
    clauses: Clause[],
    rules: RiskRuleConfig[]
  ): Finding[]
  ```
- Mini expression evaluator for `when` conditions:
  - Supports comparisons: `>`, `<`, `==`, `!=`, `and`.
  - Field value lookup: e.g. `noticePeriodEmployee.value > 90`.
- **Mandatory Evidence Rule (AGENTS.md Rule 5):**
  - A rule ONLY fires if attachable evidence with a valid `clauseId` and verbatim `quote` exists in `fields` or `clauses`.
  - If evidence is missing, the finding is discarded.
- Asymmetric notice rule:
  - Fails to fire if `noticePeriodEmployer.value == noticePeriodEmployee.value`.
- String interpolation:
  - Replaces `{fieldName.value}` tokens in `title` and `explanation` with actual values.

#### [NEW] `src/lib/rules.test.ts`
- Unit tests covering:
  - Long notice rule firing when notice > 90 days.
  - Asymmetric notice rule firing only when notice periods differ, and NOT firing when equal.
  - Bond penalty rule attaching evidence from bond clause.
  - **Rule with no attachable evidence does NOT fire.**
  - String interpolation of values in titles and explanations.

---

## Wave 3 — UI Components & Dynamic Concern Ranking (Tasks 3.5, 3.6)

### Plan 3.5 — Dynamic Concern Picker

#### [NEW] `src/components/ConcernPicker.tsx`
- Renders 6 concern toggle pills with active indicator:
  - `exit`, `lockin`, `future_work`, `pay`, `ip`, `termination`.
- Allows toggling multiple concerns.
- Re-ranks findings and rubric results dynamically.

---

### Plan 3.6 — Risk Dashboard & Missing Report

#### [NEW] `src/components/RiskDashboard.tsx`
- Renders all active `Finding` items sorted by:
  1. User concern match
  2. Severity (`high` $\rightarrow$ `medium` $\rightarrow$ `low` $\rightarrow$ `info`)
- Each card shows:
  - Severity pill (`high`: `#B3402E`, `medium`, `low`, `info`)
  - Interpolated title & explanation
  - Legal Note (e.g. Section 27, Indian Contract Act) with *"Confirm with a professional"* callout
  - Benchmark pill (e.g. *"Common range in Indian tech roles: 30–90 days"*)
  - Evidence quote box with *"Show me"* button linked to `DocumentPane.highlightClause`
  - Suggested Question for negotiation

#### [NEW] `src/components/MissingReport.tsx`
- Summary scorecard: e.g. `14 Present · 2 Unclear · 4 Missing`.
- 20-item checklist grouped by concern or status:
  - Badge: `Present` (green), `Unclear` (amber), `Missing` (gray/red).
  - "Why it matters" explanation copy.
  - "If missing ask" negotiation question.
  - If present: *"Show me"* button jumping to `bestClauseId` in `DocumentPane`.

#### [MODIFY] `src/components/FindingsPane.tsx`
- Wire `ConcernPicker`, `RiskDashboard`, and `MissingReport` to replace placeholder screens in "Risks" and "Missing" tabs.

---

## Wave 4 — Pipeline Integration & End-to-End Verification (Tasks 3.7, 3.8)

### Plan 3.7 — Ingest & Session Store Pipeline Extension

#### [MODIFY] `src/app/api/ingest/route.ts` & `src/lib/store.ts`
- Parse `config/clause-rubric.yaml` and `config/risk-rules.yaml`.
- Execute `matchRubric(clauses, rubricItems)` and `evaluateRules(fields, clauses, rules)` during ingest.
- Store results in `session.rubric` and `session.findings`.
- Return complete analysis in session response.

---

### Plan 3.8 — End-to-End Evaluation Tests

#### [NEW] `eval/rubric-eval.test.ts`
- Tests synthetic agreement fixtures against the 20-item rubric and 14 risk rules:
  - Verifies presence of compensation, notice, and bond clauses.
  - Verifies missing clauses (e.g. equity, severance).
  - Confirms citation precision and zero ungrounded findings.

---

## Verification Checklist

- [ ] `config/clause-rubric.yaml` has exactly 20 items
- [ ] `config/risk-rules.yaml` has exactly 14 rules
- [ ] `npm run test:run` passes `rubric.test.ts` and `rules.test.ts`
- [ ] Risk rules with no attachable evidence do NOT fire
- [ ] Asymmetric notice rule does not fire when notice periods are equal
- [ ] "Risks" tab displays active findings with severity badges and "Show me" buttons
- [ ] "Missing" tab audits 20 clauses with "Why it matters" and "If missing ask"
- [ ] Toggling concern pills immediately re-ranks findings matching that concern to the top
- [ ] Clicking "Show me" on any risk or present clause highlights text in `DocumentPane`
- [ ] `npx tsc --noEmit` and `npm run build` pass with 0 errors

---

## Commit Strategy

1. `feat: domain configuration for clause rubric and risk rules`
2. `feat: in-memory cosine embedding matcher and rubric engine with tests`
3. `feat: pure risk rules engine with strict evidence requirement and tests`
4. `feat: ConcernPicker, RiskDashboard, and MissingReport UI components`
5. `feat: wire rubric audit and risk engine into ingest pipeline and review page`
