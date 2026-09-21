# PROJECT.md — Clause Radar

## Identity

- **Name:** Clause Radar
- **Tagline:** The answer, the proof, and what's missing.
- **Type:** Web application — legal document analyzer for Indian employment agreements
- **Context:** PromptWars Virtual (Exclusive Edition) hackathon — 5-day solo build
- **Problem Statement:** AI for legal assistance and access

## Problem

Legal documents are available but not accessible. A 24-page employment agreement is technically in the candidate's inbox and practically unreadable. Uploading it to a general-purpose assistant produces a summary — long, unranked, unverifiable, and silent about what the contract *fails to include*.

## User

**Primary — Priya, 23, first job, Pune.** Not a lawyer, no lawyer, 48 hours to sign. Needs to know what she is locked into and what to push back on.

**Secondary — 3-years-experience engineer switching companies.** Cares about non-compete, notice period asymmetry, variable pay forfeiture.

**Explicit non-users:** Lawyers, HR teams, enterprises.

## Differentiators (vs "why not just use Gemini?")

1. **Absence detection** — checks against a 20-point rubric and reports gaps. THE differentiator.
2. **Verification, not assertion** — every claim carries a clause ID and verbatim quote; a server-side verifier checks before rendering.
3. **Calibrated refusal** — "insufficient_evidence" is a designed state with nearest clauses and HR questions.
4. **Personalised lens + act layer** — pick concerns → ranked dashboard → leave with an email to send.

## Product Principles

1. The document is the interface — PDF always on screen
2. Nothing is asserted without proof — claim, clause ID, verbatim quote, page, highlight
3. Silence is information — what the contract omits is a finding
4. "I don't know" is a designed state, not a failure
5. End in an action — email + question list, not a summary

## Stack (LOCKED — do not substitute)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript strict |
| Styling | Tailwind CSS |
| PDF | pdfjs-dist (extraction + viewer) |
| AI | Gemini via @google/generative-ai SDK, server-side ONLY |
| Storage | In-memory Map with 30-min TTL — NO database |
| Embeddings | In-memory cosine similarity — NO vector DB |
| Auth | NONE |
| Deploy | Google Cloud Run (min=1, max=1) |

## Locked Decisions

- [D001] No database, no file writes, no auth, no user accounts
- [D002] Contract text is untrusted input — delimiters + schema-constrained output
- [D003] API key server-side only — never NEXT_PUBLIC_, never in client bundle
- [D004] Temperature 0 for extraction/Q&A/verification; 0.4 for email/explanation copy
- [D005] Domain config (rubric + rules) is data, not code — copied from docs, never regenerated
- [D006] Full document in context for Q&A — no retrieval/chunking
- [D007] Six small prompts, not one mega system prompt
- [D008] Verification is pure-function code, not a second model call
- [D009] No console.log of document-derived text
- [D010] Every risk finding ends with "clarify with a professional"

## Milestone

- **v1.0** — Hackathon submission (5-day build)
- **Deadline:** 5 days from project start

## Source Documents

| Doc | Purpose |
|---|---|
| AGENTS.md | Hard rules, forbidden patterns, conventions |
| 01-PRD.md | Scope, user stories, acceptance criteria |
| 02-ARCHITECTURE.md | Pipeline, module boundaries, file tree |
| 03-DATA-CONTRACTS.md | TypeScript types — copy verbatim |
| 04-PROMPT-STRATEGY.md | Six prompts, techniques, injection defence |
| 05-DOMAIN-CONFIG.md | 20-clause rubric + risk rules — copy verbatim |
| 06-EVAL-PLAN.md | Test harness, metrics, fixtures |
| 07-SECURITY-PRIVACY.md | Threat model, checklist |
| 08-ACCESSIBILITY.md | WCAG AA, three-layer approach |
| 09-DESIGN-DIRECTION.md | Tokens, type, layout, the one bold moment |
| 10-BUILD-PLAN.md | 5 days × tasks with definitions of done |
| 11-DEMO-AND-SUBMISSION.md | Video script, README template, checklist |
