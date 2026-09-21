# 06 — Evaluation and Testing

Testing is an explicitly scored criterion, and almost nobody in a hackathon does it. This is the cheapest differentiation in the entire build: roughly four hours of work for a section of your README that no other submission will have.

Two layers: unit tests for the pure functions, and an eval harness for the AI behaviour.

---

## Layer 1 — Unit tests (Vitest)

Four files, all pure, all trivially testable.

**`lib/segment.test.ts`**
- Numbered clause detection: `8.2 Notice Period` produces `number: "8.2"`
- Heading path accumulates and resets correctly
- Fragments under 120 chars merge forward
- Page numbers are correct across a page boundary
- Empty input returns `[]` rather than throwing

**`lib/verify.test.ts`** — the most important test file in the repo
- Non-existent `clauseId` → claim discarded
- Quote not present in cited clause → discarded
- Quote present but with different whitespace/case → **kept** (normalisation works)
- Claim says "90 days", cited clause says "60 days" → discarded (number containment)
- Claim says "sixty days", clause says "60 days" → kept (digit/word equivalence)
- Confidence 0.4 → downgraded
- All claims discarded → envelope becomes `insufficient_evidence`
- `discardedCount` is accurate

**`lib/rubric.test.ts`**
- Score above threshold → `present`
- Score in the band below → `unclear`
- Score well below → `missing`
- Embedding failure → keyword path used, `method: "keyword"`

**`lib/rules.test.ts`**
- Each rule fires on a crafted field set
- **A rule with no attachable evidence does not fire** — test this explicitly for at least three rules
- Interpolation renders values into titles correctly
- Asymmetric-notice rule does not fire when the two values are equal

Target: 30+ assertions. It does not need to be more than that.

---

## Layer 2 — Eval harness

### Fixtures

Three synthetic contracts in `eval/fixtures/`. Write them yourself (or generate and then hand-edit) so you know the ground truth. Make them structurally different — this is what catches the "works on one PDF" failure.

| Fixture | Character | Deliberate traps |
|---|---|---|
| `A-standard.pdf` | Clean 18-page agreement, decimal numbering (1, 1.1, 1.1.1) | Notice period stated in words ("sixty (60) days"); a benefits schedule in an annexure |
| `B-hostile.pdf` | 26 pages, aggressive terms, ALL-CAPS section headings, no decimal numbering | 24-month bond with penalty; asymmetric notice; unilateral amendment; no prior-inventions carve-out; arbitration seated in a different city |
| `C-sparse.pdf` | 9 pages, minimal, badly structured, paragraphs not clauses | Silent on severance, IP, leave, arbitration — should trigger many `missing` findings and several refusals |

Fixture C is the one that proves the missing-clause engine works. Use it in the video.

### Question set — `eval/questions.json`

25 answerable + 10 unanswerable. Each answerable entry:

```json
{
  "id": "q07",
  "fixture": "B-hostile",
  "question": "How long is the bond period?",
  "expectedValue": "24 months",
  "expectedClauseNumber": "11.3",
  "type": "answerable"
}
```

Unanswerable entries carry `"type": "unanswerable"` and no expectation. Use realistic ones, not absurd ones — the point is questions a real user would ask that this particular document happens not to cover:

- What happens to my stock options if I resign?
- Can I work remotely from another state?
- Is there a maternity leave policy?
- What is the appraisal cycle and when is my first review?
- Do I get a laptop allowance?
- What happens to my notice period if the company is acquired?
- Is there a retention bonus?
- Can I claim relocation expenses?
- What is the policy on international travel?
- Is my role eligible for an internal transfer after one year?

### Metrics

| Metric | Definition | Target | Where it appears |
|---|---|---|---|
| **Abstention rate** | unanswerable questions where `status == "insufficient_evidence"` | 100% | README headline, video |
| **Citation precision** | claims whose cited clause number matches the expected clause | ≥ 95% | README |
| **Value accuracy** | answers containing the expected value | ≥ 90% | README |
| **False refusal rate** | answerable questions refused | ≤ 10% | README |
| **Rubric accuracy** | rubric verdicts matching hand-labelled ground truth across 3 fixtures (60 judgements) | ≥ 85% | README |
| **Verifier catch count** | claims discarded by the verifier across the run | report raw | Video — say the number |

The last one is not a pass/fail metric, it is a *story*. "Across the eval run the verifier destroyed 14 claims before they reached the screen" is the most persuasive sentence in your demo, and it is only available to you because you built the verifier.

### Runner

`eval/run.ts`, invoked by `npm run eval`. Prints a table to stdout and writes `eval/results.md`. Exits non-zero if any target is missed, so the agent can use it as a build gate.

```
CLAUSE RADAR — EVAL
fixture   answerable  correct  cited-ok  refused
A          9           9        9         0
B         10          10        9         1
C          6           5        5         1
unanswerable: 10/10 abstained  ✓
citation precision 95.8%  ✓   value accuracy 92.0%  ✓
false refusal 8.0%  ✓        rubric accuracy 88.3%  ✓
verifier discarded 14 claims
```

Paste that block into the README verbatim. Screenshot it for the video.

---

## Ablation table (optional, Day 5, high value)

If time allows, run the eval three ways and publish:

| Configuration | Abstention | Citation precision |
|---|---|---|
| Full system | 100% | 95.8% |
| Without evidence-before-text ordering | — | — |
| Without the verifier | — | — |

Fill in the real numbers. This demonstrates you *measured* your prompt strategy rather than asserting it, which is exactly the distinction between prompt engineering and prompt guessing that the competition is testing.

---

## Manual test checklist (Day 5, on the deployed URL)

- [ ] All three fixtures upload and complete
- [ ] A real contract found online (not a fixture) completes without crashing
- [ ] A scanned/image PDF gives the friendly scan message
- [ ] A 12 MB PDF completes; an 18 MB one is rejected cleanly
- [ ] A `.docx` renamed to `.pdf` is rejected cleanly
- [ ] Click-to-highlight works on pages 1, mid-document, and last page
- [ ] The stock-options question refuses on all three fixtures
- [ ] Session expiry after 30 minutes shows the right message
- [ ] Delete removes the session and a refetch 404s
- [ ] Full keyboard traversal of the two-pane view
- [ ] Translation and audio work for at least one language
- [ ] Hard refresh mid-session degrades gracefully
- [ ] Nothing in Cloud Run logs contains contract text
