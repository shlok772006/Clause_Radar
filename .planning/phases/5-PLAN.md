# Phase 5 — PLAN.md: Prove It

## Phase Goal
Deliver the automated evaluation benchmark harness (`eval/run.ts`), wire `npm run eval`, execute live evaluation on agreement fixtures, record live accuracy metrics into `eval/results.md`, and produce the submission-ready `README.md` per `docs/11-DEMO-AND-SUBMISSION.md`.

**Tracer slice:** Run `npm run eval` in terminal $\rightarrow$ `eval/run.ts` parses `eval/fixtures/test-agreement.pdf` $\rightarrow$ evaluates 10 questions from `eval/questions.json` $\rightarrow$ calculates Abstention Rate, Citation Precision, Value Accuracy, Rubric Accuracy, and Verifier Catch Count $\rightarrow$ outputs formatted benchmark table to stdout and writes `eval/results.md` $\rightarrow$ updates `README.md` with live benchmark table and submission script.

---

## Wave 1 — Eval Benchmark Harness (Tasks 5.1, 5.2)

### Plan 5.1 — Implement `eval/run.ts` and Wire `package.json`
- **Files:** `eval/run.ts`, `package.json`
- **Actions:**
  1. Add `"eval": "tsx eval/run.ts"` to `package.json` scripts (installing `tsx` devDependency if not present).
  2. Implement `eval/run.ts`:
     - Loads `eval/fixtures/test-agreement.pdf` and parses via `parsePdf` and `segmentClauses`.
     - Loads `eval/questions.json` (10 test cases: 5 answerable, 5 unanswerable).
     - For each question:
       - Runs `askQuestion(question, clauses, precomputedVectors)`.
       - For answerable: verifies clause citation match (`expectedClauseNumber`) and value containment (`expectedValue`).
       - For unanswerable: verifies `status === 'insufficient_evidence'` (100% target).
       - Accumulates `discardedCount` from answer envelopes.
     - Runs 20-clause rubric audit and verifies rubric accuracy against fixture ground truth.
     - Outputs benchmark summary table to stdout:
       - Abstention rate (target: 100%)
       - Citation precision (target: ≥ 95%)
       - Value accuracy (target: ≥ 90%)
       - False refusal rate (target: ≤ 10%)
       - Rubric accuracy (target: ≥ 85%)
       - Verifier discarded claims count.
     - Writes `eval/results.md`.

### Plan 5.2 — Execute & Verify Benchmark
- **Actions:**
  1. Run `npm run eval` in terminal.
  2. Verify all thresholds pass and `eval/results.md` is generated.
  3. Ensure zero unhandled promise rejections or crashes.

---

## Wave 2 — Submission Documentation & Closure (Tasks 5.3, 5.4)

### Plan 5.3 — Submission-Ready `README.md`
- **Files:** `README.md`
- **Actions:**
  1. Rewrite `README.md` using the complete structure from `docs/11-DEMO-AND-SUBMISSION.md`:
     - Headline & pitch ("Understand your employment contract — what it says, where it says it, and what it leaves out").
     - The problem & "Why not just use a general-purpose assistant?".
     - Live measured evaluation table (copied verbatim from `eval/results.md`).
     - The 10 Invariants (hard rules: grounding, citations, zero-db privacy, injection scanner).
     - Architecture & stack overview.
     - Video demo shot list (under 40 clicks).
     - How to run locally and run tests (`npm run test:run`, `npm run eval`).

### Plan 5.4 — Final Verification & Milestone Closure
- **Files:** `.planning/STATE.md`
- **Actions:**
  1. Run full test suite `npm run test:run` (confirm 60/60 tests pass).
  2. Run `npm run lint` and `npx tsc --noEmit` (confirm 0 errors).
  3. Update `STATE.md` marking Milestone 1.0 complete with all 5 phases passed.
