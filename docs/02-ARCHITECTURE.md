# 02 — Architecture

## Shape

One Next.js app. No database, no queue, no vector store, no auth. Single Cloud Run instance with `min=1, max=1` so the in-memory session store is coherent. This is a deliberate architecture, not a shortcut: **the contract never touches disk or a database**, which is a privacy claim you can make honestly in the demo.

```
Browser                      Next.js server (Cloud Run)         Google APIs
───────                      ──────────────────────────         ───────────
upload PDF ───────────────►  /api/ingest
                             ├─ validate (type, size, pages)
                             ├─ pdfjs → text + page map
                             ├─ segment → Clause[]
                             ├─ embed clauses ──────────────────► Gemini embeddings
                             ├─ rubric match (cosine, in-proc)
                             ├─ extract fields ─────────────────► Gemini (JSON schema)
                             ├─ VERIFY extraction  ◄── pure fn
                             ├─ evaluate risk rules ◄── pure fn
                             └─ store in SessionStore (TTL 30m)
      ◄─── sessionId + Clause[] + findings

render PDF (pdfjs) ◄─────────  client holds the PDF bytes in memory for display

ask question ─────────────►  /api/ask
                             ├─ full document in context (no retrieval)
                             ├─ Gemini → AnswerEnvelope (JSON schema)
                             ├─ VERIFY ◄── pure fn  ← destroys bad claims
                             └─ return verified envelope or refusal
```

## The pipeline, stage by stage

### 1. Ingest and validate
Reject non-PDF, >15 MB, >60 pages. Detect image-only PDFs: if extracted text is under ~200 characters per page on average, treat as a scan and return a typed `ScanDetected` error with a friendly message. Do not attempt OCR.

### 2. Extract text with position
`pdfjs-dist` in Node. For each page, get the text content items and join them, preserving a running character offset and the page number for each offset range. Output: full text plus a `pageBreaks: number[]` array of character offsets. This is how every clause gets a page number without any coordinate maths.

### 3. Segment into clauses
Deterministic, no model call. In priority order:
- Numbered headings: `^\s*(\d+(\.\d+)*)[\.\)]?\s+[A-Z]` → new clause, capture the number
- ALL-CAPS or Title Case standalone lines under ~80 chars → section heading, pushes onto `headingPath`
- `SCHEDULE`, `ANNEXURE`, `EXHIBIT` → new top-level section
- Fallback: blank-line-separated paragraphs, merged until at least 200 characters

Each clause gets `id` (`c_001`…), `ordinal`, `number`, `headingPath`, `text`, `page`, `charStart`, `charEnd`, and `anchor` (the first 60 characters, whitespace-normalised).

**Merge rule:** clauses under 120 characters merge forward into the next clause unless they are a heading. Prevents a shower of fragments.

### 4. Highlighting — the approach that actually works
Do **not** map PDF bounding boxes. Instead:
- The client renders each page with the pdfjs text layer (a DOM overlay of positioned text spans).
- To highlight clause `c_042`: scroll to `clause.page`, then walk the text layer's spans building a normalised string, find the index of `clause.anchor`, and wrap the matching span range in a `<mark>`.
- If the anchor is not found (rare, ligature/spacing issues), fall back to highlighting the whole page with a softer tint and still show the page number.

This is the single highest-risk piece of the build. It is Task 1.5 on Day 1 for that reason.

### 5. Embeddings and rubric matching
Embed each clause once at ingest. Embed the 20 rubric queries at **build time** and commit the vectors as `config/rubric-vectors.json` — this avoids 60 embedding calls per upload and makes the check deterministic and fast.

Matching: for each rubric item, take the max cosine similarity over all clauses.
- `score ≥ threshold` → **present**, cite the best clause
- `threshold - 0.05 ≤ score < threshold` → **unclear**
- `score < threshold - 0.05` → **missing**

**Keyword fallback:** each rubric item also carries `keywords[]`. If the embedding call fails, match on keyword presence and set `method: "keyword"` so the UI can be honest about it.

### 6. Field extraction
One model call, JSON-schema constrained, returning the ~18 fields the rules engine needs (notice periods, bond, non-compete duration, probation, etc.). Every field carries `clauseId`, `quote`, and `confidence`, or is `null`.

### 7. Verification — the heart of the system
`lib/verify.ts`, pure, heavily tested. For every claim or extracted field:

