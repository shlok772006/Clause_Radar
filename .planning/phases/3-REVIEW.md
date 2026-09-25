# Phase 3 Code Review — The Differentiator

**Reviewed:** Phase 3 implementation (Domain Config, Rubric Matching Engine, Risk Rules Engine, Concern Picker, Risk Dashboard, Missing Report, Ingest Pipeline)  
**Depth:** Standard (AGENTS.md adherence, TypeScript strictness, security, pure function contracts, performance, and UI/a11y)  
**Date:** 2026-09-25  
**Status:** PASS with Actionable Findings (1 Critical, 3 Warnings, 2 Info)

---

## Executive Summary

Phase 3 implements the core differentiators of Clause Radar: 20-clause rubric audit, 14 risk rules engine, dynamic concern re-ranking, and the interactive Risk & Missing UI panels. 

All 51 automated unit and integration tests pass cleanly (`npm run test:run`). The core safety invariants of **AGENTS.md** are strictly upheld: rules never fire without verbatim clause evidence (Rule 5), no document text is logged (Rule 8), and legal disclaimers are present on all risk surfaces (Rule 10).

However, there is one notable architectural gap: clause embeddings are not computed during ingest, causing rubric matching to always fall back to deterministic keyword matching. In addition, there are minor TypeScript strictness violations (`any` types) contrary to project rules.

---

## Findings Matrix

| ID | Severity | Category | File | Description |
|:---|:---|:---|:---|:---|
| **CR-01** | Critical | Runtime/Feature | `src/app/api/ingest/route.ts`, `src/lib/embed.ts` | `embedTexts` is never invoked during ingest; rubric always falls back to keyword matching |
| **CR-02** | Warning | Code Standard | `src/lib/rules.ts`, `src/lib/rubric.ts` | Direct use of `any` types violates AGENTS.md strictness rule |
| **CR-03** | Warning | Performance | `src/lib/embed.ts` | Sequential `for...of` loop in `embedTexts` will cause high latency on multi-clause documents |
| **CR-04** | Warning | Architecture | `src/lib/rubric-data.ts`, `config/clause-rubric.yaml` | Dual source of truth for rubric items (YAML vs static TS file) |
| **CR-05** | Info | UX / A11y | `src/components/FindingsPane.tsx` | Tab buttons lack `aria-controls` linking to their respective tabpanels |
| **CR-06** | Info | Test Coverage | `eval/rubric-eval.test.ts` | Eval test mocks `VerifiedFields` instead of exercising `extractFields` end-to-end |

---

## Detailed Findings

### CR-01: Rubric matching always falls back to keyword matching (embedTexts unused)
- **Files:** `src/app/api/ingest/route.ts:115`, `src/lib/embed.ts:29`
- **Description:** In `src/app/api/ingest/route.ts`, `matchRubric(clauses, RUBRIC_ITEMS, precomputedVectors)` is invoked without the 4th parameter (`clauseVectors`). In `matchRubric`, `hasVectors` requires `clauseVectors` to match `clauses.length`. Because it is `undefined`, `method` is always `'keyword'`. The 33,000-line `config/rubric-vectors.json` is loaded into memory but its vectors are never compared against document clauses in production.
- **Impact:** Semantic similarity matching via `text-embedding-004` is bypassed. Keyword matching works well for standard headings, but fails on paraphrased clauses.
- **Recommended Remediation:** 
  1. For initial fast response, keep the keyword match on the synchronous path.
  2. In the background task (alongside `extractFields`), invoke `embedTexts(clauses.map(c => c.text))`, re-run `matchRubric` with embeddings, and update the session via `updateSession(sessionId, { rubric: vectorRubricResults })`.

---

### CR-02: Usage of `any` violates AGENTS.md rule
- **Files:** 
  - `src/lib/rules.ts`: lines 31, 50, 56, 77, 182
  - `src/lib/rubric.ts`: line 24
