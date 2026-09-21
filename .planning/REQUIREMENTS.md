# REQUIREMENTS.md — Clause Radar

## Functional Requirements

### F1 — PDF Upload, Parse, Clause Segmentation
- **Source:** PRD F1, Architecture §1–3
- **Priority:** P0 (foundation)
- **Acceptance:**
  - PDF up to 15 MB and 60 pages accepted
  - Non-PDF rejected with clear message
  - Scanned/image-only PDF detected and explained (not silently mangled)
  - Deterministic segmentation: numbered headings, ALL-CAPS sections, fallback paragraphs
  - Each clause gets: id, ordinal, number, headingPath, text, page, charStart, charEnd, anchor

### F2 — Two-Pane Reader with Click-to-Highlight
- **Source:** PRD F2, Architecture §4, Design Direction
- **Priority:** P0 (verification story made physical)
- **Acceptance:**
  - Source PDF left, findings right, click-to-highlight
  - Highlight via text layer anchor matching (NOT PDF bounding boxes)
  - Fallback: page-level highlight when anchor not found
  - The highlight sweep: 400ms left-to-right wipe, respects prefers-reduced-motion
  - Page indicator, zoom controls, scrollable

### F3 — Concern Onboarding
- **Source:** PRD F3, Domain Config §concern mapping
- **Priority:** P1
- **Acceptance:**
  - Pick up to 3 concerns from 6 (exit, lockin, future_work, pay, ip, termination)
  - Selection reorders dashboard
  - "Show everything" escape hatch
  - Skippable (defaults to sensible order)

### F4 — Structured Field Extraction with Evidence
- **Source:** PRD F4, Architecture §6, Data Contracts §Extraction
- **Priority:** P0 (feeds rules engine)
- **Acceptance:**
  - One model call, JSON-schema constrained
  - ~18 fields: notice periods, bond, non-compete, probation, etc.
  - Every field carries clauseId, quote, confidence — or is null
  - All fields verified by lib/verify.ts

### F5 — Grounded Q&A with Verifier and Refusal
- **Source:** PRD F5, Architecture §7, Prompt Strategy P2
- **Priority:** P0 (the hallucination answer)
- **Acceptance:**
  - Answer names value, clause number, page
  - Clicking scrolls left pane and highlights
  - Every rendered claim has passed the verifier
  - insufficient_evidence: shows nearest clauses + questions for HR
  - out_of_scope: non-document questions handled
  - No speculative answers, no invented clauses

### F6 — Missing-Clause Report (20-Point Rubric) ⚠️ THE DIFFERENTIATOR
- **Source:** PRD F6, Architecture §5, Domain Config
- **Priority:** P0 (NEVER cut)
- **Acceptance:**
  - 20 rubric items checked: present / unclear / missing
  - Missing items show why they matter + what to ask
  - Present items link to the satisfying clause
  - Embedding-based matching with keyword fallback
  - UI flags fallback method honestly
  - ≥ 85% rubric accuracy across 3 fixtures

### F7 — Deterministic Risk Rules with Severity and Citations
- **Source:** PRD F7, Architecture §8, Domain Config §risk-rules
- **Priority:** P0
- **Acceptance:**
  - 13 rules from config/risk-rules.yaml
  - Each finding: severity, explanation, citation, suggested question
  - A rule without a clauseId does NOT fire
  - Rules engine is a pure function with tests
  - Ranked by: concern match → severity → confidence

### F8 — Plain-Language Rewrite
- **Source:** PRD F8, Prompt Strategy P3
- **Priority:** P2 (cuttable)
- **Acceptance:**
  - Per-clause toggle: "As written" / "In plain English"
  - Numbers preserved and verified
  - 2–4 sentences, no softening or dramatising

### F9 — Regional Language Output + Text-to-Speech
- **Source:** PRD F9, Accessibility §Layer 2
- **Priority:** P2 (TTS) / P2 (translation) — cuttable in order
- **Acceptance:**
  - Hindi and Marathi at minimum
  - Quoted contract text NEVER translated — stays verbatim with note
  - lang attribute set on translated regions
  - Audio: standard controls, visible play state, stoppable

### F10 — Negotiation Email + Lawyer Questions + PDF Export
- **Source:** PRD F10, Prompt Strategy P5/P6
- **Priority:** P1 (email) / P0 (lawyer questions)
- **Acceptance:**
  - Email references specific clauses, editable, copyable, under 200 words
  - Question list derived from actual findings, not generic
  - PDF export (cuttable)

### F11 — Delete My Document
- **Source:** PRD F11, Security §Data handling
- **Priority:** P0 (trust feature)
- **Acceptance:**
  - Server-side entry removed
  - Subsequent requests 404
  - Confirmation: "Deleted. The extracted text is gone from the server."
  - Return to upload screen

---

## Non-Functional Requirements

### NFR-1 — Performance
- First findings visible within 25 seconds of upload for 25-page document
- Stream partial results; do not block on full pipeline

### NFR-2 — Deployment
- Works on deployed Cloud Run URL, not only localhost
- Cloud Run: min=1, max=1 (session store coherence)

### NFR-3 — Accessibility (WCAG 2.1 AA)
- Contrast ≥ 4.5:1 body, ≥ 3:1 large text
- Full keyboard traversal
- Screen reader compatible
- prefers-reduced-motion respected
- Lighthouse accessibility ≥ 95

### NFR-4 — Security
- No document text in logs
- API key server-side only
- In-memory only, 30-min TTL
- Rate limiting: 5 uploads/hr, 60 questions/hr per IP
- Security headers (CSP, X-Frame-Options, etc.)
- Magic-byte PDF validation

### NFR-5 — Testing
- 30+ unit test assertions (segment, verify, rubric, rules)
- Eval harness: 35 questions across 3 fixtures
- Abstention: 100%, Citation precision: ≥95%, Value accuracy: ≥90%
- False refusal: ≤10%, Rubric accuracy: ≥85%

### NFR-6 — Responsible AI
- "Not legal advice" visible without being a modal
- Every finding ends with "clarify with a professional"
- No prediction of outcomes, no enforceability verdicts
- Legal context notes phrased as questions, not answers

---

## Success Metrics

| Metric | Target |
|---|---|
| Abstention on unanswerable questions | 100% (10/10) |
| Citation precision on answerable questions | ≥ 95% |
| Value accuracy on answerable questions | ≥ 90% |
| False refusal on answerable questions | ≤ 10% |
| Rubric detection accuracy across 3 fixtures | ≥ 85% |

Measured by `npm run eval`. See docs/06-EVAL-PLAN.md.

---

## Cut List (in priority order — cut from bottom)

1. Text-to-speech (F9 partial)
2. Translation (F9 partial)
3. PDF report export (F10 partial)
4. Plain-language rewrite toggle (F8)
5. Negotiation email (F10 partial — keep lawyer questions)
6. Concern ranking (F3 partial — keep picker, use fixed order)

**NEVER cut:** Verifier (F5), Refusal path (F5), Missing-clause engine (F6), Click-to-highlight (F2), Eval harness (NFR-5)
