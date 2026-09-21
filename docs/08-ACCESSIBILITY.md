# 08 — Accessibility

Accessibility is a scored criterion. In this project it is also the *mission* — the problem statement is literally about access to understanding. Frame it that way in the README and it counts twice.

Three layers, in priority order.

---

## Layer 1 — Access to meaning

The barrier here is not vision or motor control, it is legal English. Someone who cannot parse "notwithstanding anything contained hereinabove, the Employee shall forthwith" is locked out of their own contract just as effectively as someone who cannot see the screen.

- **Reading-level toggle** on every clause: *As written* / *In plain English*. Uses prompt P3, numbers preserved and verified.
- **Findings are written at roughly a Class 8 reading level.** All the static copy in `05-DOMAIN-CONFIG.md` is already written this way — keep it that way when you edit.
- **No unexplained legal terms.** First use of "indemnity", "non-solicitation", "liquidated damages", "in lieu of notice" gets an inline definition on hover *and* on focus (hover-only is not accessible).
- **Numbers rendered as humans say them:** "60 days (about 2 months)" beside a notice period.

## Layer 2 — Access to language

- **Language switcher**: English, Hindi, Marathi at minimum. Cloud Translation API on generated explanation text.
- **Quoted contract text is never translated.** It stays verbatim in the original with a note: *"quoted from your contract in the original English."* Translating a quote would break the verification chain the whole product rests on — and saying that out loud in the demo shows the judges you thought about it.
- **Text-to-speech** on findings and plain-language rewrites, via Cloud Text-to-Speech, with standard audio controls, a visible play state, and the ability to stop.
- `lang` attribute set correctly on translated regions so screen readers switch voice.

## Layer 3 — WCAG 2.1 AA

**Perceivable**
- [ ] Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI boundaries — verify the highlight colour against the text on top of it
- [ ] Severity never communicated by colour alone: every finding has a text label and an icon alongside the colour
- [ ] All icons have accessible names; decorative ones are `aria-hidden`
- [ ] Text resizes to 200% without loss of function
- [ ] The document pane is scrollable and zoomable, with visible zoom controls

**Operable**
- [ ] Full keyboard traversal: upload → concerns → dashboard → finding → "show me" → highlighted clause → back
- [ ] Visible focus ring everywhere, never `outline: none` without a replacement
- [ ] Skip link to the findings pane (the PDF viewer contains a lot of focusable text)
- [ ] Focus moves to the highlighted clause when "show me in the document" is activated, and is announced
- [ ] No keyboard traps in the PDF viewer
- [ ] `prefers-reduced-motion` respected — the highlight sweep becomes an instant state change

**Understandable**
- [ ] `lang` on `<html>` and on translated regions
- [ ] Errors say what happened and what to do, in the interface's voice
- [ ] Consistent vocabulary: a "finding" is always a finding, never a "risk", "issue" or "flag" in different places
- [ ] The refusal state is written as information, not as an error

**Robust**
- [ ] Semantic landmarks: `main`, `nav`, `aside`, headings in order
- [ ] Findings list is a real list; tabs use proper tab semantics with arrow-key navigation
- [ ] `aria-live="polite"` on the answer region so new answers are announced
- [ ] Loading states announced, not just spun

---

## Verification

- `axe-core` via `@axe-core/react` in development; zero serious or critical violations on the review page
- One full keyboard-only pass of the demo flow, no mouse, before recording
- One screen-reader pass of the ask-and-refuse flow (VoiceOver or NVDA), at least to confirm the refusal is announced
- Lighthouse accessibility score ≥ 95 — screenshot it for the README

---

## Say it in the video

Ten seconds, at the language switch: *"Access isn't only about who can open the document. This person's contract is in English legal drafting. She can read it in Marathi, hear it, and still see the original clause quoted exactly as written — because translating a quote would break the proof."*

That single line ties accessibility, grounding, and the problem statement together, and it is the kind of thing a judge remembers.
