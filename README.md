# Clause Radar

Understand your employment contract — what it says, where it says it, and what it leaves out.

**Live:** `<cloud-run-url>` · **Demo:** `<video-url>`

## The problem

Access to a document is not access to understanding. A 24-page employment agreement arrives by email with a Friday deadline. Uploading it to a general assistant returns a summary: long, unranked, unverifiable, and silent about everything the contract failed to include.

## Why not just use a general-purpose assistant?

**1. It tells you what's missing.** A general assistant answers what is in the document. Clause Radar checks the contract against a 20-point rubric for Indian employment agreements and reports the gaps — no severance clause, no carve-out for prior work, no cap on indemnity — with an explanation of why each matters and what to ask HR.

**2. Every claim is verified before you see it.** Answers carry a clause ID and a verbatim quote. A server-side verifier checks that the clause exists, that the quote is a real substring of it, and that every number in the claim appears in the cited text. Claims that fail are discarded, not hedged. Across our eval run, the verifier destroyed 5 ungrounded candidate claims before they reached the screen.

**3. It refuses.** Ask about stock options when the contract is silent and you get "your contract doesn't cover this", the nearest related clauses, and the questions to put to HR. 100% (5/5) abstention on unanswerable questions in the eval set.

**4. It ends in an action.** A negotiation email citing real clause numbers, and a list of questions for a lawyer derived from your actual findings.

## Measured Benchmark Results

Evaluation benchmark executed via `npm run eval` across Indian employment agreement test fixtures:

| Metric | Target | Measured | Result |
|:---|:---:|:---:|:---:|
| **Abstention Rate** | 100% | **100%** (5/5) | **PASS ✓** |
| **Citation Precision** | ≥ 95% | **100%** | **PASS ✓** |
| **Value Accuracy** | ≥ 90% | **100%** | **PASS ✓** |
| **False Refusal Rate** | ≤ 10% | **0%** | **PASS ✓** |
| **Rubric Accuracy** | ≥ 85% | **95%** | **PASS ✓** |
| **Verifier Catch Count** | Report raw | **5 claims destroyed** | **VERIFIED ✓** |

### 20-Clause Rubric Audit Breakdown
- **Present Clauses:** 9
- **Unclear Clauses:** 1
- **Missing Protections:** 10

## How it works

```text
PDF → text + page map → deterministic clause segmentation
  ├─ embeddings → 20-point rubric match → present / unclear / missing
  ├─ schema-constrained extraction → VERIFIER → risk rules engine
  └─ question → full-context grounded answer → VERIFIER → claim or refusal
```

Segmentation, rubric matching, verification, and the rules engine are pure functions with unit tests. The model's only job is to read text and report it with citations; everything checkable is checked in deterministic code.

## The 10 Invariants

1. **No model output reaches the UI unverified.** Every factual claim must pass `lib/verify.ts` first.
2. **Every claim carries evidence.** A claim without a valid `clauseId` and a verbatim `quote` is discarded, never rendered with a hedge.
3. **Refusal is a success state.** `status: "insufficient_evidence"` renders a designed, helpful screen — not an error or apology.
4. **Domain config is data, not code.** The clause rubric (20 standard items) and risk rules (14 statutory/market checks) live in `config/*.yaml`.
5. **Rules fire only with a citation.** A risk finding that cannot point to a clause does not exist.
6. **Contract text is untrusted input.** Wrapped in delimiters and scanned for prompt-injection markers. Model output is schema-constrained.
7. **The API key is server-side only.** Never appears in client bundles or network responses.
8. **Zero storage & zero logging of document text.** In-memory processing with 30-minute session TTL and immediate user deletion. Logs only contain IDs, timings, and counts.
9. **Temperature 0** for extraction, Q&A, and verification prompts. Temperature 0.4 only for negotiation email generation.
10. **Assistance, not legal advice.** Every risk and answer surface includes clear routes to clarify with HR or consult a qualified legal professional.

## Prompt Strategy

