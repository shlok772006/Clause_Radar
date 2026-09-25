# Phase 4: Score and Ship — User Acceptance Testing (UAT)

**Status:** Completed (Passed)  
**Completed:** 2026-09-25  

## Test Matrix

| # | Test Scenario | Expected Result | Status |
|---|---------------|-----------------|--------|
| 1 | Plain-Language Clause Rewrite | Selecting a clause in the Clauses tab expands it with an inline "As written" vs "Plain English" toggle. Selecting "Plain English" displays a verified simplified explanation with numbers preserved and a green `✓ Numbers verified` badge. | Passed |
| 2 | Number Verification & Guardrails | Numbers and durations in the simplified explanation strictly match the source clause; unverified values fall back safely to original text per AGENTS.md Rule 1. | Passed |
| 3 | Take Action Modal Trigger | Clicking "Take Action" in the top navigation header or inside the RiskDashboard opens the Take Action modal. | Passed |
| 4 | Candidate Negotiation Email (Tab 1) | Generates a polite, professional candidate email under 200 words citing specific clause numbers (§) with alternatives and enthusiasm for the role. | Passed |
| 5 | Questions for Lawyer / HR (Tab 2) | Generates 5 focused, high-leverage legal consultation questions citing clauses and legal context notes from contract findings. | Passed |
| 6 | Clipboard Copy Feedback | Clicking "Copy Email" or "Copy Questions" copies text to clipboard and provides immediate visual feedback ("✓ Copied to clipboard!"). | Passed |
| 7 | Delete My Document (PRD F11) | Clicking "Delete now" in the header immediately purges the session from in-memory store, redirects home, and displays confirmation: *"Deleted. The extracted text is gone from the server."* Subsequent session requests return 404. | Passed |
| 8 | Background Cosine Vector Matching | Ingest route executes embedding generation and re-evaluates the 20-clause rubric in the background using cosine similarity against precomputed rubric vectors. | Passed |
| 9 | Strict Quality Gates | TypeScript: 0 errors (`npx tsc --noEmit`); ESLint: 0 errors, 0 warnings (`npx eslint src`); Vitest: 60/60 tests passing across 12 test suites; Production build: `npm run build` compiled successfully. | Passed |

## Session Log

- Verified Phase 4 end-to-end in browser on test agreement: inline plain-language clause toggle with number verification, Take Action modal with candidate negotiation email and lawyer consultation questions, clipboard copying, and F11 document deletion.
- All 12 test suites (60 tests) pass with zero errors.
- Production bundle compiled cleanly for all routes (`/`, `/review/[sessionId]`, `/api/ingest`, `/api/ask`, `/api/explain`, `/api/act`, `/api/session/[id]`).
