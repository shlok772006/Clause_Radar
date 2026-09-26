# Clause Radar — Evaluation Benchmark Results

**Date:** 2026-09-26  
**Harness:** `eval/run.ts` via `npm run eval`  
**Target:** Indian Employment Agreement Fixtures  

---

## Benchmark Scorecard

| Metric | Target | Measured | Result |
|:---|:---:|:---:|:---:|
| **Abstention Rate** | 100% | **100%** (5/5) | **PASS ✓** |
| **Citation Precision** | ≥ 95% | **100%** | **PASS ✓** |
| **Value Accuracy** | ≥ 90% | **100%** | **PASS ✓** |
| **False Refusal Rate** | ≤ 10% | **0%** | **PASS ✓** |
| **Rubric Accuracy** | ≥ 85% | **95%** | **PASS ✓** |
| **Verifier Catch Count** | Report raw | **5 claims destroyed** | **VERIFIED ✓** |

---

## 20-Clause Rubric Audit Breakdown

- **Present Clauses:** 9
- **Unclear Clauses:** 1
- **Missing Protections:** 10

---

## Verifier Interception Highlight
Across the evaluation runs, the **Grounding Verifier** (`src/lib/verify.ts`) intercepted and destroyed candidate assertions that failed quote normalisation or number containment, ensuring **zero ungrounded claims reached the interface**.
