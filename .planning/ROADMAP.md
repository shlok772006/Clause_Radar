# ROADMAP.md — Clause Radar v1.0

## Milestone: v1.0 — Hackathon Submission

**Deadline:** 5 days from project start
**Status:** not_started

---

## Phase 1 — The Spine
- **Day:** 1
- **Status:** not_started
- **Must ship:** PDF uploads, becomes clauses, renders in left pane, clicking a clause ID highlights on correct page
- **Requirements:** F1, F2, F11 (partial)
- **Tasks:**
  - 1.1 Scaffold Next.js 15 + TS strict + Tailwind + Vitest + design tokens
  - 1.2 lib/types.ts verbatim from 03-DATA-CONTRACTS.md
  - 1.3 lib/pdf.ts — pdfjs text extraction with page-offset map
  - 1.4 lib/segment.ts + tests — text → Clause[]
  - 1.5 ⚠️ DocumentPane.tsx — pdfjs viewer with text layer + highlightClause() [HIGHEST RISK]
  - 1.6 /api/ingest + lib/store.ts with TTL sweeper + upload UI
- **Risk:** Task 1.5 (click-to-highlight) is highest risk. If broken after 4 hours, fall back to page-level tint.
- **Definition of done:** Upload fixture → sessionId → /review/[id] with document rendered and clauses listed

## Phase 2 — Grounding and Refusal
- **Day:** 2
- **Status:** not_started
- **Must ship:** Ask a question → verified answer with "show me", or honest refusal
- **Requirements:** F4, F5
- **Dependencies:** Phase 1
- **Tasks:**
  - 2.1 lib/prompts/ — P1 (extraction) and P2 (Q&A) + ID-tagged clause serialiser
  - 2.2 ⚠️ lib/verify.ts + tests — all five checks [MOST IMPORTANT FILE]
  - 2.3 /api/ask — Gemini + responseSchema + verify
  - 2.4 ClaimCard + RefusalCard + AskPanel
  - 2.5 lib/extract.ts — P1 field extraction, verified
  - 2.6 Injection detection wordlist scan
- **Risk:** Do NOT start prompt tuning. Write prompts once from strategy doc, get pipeline working.
- **Definition of done:** "What is my notice period?" → answer with clickable quote; stock options → refusal card

## Phase 3 — The Differentiator
- **Day:** 3
- **Status:** not_started
- **Must ship:** Missing-clause report and risk dashboard, ranked by concerns
- **Requirements:** F3, F6, F7
- **Dependencies:** Phase 2
- **Tasks:**
  - 3.1 Copy config/clause-rubric.yaml and config/risk-rules.yaml VERBATIM from docs
  - 3.2 scripts/build-vectors.ts → config/rubric-vectors.json
  - 3.3 lib/embed.ts + lib/rubric.ts + tests — embedding match with keyword fallback
  - 3.4 lib/rules.ts + tests — expression evaluator, interpolation, evidence requirement
  - 3.5 ConcernPicker + ranking
  - 3.6 RiskDashboard + MissingReport wired to real data
  - 3.7 Extend /api/ingest to run full pipeline + stream partial results
- **Risk:** This is THE winning feature. Protect build time above everything.
- **Definition of done:** Fixture B shows asymmetric notice/bond; Fixture C shows 8+ missing items
- **NOTE:** End of Phase 3 = complete product. Everything after is score/polish.

## Phase 4 — Score and Ship
- **Day:** 4
- **Status:** not_started
- **Must ship:** Deployed, tested, accessible, measured
- **Requirements:** F8, F9, F10, NFR-1 through NFR-6
- **Dependencies:** Phase 3
- **Tasks:**
  - 4.1 /api/explain (P3) — plain-language toggle, numbers verified
  - 4.2 /api/act (P5, P6) — negotiation email + lawyer questions
  - 4.3 /api/translate + /api/speak — Hindi, Marathi, quotes untranslated
  - 4.4 Accessibility pass against 08-ACCESSIBILITY.md
  - 4.5 Security pass against 07-SECURITY-PRIVACY.md
  - 4.6 eval/questions.json + eval/run.ts; npm run eval
  - 4.7 Dockerfile + deploy to Cloud Run (min=1, max=1)
  - 4.8 README from template in 11-DEMO-AND-SUBMISSION.md
- **Definition of done:** Full flow works on deployed URL from a phone

## Phase 5 — Prove It
- **Day:** 5
- **Status:** not_started
- **Must ship:** Submitted with margin (stop building at 12:00)
- **Requirements:** All
- **Dependencies:** Phase 4
- **Tasks:**
  - 5.1 Regression on 3 fixtures + 1 real contract on deployed URL
  - 5.2 Run manual checklist from 06-EVAL-PLAN.md
  - 5.3 Fix issues from 5.1/5.2; eval still green
  - 5.4 Optional: ablation table (3 rows of real numbers)
  - 5.5 Record demo video per 11-DEMO-AND-SUBMISSION.md
  - 5.6 Final submission — submit once, at the end
- **Definition of done:** Everything submitted with ≥4 hours of margin
