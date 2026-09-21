# STATE.md — Clause Radar

## Current State

- **Milestone:** v1.0
- **Current Phase:** 3 (The Differentiator)
- **Phase Status:** complete
- **Last Action:** verify-work 3 complete — all 8 UAT scenarios verified in browser & recorded in 3-UAT.md
- **Next Action:** `/gsd-discuss-phase 4` → Discuss Phase 4 (Score and Ship)

## Phase Progress

| Phase | Name | Status | Day |
|---|---|---|---|
| 1 | The Spine | complete | 1 |
| 2 | Grounding and Refusal | complete | 2 |
| 3 | The Differentiator | complete | 3 |
| 4 | Score and Ship | not_started | 4 |
| 5 | Prove It | not_started | 5 |

## Active Decisions

- None pending — all stack and architecture decisions locked in PROJECT.md

## Blockers

- [x] Gemini API key configured in .env.local
- [ ] Eval fixture PDFs needed (blocks Phase 4.6)
- [ ] Google Cloud project with billing (blocks Phase 4.7)

## Session Log

| Timestamp | Action | Outcome |
|---|---|---|
| 2026-09-21 12:02 | GSD onboard + ingest-docs | .planning/ bootstrapped from 12 docs + AGENTS.md |
| 2026-09-21 16:47 | GSD execute-phase 1 | All 5 waves complete: PDF parsing, segmentation, viewer, ingest API, review page, end-to-end verified |
| 2026-09-21 17:13 | GSD execute-phase 2 | All 4 waves complete: serializer, P1/P2 schemas, verifier (5 checks), injection scanner, /api/ask, ClaimCard, RefusalCard, AskPanel |
| 2026-09-21 18:15 | GSD execute-phase 3 | All 4 waves complete: 20-item rubric, 14 risk rules, vectors, pure rubric & rules engines, ConcernPicker, RiskDashboard, MissingReport |
| 2026-09-21 19:14 | GSD verify-work 3 | 8 UAT scenarios passed: Scorecard (9/1/10), ConcernPicker 6 pills, filter tabs, Show me navigation, RiskDashboard |