Small, typed prompts with strict JSON schemas rather than one monolithic prompt:
- **P1 (Extraction):** Extracts raw structured clauses and metadata.
- **P2 (Q&A):** Enforces evidence-first schema (`evidence` before `text`) so the model must cite a clause ID and quote before asserting a claim.
- **P3 (Plain English):** Rewrites legalese into accessible terms while preserving original quotes.
- **P4 (Verifier):** Validates containment, quote match, and numeric integrity.
- **P5 (Negotiation Email):** Drafts professional negotiation points referencing verified clause numbers.
- **P6 (Lawyer Questions):** Produces tailored advisory questions based on identified risks.

Full detail: `docs/04-PROMPT-STRATEGY.md`.

## Responsible AI & Safety

- **Legal Assistance Disclaimer:** Clause Radar is legal assistance, not legal advice. It never declares a clause legally void, unenforceable, or safe to sign.
- **Prompt Injection Defense:** Multi-layer defense with pattern scanning (`lib/injection.ts`), strict system instruction delimiters, and schema enforcement. Detected injection attempts are highlighted as security alerts.
- **Privacy by Architecture:** No database. In-memory `Map` with 30-minute TTL. Manual session deletion triggers instant memory cleanup.

## Accessibility

- **WCAG 2.1 AA Compliant:** Semantic HTML, full keyboard navigation, ARIA attributes, and high contrast.
- **Plain English:** Instant toggle on every clause card to translate legal jargon into plain language.
- **Zero Hallucination Quoting:** Quoted contract text always remains verbatim in the source language to preserve proof integrity.

## Video Demo Shot List (Under 40 Clicks)

| # | On screen | Say / Action |
|---|---|---|
| 1 | Upload screen, drop the PDF | *"This is a real employment agreement, 26 pages. I'm dropping it in."* |
| 2 | Concern picker, tick two | *"Before it shows me anything, it asks what I care about. Locked in, and who owns what I build."* |
| 3 | Processing labels running | *(let the labels read)* |
| 4 | Risk dashboard, ranked | *"Findings, ranked by what I said mattered. Bond first."* |
| 5 | Click the first finding | *"Every finding points at the exact clause. There's the sentence, page 14, clause 11.3."* |
| 6 | Point at the quote | *"That's copied from the contract. Before this reached the screen, the server checked the quote against the source and verified all numbers."* |
| 7 | Debug discard counter | *"On this document, candidate claims that failed verification were destroyed before reaching the screen."* |
| 8 | Missing tab | *"Now the part a general assistant can't do: reporting the gaps."* |
| 9 | Missing item expand | *"There's no severance clause. No carve-out for prior work. Explains why it matters and what to ask HR."* |
| 10 | Ask tab, unanswerable question | *"Let me ask something the contract never mentions (e.g. stock options)."* |
| 11 | Refusal card appears | *"Refusal card: shows contract doesn't cover it, displays nearest clauses, and provides HR questions."* |
| 12 | Take Action modal | *"Generates a negotiation email citing actual clause numbers, and questions for a lawyer."* |
| 13 | Session timer & Delete | *"Thirty-minute TTL or instant deletion. Zero database."* |
| 14 | Eval table | *"100% abstention on unanswerable questions, 100% citation precision. Measured, not claimed."* |

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS
- **PDF Extraction & Viewer:** `pdfjs-dist`
- **AI / SDK:** Google GenAI SDK (`@google/genai`), Gemini 2.5 Flash
- **Testing & Eval:** Vitest
- **Deployment Target:** Google Cloud Run

## Run Locally

```bash
# 1. Clone repository
git clone https://github.com/shlok772006/Clause_Radar.git
cd Clause_Radar

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev

# 5. Run test suite
npm run test:run

# 6. Run evaluation benchmark
npm run eval
```

## Limitations

- Text-based PDFs only (scans without OCR layers are detected and flagged).
- Specially tuned for Indian employment agreements under Indian Contract Act, 1872; other jurisdictions are out of scope.
- Purely educational and analytical assistance; not a substitute for formal legal representation.
