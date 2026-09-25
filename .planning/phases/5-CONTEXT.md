# Phase 5 — CONTEXT.md: Prove It

## Goal
Build the automated eval runner (`eval/run.ts`), wire `npm run eval`, measure and print the live benchmark accuracy metrics table (Abstention rate, Citation precision, Value accuracy, Rubric accuracy, Verifier catch count), and produce the submission-ready `README.md` per `docs/11-DEMO-AND-SUBMISSION.md`.

---

## Decisions Locked

### 1. Eval Benchmark Runner (`eval/run.ts` & `npm run eval`)
- **Script:** `eval/run.ts` executable via `npm run eval`.
- **Inputs:** `eval/fixtures/test-agreement.pdf` and the 10 answerable + unanswerable test questions in `eval/questions.json`.
- **Execution:**
  - Ingests test PDF using `parsePdf` and `segmentClauses`.
  - Runs rubric evaluation and risk rules evaluation.
  - Queries Q&A engine (`askQuestion`) for each question in `eval/questions.json`.
  - Tracks grounding verifier discarded claims count.
- **Metrics Calculated:**
  - **Abstention Rate:** Unanswerable questions where `status == "insufficient_evidence"` (Target: 100%).
  - **Citation Precision:** Cited clauses matching expected clause (Target: ≥ 95%).
  - **Value Accuracy:** Verified answers containing expected value (Target: ≥ 90%).
  - **False Refusal Rate:** Answerable questions falsely refused (Target: ≤ 10%).
  - **Rubric Accuracy:** Rubric items matching ground truth (Target: ≥ 85%).
  - **Verifier Discard Count:** Total ungrounded claims intercepted and discarded by `lib/verify.ts`.
- **Outputs:**
  - Formatted terminal table printed to stdout.
  - Generates `eval/results.md` artifact with benchmark metrics.

### 2. Submission-Ready `README.md`
- Updates project `README.md` using the exact structure and copy from `docs/11-DEMO-AND-SUBMISSION.md`:
  - Problem statement & "Why not just use a general-purpose assistant?"
  - Live measured eval benchmark table pasted verbatim from `eval/results.md`.
  - The 10 Invariants (hard rules: grounding before assertion, prompt injection defense, no database, no logged doc text).
  - Architecture diagram and stack summary.
  - Demo video script & shot list (under 40 clicks).

### 3. Out of Scope
- No further UI features — product scope is frozen.
- Video recording itself is manual; guidance and shot list provided.
