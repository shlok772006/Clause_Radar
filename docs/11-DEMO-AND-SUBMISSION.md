# 11 — Demo and Submission

---

## Part A — The video

The brief was explicit: **walk through the prototype, do not explain the project.** Show clicks and what happens on each click. Keep it under 40 clicks. Aim for 2:30–3:00.

Record the **deployed URL**, not localhost. Use fixture B (hostile) for the risk section and fixture C (sparse) for the missing-clause and refusal sections — or one contract that contains both characteristics if you built one.

### Shot list

| # | On screen | Say |
|---|---|---|
| 1 | Upload screen, drop the PDF | "This is a real employment agreement, 26 pages. I'm dropping it in." |
| 2 | Concern picker, tick two | "Before it shows me anything, it asks what I care about. Locked in, and who owns what I build." |
| 3 | Processing labels running | *(say nothing — let the labels read)* |
| 4 | Risk dashboard, ranked | "Findings, ranked by what I said mattered. Bond first." |
| 5 | Click the first finding, highlight sweeps on the left | "**Here's the whole idea.** Every finding points at the exact clause. There's the sentence, page 14, clause 11.3." |
| 6 | Point at the quote | "That's copied from the contract. Before this reached the screen, the server checked the quote against the source and checked that every number in the claim appears in that clause." |
| 7 | Open the debug count | "On this document the model produced 31 claims. Four failed that check and were destroyed. You never saw them." |
| 8 | **Missing tab** | "Now the part a general assistant can't do. This isn't what the contract says — it's what it doesn't." |
| 9 | Scroll to a missing item, expand | "There's no severance clause. No carve-out for projects I already own. It tells me why that matters and exactly what to ask HR." |
| 10 | Ask tab, type the stock-options question | "Let me ask something the contract never mentions." |
| 11 | Refusal card appears | "It won't guess. It says the document doesn't cover it, shows me the closest clauses, and gives me three questions for HR." |
| 12 | Switch language to Marathi, press play | "Same findings in Marathi, read aloud. The quoted clause stays in the original English — translating a quote would break the proof." |
| 13 | Generate the negotiation email | "And I leave with something to send, citing the actual clause numbers." |
| 14 | Session timer, click Delete now, show it gone | "Thirty-minute expiry. Or delete it now. It was never in a database." |
| 15 | Eval table on screen for 4 seconds | "Ten out of ten refusals on unanswerable questions. Ninety-six percent citation precision. Measured, not claimed." |

Close on the eval table. No outro, no thank-you slide.

### Recording rules

- Narrate actions and results. Never say "we built", "we used", "our tech stack", "leveraging".
- Do not show code. Do not show a slide. Do not show your face.
- Cursor moves deliberately. Pause half a second after each click so the change is visible.
- Do one full silent run first to check for dead air and broken states.
- If something breaks mid-take, re-record. A visible error in a trust product is fatal to the pitch.

---

## Part B — README template

````markdown
# Clause Radar

Understand your employment contract — what it says, where it says it, and what it leaves out.

**Live:** <cloud-run-url> · **Demo:** <video-url>

## The problem

Access to a document is not access to understanding. A 24-page employment agreement
arrives by email with a Friday deadline. Uploading it to a general assistant returns a
summary: long, unranked, unverifiable, and silent about everything the contract failed
to include.

## Why not just use a general-purpose assistant?

**1. It tells you what's missing.** A general assistant answers what is in the document.
Clause Radar checks the contract against a 20-point rubric for Indian employment
agreements and reports the gaps — no severance clause, no carve-out for prior work, no
cap on indemnity — with an explanation of why each matters and what to ask HR.

**2. Every claim is verified before you see it.** Answers carry a clause ID and a verbatim
quote. A server-side verifier checks that the clause exists, that the quote is a real
substring of it, and that every number in the claim appears in the cited text. Claims
that fail are discarded, not hedged. Across our eval run the verifier destroyed N claims
before they reached the screen.

