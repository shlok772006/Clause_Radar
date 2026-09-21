# Codebase Structure — Clause Radar

## Current State: Pre-code (Documentation Only)

The repository contains no application code yet. Only planning documents exist.

```
clause-radar/
├── .git/                    ← initialized, no commits
├── .kilo/worktrees/         ← IDE metadata
├── .planning/               ← GSD planning infrastructure (just created)
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   ├── codebase/
│   ├── onboarding/
│   └── phases/
├── AGENTS.md                ← repo rules, constraints, forbidden patterns
├── GSD COMMANDS             ← GSD command reference for this project
└── docs/                    ← full spec pack (12 files)
    ├── 00-START-HERE.md
    ├── 01-PRD.md
    ├── 02-ARCHITECTURE.md
    ├── 03-DATA-CONTRACTS.md
    ├── 04-PROMPT-STRATEGY.md
    ├── 05-DOMAIN-CONFIG.md
    ├── 06-EVAL-PLAN.md
    ├── 07-SECURITY-PRIVACY.md
    ├── 08-ACCESSIBILITY.md
    ├── 09-DESIGN-DIRECTION.md
    ├── 10-BUILD-PLAN.md
    └── 11-DEMO-AND-SUBMISSION.md
```

## Target Architecture (from 02-ARCHITECTURE.md)

### Module Map

| Module | Purpose | Purity | Test Priority |
|---|---|---|---|
| lib/pdf.ts | Text + page map extraction | Pure-ish (pdfjs) | Medium |
| lib/segment.ts | Text → Clause[] | PURE | High |
| lib/embed.ts | Text[] → vectors | I/O | Low |
| lib/rubric.ts | Clauses → RubricResult | PURE | High |
| lib/extract.ts | Clauses → RawFields | I/O (model) | Medium |
| lib/verify.ts | Raw → Verified | PURE | **Critical** |
| lib/rules.ts | Fields → Finding[] | PURE | High |
| lib/ask.ts | Question → Envelope | I/O + verify | Medium |
| lib/store.ts | SessionStore w/ TTL | Stateful | Low |
| lib/prompts/ | One file per prompt | Data | Low |

### Dependencies (External)

| Package | Purpose | Version |
|---|---|---|
| next | Framework | 15.x |
| pdfjs-dist | PDF text extraction + viewer | latest |
| @google/generative-ai | Gemini SDK | latest |
| yaml | YAML config parsing | latest |
| vitest | Unit testing | latest |

### Conventions (from AGENTS.md)

- lib/ is pure and testable — no React imports, no fetch to browser
- Parsing, verification, rubric, rules: pure functions (data in, data out)
- Vitest for tests, test file next to source
- No `any`, no `@ts-ignore`, no silently swallowed errors
- Server actions or route handlers for ALL model calls
- No client-side model calls ever