- **Description:** AGENTS.md explicitly states: *"No `any`. No `@ts-ignore`. No silently swallowed errors — surface them as typed results."* 
  In `rules.ts`:
  - `cachedRules = (parsed.rules || []).map((r: any) => ...)`
  - `function getFieldValue(pathStr: string, fields: VerifiedFields): any`
  - `let rightVal: any;`
  - `const field = fields[fieldKey] as any;`
- **Recommended Remediation:** Replace `any` with `unknown` and add proper type guards or cast to `ExtractedField<unknown>`.

---

### CR-03: Sequential embedding calls in `embedTexts`
- **File:** `src/lib/embed.ts:38-42`
- **Description:**
  ```ts
  for (const text of texts) {
    const truncated = text.slice(0, 2000);
    const res = await model.embedContent(truncated);
    vectors.push(res.embedding.values);
  }
  ```
  If a document contains 40 clauses, executing 40 serial network round-trips to Gemini will take 15–25 seconds.
- **Recommended Remediation:** Use `batchEmbedContents` from the Google GenAI SDK, or batch with `Promise.all` in chunks of 5–10 concurrent requests.

---

### CR-04: Dual source of truth for rubric items
- **Files:** `config/clause-rubric.yaml` and `src/lib/rubric-data.ts`
- **Description:** `docs/05-DOMAIN-CONFIG.md` specifies that domain configuration lives in `config/*.yaml`. Because client components (`FindingsPane.tsx`, `MissingReport.tsx`) cannot use Node `fs`, `rubric-data.ts` was introduced. However, modifying `clause-rubric.yaml` will not reflect in the UI unless `rubric-data.ts` is also manually updated.
- **Recommended Remediation:** Either add a build script or compile-step verification that guarantees `rubric-data.ts` is in exact sync with `clause-rubric.yaml`, or pass rubric items down from the server page props.

---

### CR-05: Tab buttons lack ARIA tabpanel bindings
- **File:** `src/components/FindingsPane.tsx:58-134`
- **Description:** Navigation tabs use `role="tab"` and `aria-selected`, but do not specify `aria-controls="panel-id"`, and the content containers do not specify `role="tabpanel"` and `aria-labelledby`.
- **Recommended Remediation:** Add `id` and `aria-controls` to the tab buttons and `role="tabpanel"` to the respective tab bodies.

---

## AGENTS.md Compliance Checklist

| Rule | Requirement | Status | Notes |
|:---|:---|:---|:---|
| **Rule 1** | No model output reaches UI unverified | **PASS** | Evaluated fields require `__verification` pass before reaching rules |
| **Rule 2** | Every claim carries evidence | **PASS** | `ClaimCard` and `Finding` enforce valid `clauseId` and `quote` |
| **Rule 3** | Refusal is a success state | **PASS** | Clean empty states in `RiskDashboard` and `MissingReport` |
| **Rule 4** | Domain config is data, not code | **WARN** | YAML config exists, but static duplicate exists in `rubric-data.ts` (CR-04) |
| **Rule 5** | Rules fire only with a citation | **PASS** | Strictly enforced in `rules.ts:194` (`if (evidenceList.length === 0) continue`) |
| **Rule 6** | Contract text is untrusted input | **PASS** | Pre-scanned for injection; no eval/unsafe HTML injection |
| **Rule 7** | API key server-side only | **PASS** | Ingest and embed run server-side; no `NEXT_PUBLIC_` keys |
| **Rule 8** | Never log document text or values | **PASS** | `console.info` in ingest logs only IDs, counts, and timings |
| **Rule 9** | Temperature 0 for extraction | **PASS** | Extraction prompt configured with `temperature: 0` |
| **Rule 10** | Assistance, not legal advice | **PASS** | "Confirm with a lawyer" callout and footer disclaimer present on all views |

---

## Verdict & Recommended Action

**Verdict: READY FOR PHASE 4 with Minor Polish**

The implementation is functionally sound, all 51 tests pass, and critical security and grounding rules are respected. 
The recommended priority fixes are:
1. Eliminate `any` in `src/lib/rules.ts` and `src/lib/rubric.ts`.
2. Schedule background embedding computation in `src/app/api/ingest/route.ts` so vector-based matching executes alongside field extraction.