**3. It refuses.** Ask about stock options when the contract is silent and you get
"your contract doesn't cover this", the nearest related clauses, and the questions to put
to HR. 10/10 abstention on unanswerable questions in the eval set.

**4. It ends in an action.** A negotiation email citing real clause numbers, and a list of
questions for a lawyer derived from your actual findings.

## Results

```
<paste the eval table verbatim>
```

## How it works

```
PDF → text + page map → deterministic clause segmentation
  ├─ embeddings → 20-point rubric match → present / unclear / missing
  ├─ schema-constrained extraction → VERIFIER → risk rules engine
  └─ question → full-context grounded answer → VERIFIER → claim or refusal
```

Segmentation, rubric matching, verification and the rules engine are pure functions with
unit tests. The model's only job is to read text and report it with citations; everything
checkable is checked in code.

## Prompt strategy

Six small typed prompts, not one large system prompt. Every prompt has a JSON schema,
temperature 0 for anything factual, and a caller willing to throw the output away. The
highest-impact choice: the response schema declares `evidence` **before** `text`, so the
model must locate a clause and copy a quote before it writes an assertion.

Full detail: `docs/04-PROMPT-STRATEGY.md`.

## Responsible AI

Clause Radar is legal *assistance*, not legal advice. It never says a clause is void,
unenforceable or safe to sign. Legal context notes point at the question to ask, paired
with a route to a professional. Every finding and every refusal ends with something to
clarify with HR or a lawyer.

Contract PDFs are untrusted input: document content is delimited as data, output is
schema-constrained, and clause IDs and quotes are validated against the source, so
injected instructions have no channel to act through. Detected injection attempts are
surfaced to the user as a finding.

## Privacy

No database. No file writes. The contract is processed in memory and deleted after
30 minutes, with a visible timer and a delete button. Document text never appears in logs.

## Accessibility

WCAG 2.1 AA. Plain-English toggle on every clause, Hindi and Marathi output, text-to-speech,
full keyboard operation, reduced-motion support. Quoted contract text is never translated —
that would break the verification chain — and is labelled as such.

## Stack

Next.js 15 · TypeScript · Tailwind · pdf.js · Gemini (structured output + embeddings) ·
Cloud Translation · Cloud Text-to-Speech · Cloud Run

## Run locally

```bash
cp .env.example .env.local   # add GEMINI_API_KEY
npm install
npm run dev
npm run test                 # unit tests
npm run eval                 # evaluation harness
```

## Limitations

Text-based PDFs only (scans are detected and explained, not OCR'd). Tuned for Indian
employment agreements; other document types are out of scope by design. Not a substitute
for a lawyer.
````

---

## Part C — Submission checklist

**Code**
- [ ] `npm run test` green
- [ ] `npm run eval` green and thresholds met
- [ ] No API key in the repo, no key in the client bundle
- [ ] `.env.example` committed, `.env.local` ignored
- [ ] README complete with the real eval table
- [ ] Commit history is legible — not one "final" commit

**Deployment**
- [ ] Cloud Run URL live and publicly reachable
- [ ] Full flow tested on that URL from a phone and a laptop
- [ ] Tested in a fresh incognito window
- [ ] Cold start does not break the flow
- [ ] Logs contain no contract text

**Alignment — reread `01-PRD.md` and check honestly**
- [ ] Solves *legal access*, not "generic document chat"
- [ ] Missing-clause engine works and is prominent
- [ ] Refusal path works on all three fixtures
- [ ] Every claim on screen is verified
- [ ] "Not legal advice" is visible without being a modal

**Video**
- [ ] Under 3 minutes, under 40 clicks
- [ ] Walkthrough, not explanation
- [ ] Recorded on the deployed URL
- [ ] No errors visible
- [ ] Refusal moment included
- [ ] Missing-clause moment included
- [ ] Audio audible throughout

**Submission**
- [ ] Repo link, live URL, video link all open in incognito
- [ ] Google services used are named in the README
- [ ] **Submitted once, at the end.** The final attempt is what scores — no early insurance submission, and any second attempt must be strictly better and verified before sending.
- [ ] Submitted with at least four hours of margin
