# Phase 5: Prove It — User Acceptance Testing (UAT)

**Status:** Completed (Passed)  
**Completed:** 2026-09-25  

## Test Matrix

| # | Test Scenario | Expected Result | Status |
|---|---------------|-----------------|--------|
| 1 | Eval Benchmark Harness (`npm run eval`) | Running `npm run eval` executes the test suite in `eval/run.test.ts`, parsing the Indian standard employment agreement fixture and evaluating 10 structured benchmark questions. | Passed |
| 2 | Abstention Rate (Unanswerable Questions) | All 5 unanswerable questions (equity/options, travel allowance, remote stipend, bonus clawback, severance multiplier) return `status: "insufficient_evidence"` with 100% abstention (target: 100%). | Passed |
| 3 | Citation Precision | All answerable questions cite the exact matching clause numbers (§8.1, §9.1, §9.2, §7.1, §6.1), achieving 100% citation precision (target: ≥ 95%). | Passed |
| 4 | Value Accuracy | Every cited claim accurately captures the verified duration/amount from the source text (e.g. 30 days, 24 months, 12 months, 15 days), achieving 100% value accuracy (target: ≥ 90%). | Passed |
| 5 | False Refusal Rate | None of the answerable questions are refused (0% false refusal rate; target: ≤ 10%). | Passed |
| 6 | 20-Clause Rubric Accuracy | Audit scorecard accurately matches fixture ground truth (9 present, 1 unclear, 10 missing) with 95% accuracy (target: ≥ 85%). | Passed |
| 7 | Verifier Catch Count & Discard Integrity | Grounding verifier (`src/lib/verify.ts`) catches and destroys 5 ungrounded candidate claims that fail quote normalization or number containment before reaching UI. | Passed |
| 8 | Automated Results Artifact (`eval/results.md`) | Benchmark harness writes a clean, formatted markdown scorecard artifact to `eval/results.md`. | Passed |
| 9 | Submission-Ready `README.md` | `README.md` follows `docs/11-DEMO-AND-SUBMISSION.md` with pitch, measured benchmark scorecard, 10 Grounding Invariants, Architecture, Video Demo shot list (under 40 clicks), and local run commands. | Passed |
| 10 | Strict Quality Gates | TypeScript: 0 errors (`npx tsc --noEmit`); ESLint: 0 errors, 0 warnings (`npx eslint src`); Vitest: 61/61 tests passing across 13 test suites; Production build compiles cleanly. | Passed |

## Session Log

- Verified `npm run eval` end-to-end against `eval/fixtures/test-agreement.pdf` and `eval/questions.json`.
- Confirmed 100% abstention on unanswerable questions, 100% citation precision, 100% value accuracy, 0% false refusal, and 95% rubric accuracy.
- Confirmed `eval/results.md` generated cleanly.
- Updated root `README.md` with live measured scorecard and submission guide.
- All 13 test suites (61 tests) pass with zero errors. All quality gates met.
