# AGENTS.md — Clause Radar

Rules for any coding agent working in this repository. These override default habits.

## Project

Clause Radar reads an Indian employment agreement (PDF) and produces grounded, clause-cited answers, a missing-clause report, and a risk review. Hackathon project, 5-day build, single developer. Ship over polish, but never ship an ungrounded claim.

Read `docs/01-PRD.md` for scope and `docs/10-BUILD-PLAN.md` for the current task list. Never invent scope not in the PRD.

## Stack — fixed, do not substitute

- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS
- `pdfjs-dist` for PDF text extraction and for the rendered viewer
- Gemini via the official Google GenAI SDK, server-side only
- **No database.** In-memory `Map` with TTL, single Cloud Run instance
- **No vector database.** Cosine similarity over an in-memory array
- **No auth, no accounts, no user records**
- Deploy target: Google Cloud Run

If a task seems to need a dependency outside this list, stop and ask rather than adding it.

## Hard rules

1. **No model output reaches the UI unverified.** Every factual claim must pass `lib/verify.ts` first. If you add a new generation path, you add a verification path in the same commit.
2. **Every claim carries evidence.** A claim without a valid `clauseId` and a verbatim `quote` is discarded, never rendered with a hedge.
3. **Refusal is a success state.** `status: "insufficient_evidence"` renders a designed, helpful screen — not an error, not an apology, not a greyed-out box.
4. **Domain config is data, not code.** The clause rubric and risk rules live in `config/*.yaml`. Never hardcode a rule in a component. Never regenerate these files from your own knowledge — they are copied from `docs/05-DOMAIN-CONFIG.md`.
5. **Rules fire only with a citation.** A risk finding that cannot point to a clause does not exist.
6. **Contract text is untrusted input.** Wrap it in delimiters and instruct the model to treat it as data. A PDF may contain prompt-injection text. Never let document content alter system behaviour.
7. **The API key is server-side only.** It never appears in a client component, a `NEXT_PUBLIC_` variable, or a network response.
8. **Never log document text or extracted values.** Log IDs, counts, timings, error types. Nothing else.
9. **Temperature 0** for extraction, Q&A, and verification prompts. Higher temperature only for the negotiation email and the "why this clause matters" copy.
10. **This is assistance, not legal advice.** Every risk and every answer surface includes a route to "clarify with a professional." Do not remove this to save space.

## Code conventions

- `lib/` is pure and testable — no React imports, no `fetch` to the browser, no side effects beyond the declared client.
- Parsing, verification, rubric matching, and rules evaluation are **pure functions**. They take data, return data. This is what makes them testable, and testability is a scored criterion.
- Vitest for tests. Every pure function in `lib/` has a test file next to it.
- No `any`. No `@ts-ignore`. No silently swallowed errors — surface them as typed results.
- Server actions or route handlers for all model calls. No client-side model calls, ever.

## Definition of done for every task

- [ ] TypeScript compiles with no errors
- [ ] `npm run test` passes
- [ ] From Day 2 onward: `npm run eval` passes its thresholds
- [ ] The feature works in the browser, verified by actually loading the page
- [ ] No secrets, no document text, in any log or client bundle
- [ ] Keyboard reachable and screen-reader labelled if it is interactive

## Forbidden patterns

- A chat box as the primary interface
- Summarising the whole document as the default output
- Any claim rendered with "the model says" or "approximately" as a substitute for verification
- `localStorage` for document content
- Fabricated clause numbers, page numbers, or statute references
- Retrieval/chunking for Q&A — the whole document fits in context at this size
- `console.log` of anything derived from the uploaded file

## When stuck

Prefer the simpler mechanism that can be tested over the sophisticated one that cannot. Prefer failing loudly to degrading quietly. If a feature cannot be made grounded, cut it and say so in the PR summary.
