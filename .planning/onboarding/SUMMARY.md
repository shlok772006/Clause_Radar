# Onboarding Summary — Clause Radar

## What Was Learned

### Project Identity
Clause Radar is a **5-day hackathon build** for PromptWars Virtual — an Indian employment agreement analyzer that tells users three things: what their contract says (with proof), what it fails to say (20-point rubric), and where it deviates from normal terms.

### Key Differentiator
**Absence detection** — checking a contract against a rubric and reporting gaps. This is what a general-purpose assistant cannot do. The missing-clause engine (F6) is the single most protected feature.

### Architecture Pattern
A single Next.js app with NO database, NO auth, NO vector DB. Everything runs in-memory with a 30-minute TTL. The verification pipeline is the heart: every model output passes through `lib/verify.ts` (a pure function) before reaching the UI.

### Critical Files (Ranked by Importance)
1. **lib/verify.ts** — the most important file in the repo; pure, heavily tested
2. **config/clause-rubric.yaml** — the product differentiator; copied verbatim, never regenerated
3. **config/risk-rules.yaml** — domain expertise; copied verbatim
4. **lib/segment.ts** — deterministic clause segmentation; pure, tested
5. **components/DocumentPane.tsx** — the highest-risk UI component (click-to-highlight)

### Locked Constraints
- 10 locked decisions in PROJECT.md (no DB, no auth, server-side only AI, etc.)
- Stack is FIXED — do not substitute any dependency
- Domain config is DATA — never regenerate from AI knowledge
- Temperature 0 for anything factual
- Every claim needs a clauseId + verbatim quote, or it is destroyed

### Existing Assets
- 12 comprehensive doc files covering every aspect of the build
- AGENTS.md with hard rules and forbidden patterns
- GSD COMMANDS mapping GSD workflow to the 5-day plan
- No application code exists yet — greenfield

## Planning Artifacts Created

| File | Purpose |
|---|---|
| .planning/PROJECT.md | Root project definition — identity, stack, locked decisions |
| .planning/REQUIREMENTS.md | 11 functional + 6 non-functional requirements with acceptance criteria |
| .planning/ROADMAP.md | 5 phases (days) with tasks, dependencies, risks |
| .planning/STATE.md | Live status tracker — current phase, blockers, session log |
| .planning/codebase/STRUCTURE.md | Target file tree + module map |
| .planning/codebase/STACK.md | Full technology stack definition |
| .planning/onboarding/SUMMARY.md | This file |

## Next Command

```
/gsd:discuss-phase 1
```

This will gather implementation context for **Phase 1 — The Spine** (Tasks 1.1–1.6: scaffold, types, PDF extraction, segmentation, document viewer, ingest API).

After discuss-phase produces `1-CONTEXT.md`:
```
/gsd:plan-phase 1
```

Then:
```
/gsd:execute-phase 1
```