1. **Existence** — does the cited `clauseId` exist in this document? No → discard.
2. **Quote fidelity** — is `quote` a verbatim substring of the cited clause text, after normalising whitespace and case? No → discard.
3. **Number containment** — extract every number, duration, percentage and currency amount from the claim text. Each must appear in the cited clause text (allowing digit/word equivalence: "60" ≈ "sixty"). Any orphan number → discard.
4. **Confidence floor** — `confidence < 0.55` → downgrade to unclear.
5. **Aggregate** — if every claim was discarded, the envelope becomes `insufficient_evidence` and the refusal UI renders.

Discarded claims are counted and exposed in a debug panel. Say the number out loud in the demo: *"the model produced eleven claims here; three failed verification and were destroyed before you saw them."* That sentence is worth more than any prompt.

### 8. Rules engine
`lib/rules.ts`, pure. Input: verified fields + clauses. Output: `Finding[]` with severity, explanation, citation, and suggested question. Rules are loaded from `config/risk-rules.yaml`. A rule that cannot attach a `clauseId` does not fire.

### 9. Ranking
Findings sorted by: user concern match (from onboarding) → severity → confidence. Concerns map to rule tags in the config.

## Module boundaries

```
lib/pdf.ts        text + page map        pure-ish (pdfjs only)
lib/segment.ts    text → Clause[]        PURE, tested
lib/embed.ts      text[] → vectors       I/O
lib/rubric.ts     clauses → RubricResult PURE, tested
lib/extract.ts    clauses → RawFields    I/O (model)
lib/verify.ts     Raw → Verified         PURE, tested  ← most important file
lib/rules.ts      fields → Finding[]     PURE, tested
lib/ask.ts        question → Envelope    I/O + verify
lib/store.ts      SessionStore w/ TTL    stateful
lib/prompts/      one file per prompt    data
```

The four PURE files are where the test suite lives and where the "testing" score comes from.

## File tree

```
clause-radar/
├── AGENTS.md
├── docs/                          ← this pack
├── config/
│   ├── clause-rubric.yaml
│   ├── risk-rules.yaml
│   └── rubric-vectors.json        ← generated by scripts/build-vectors.ts
├── app/
│   ├── page.tsx                   ← upload + concern onboarding
│   ├── review/[sessionId]/page.tsx ← the two-pane app
│   └── api/
│       ├── ingest/route.ts
│       ├── ask/route.ts
│       ├── explain/route.ts       ← plain-language rewrite of one clause
│       ├── act/route.ts           ← email + lawyer questions
│       ├── translate/route.ts
│       ├── speak/route.ts
│       └── session/[id]/route.ts  ← DELETE
├── components/
│   ├── DocumentPane.tsx           ← pdfjs viewer + highlight controller
│   ├── FindingsPane.tsx
│   ├── RiskDashboard.tsx
│   ├── MissingReport.tsx
│   ├── AskPanel.tsx
│   ├── ClaimCard.tsx              ← claim + quote + "show me" button
│   ├── RefusalCard.tsx            ← the designed "I don't know"
│   └── ConcernPicker.tsx
├── lib/                           ← as above
├── eval/
│   ├── fixtures/                  ← 3 synthetic contracts
│   ├── questions.json             ← 25 answerable + 10 unanswerable
│   └── run.ts
└── scripts/build-vectors.ts
```

## Session store

```ts
type Session = {
  id: string;
  createdAt: number;
  clauses: Clause[];
  vectors: number[][];
  fields: VerifiedFields;
  rubric: RubricResult[];
  findings: Finding[];
  concerns: Concern[];
};
```

`Map<string, Session>` with a sweeper deleting entries older than 30 minutes, run on every request. PDF **bytes** are never stored server-side — the client keeps them for rendering; the server keeps only extracted text. Say this in the demo.

## Failure handling

| Failure | Behaviour |
|---|---|
| Model call fails | Typed error, retry once, then show what succeeded and mark the rest unavailable |
| Embeddings fail | Keyword fallback, UI flags the method |
| Scan detected | Friendly explanation, no OCR attempt |
| Anchor not found | Page-level highlight, still cite the page |
| Session expired | "This review expired for your privacy" + re-upload |
| Cold start | Skeleton states with real progress labels, not a spinner |
