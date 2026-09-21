# 01 — Product Requirements

## Problem

Legal documents are available but not accessible. A 24-page employment agreement is technically in the candidate's inbox and practically unreadable to her. She signs it anyway, because the alternative is to delay a job offer.

Uploading the PDF to a general assistant produces a summary. A summary is the wrong artefact: it is long, it is unranked, it cannot be verified against the source, it answers only what was asked, and it never mentions what the contract left out.

## Users

**Primary — Priya, 23, first job, Pune.** Not a lawyer, no lawyer, 48 hours to sign. Needs to know what she is locked into and what to push back on.

**Secondary — a 3-years-experience engineer switching companies.** Cares about non-compete, notice period asymmetry, and variable pay forfeiture. Already suspicious, wants evidence.

**Explicit non-users:** lawyers, HR teams, enterprises. Not building for them, not designing for them.

## Product principles

1. **The document is the interface.** The source PDF is always on screen. Answers appear beside it, never instead of it.
2. **Nothing is asserted without proof.** Claim, clause ID, verbatim quote, page number, visible highlight.
3. **Silence is information.** What the contract omits is a finding, ranked and explained.
4. **"I don't know" is a designed state**, not a failure.
5. **End in an action.** The session produces an email and a question list, not a feeling.

## Scope — in

| # | Capability | Why it earns its place |
|---|---|---|
| F1 | PDF upload, parse, clause segmentation with page numbers | Foundation |
| F2 | Two-pane reader: source PDF left, findings right, click-to-highlight | The verification story, made physical |
| F3 | Concern onboarding (pick up to 3) that ranks all output | Judges called out that different users care about different things |
| F4 | Structured field extraction with per-field evidence | Feeds the rules engine |
| F5 | Grounded Q&A with a server-side verifier and refusal | The hallucination answer |
| F6 | **Missing-clause report against a 20-point rubric** | The differentiator |
| F7 | Deterministic risk rules with severity and citations | Domain expertise a general assistant lacks |
| F8 | Plain-language rewrite of any single clause, numbers preserved | Accessibility of meaning |
| F9 | Regional-language output + text-to-speech | Accessibility of language |
| F10 | Negotiation email + "questions for a lawyer" + PDF report export | The act layer |
| F11 | Delete-my-document, visible and real | Trust as a feature |

## Scope — out (the cut list, hold this line)

Accounts. Databases. Document version diffing. Rental/loan/NDA support. Multi-document comparison. Collaboration. Payment. Mobile app. Persistent history. OCR for scanned documents *(detect and message instead)*. Any statute corpus beyond the handful of named references in the risk rules.

If you are running behind, cut in this order: TTS → translation → PDF export → plain-language rewrite. Never cut F6.

## User stories with acceptance criteria

**US-1 — Upload**
As Priya, I upload my agreement and see it on screen within 15 seconds.
*Accepts:* PDF up to 15 MB and 60 pages. Non-PDF rejected with a clear message. A scanned/image-only PDF is detected and explained ("this looks like a scan; we can only read text-based PDFs"), not silently mangled.

**US-2 — Set my lens**
Before results, I pick up to three concerns from six.
*Accepts:* Selection reorders the dashboard. A "show everything" escape hatch exists. Skipping is allowed and defaults to a sensible order.

**US-3 — Ask and verify**
I ask "what is my notice period?" and get an answer with a clause reference I can click.
*Accepts:* Answer names the value, the clause number, and the page. Clicking scrolls the left pane to that page and highlights the clause text. Every rendered claim has passed the verifier.

**US-4 — Be refused honestly**
I ask about stock options, which the contract never mentions.
*Accepts:* Response is `insufficient_evidence`. UI states the document does not address it, shows the nearest related clauses, and offers the question to ask HR. No speculative answer. No invented clause.

**US-5 — See what's missing**
I open the Missing tab.
*Accepts:* Each of the 20 rubric items is marked present / unclear / missing. Missing items show why they matter and what to ask for. Present items link to the clause that satisfied them.

**US-6 — See what's unusual**
The dashboard shows risk findings ranked by my concerns.
*Accepts:* Each finding has a severity, a plain explanation, a clause citation, and a suggested question. No finding appears without a citation.

**US-7 — Read it in my language**
I switch the findings to Hindi or Marathi and press play.
*Accepts:* Translation applies to generated explanation text, not to quoted contract text (quotes stay verbatim with a note). Audio plays with standard controls.

**US-8 — Leave with something**
I generate a negotiation email and a lawyer question list.
*Accepts:* Email references specific clauses, is editable, and is copyable. Question list is derived from actual findings, not generic.

**US-9 — Delete it**
I click delete and the document is gone.
*Accepts:* Server-side entry removed, subsequent requests for that session 404, confirmation shown.

## Non-functional requirements

- First findings visible within 25 seconds of upload for a 25-page document (stream partial results; do not block on the full pipeline).
- Works on the deployed Cloud Run URL, not only locally.
- WCAG 2.1 AA — see `08-ACCESSIBILITY.md`.
- Zero document text in logs.
- Graceful degradation: if embeddings fail, rubric matching falls back to keyword detection and the UI says the check was keyword-based.

## Success metrics (publish these in the README)

| Metric | Target |
|---|---|
| Abstention on unanswerable questions | 100% (10/10) |
| Citation precision on answerable questions | ≥ 95% |
| Value accuracy on answerable questions | ≥ 90% |
| False refusal on answerable questions | ≤ 10% |
| Rubric detection accuracy across 3 fixtures | ≥ 85% |

Measured by `npm run eval`. See `06-EVAL-PLAN.md`.
