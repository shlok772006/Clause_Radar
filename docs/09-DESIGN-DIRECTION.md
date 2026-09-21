# 09 — Design Direction

## The idea

The visual language is **a lawyer's marked-up contract**. Not a SaaS dashboard, not a chat app. The reference is a printed agreement with a highlighter run across one clause and a note in the margin. Everything in the interface should feel like it belongs on, or beside, a page of paper.

This gives us the one thing the interface needs to communicate above all else: *the answer came from here, and here is exactly where.*

## Tokens

```css
--paper:    #FBFBF9;  /* cool near-white; NOT cream */
--ink:      #16202B;  /* deep blue-black, body and headings */
--ink-soft: #55606B;  /* secondary text */
--rule:     #DCDFD9;  /* hairlines, borders, dividers */
--marker:   #F2D14E;  /* highlighter — reserved exclusively for evidence */
--flag:     #B3402E;  /* brick — risk findings only */
--verified: #2F6F5E;  /* deep green — verification passed */
```

Seven values, no gradients, no shadows except a single soft one under the floating "show me" affordance. **`--marker` appears nowhere except on cited text.** That discipline is what makes the highlight mean something: when yellow appears, it is always evidence.

Avoid the cream-plus-serif-plus-terracotta palette that every generated design lands on. This one is cooler, and the accent is a highlighter yellow chosen from the subject matter, not from a trend.

## Type

Two families, split along a real boundary in the product:

- **Interface — Instrument Sans.** Navigation, findings, labels, buttons. Slightly narrow, contemporary, unfussy.
- **Document and quoted text — Source Serif 4.** Any text that came from the contract, and any plain-language rewrite of it. Serif because the contract is a document, and because it makes quotes visually distinct from our commentary at a glance.

The split is not decorative. A user should be able to tell, without reading, whether a sentence is the contract speaking or the app speaking.

Scale: 13 / 15 / 17 / 21 / 28 / 38. Body 15/1.55 sans, 17/1.7 serif. Line length capped at 68 characters in the findings pane.

Avoid: ALL-CAPS labels, one word in a headline coloured differently, eyebrow labels above every section, `→` appended to button text.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Clause Radar        offer-letter.pdf    expires in 24:10  ⌫│
├───────────────────────────────┬─────────────────────────────┤
│                               │  Risks   Missing   Ask      │
│   [ rendered PDF page ]       │ ─────────────────────────── │
│                               │                             │
│   ...notice period of         │  You give 90 days notice.   │
│  ▓▓sixty (60) days▓▓ shall    │  The company gives 30.      │
│   be given by the Employee... │                             │
│                               │  "...sixty (60) days shall  │
│                               │   be given by the Employee"  │
│         page 14 of 24         │   clause 8.2 · page 14      │
│                               │   ⟵ Show me in the document │
│                               │                             │
│                               │  Ask HR: can notice periods │
│                               │  be made equal?             │
└───────────────────────────────┴─────────────────────────────┘
```

- Document left, always visible, never collapsed on desktop. This is the product's core claim expressed as layout.
- Findings right, three tabs: **Risks**, **Missing**, **Ask**. Ask is third deliberately — chat is a feature, not the interface.
- Left-aligned throughout. No centred body text.
- Mobile: tabs become a two-state toggle (Document / Findings), with "show me" switching panes and highlighting on arrival.

## The one bold moment

**The highlight sweep.** When the user activates "Show me in the document", the left pane scrolls to the page and the marker colour wipes across the clause text left-to-right over 400ms, then settles. One orchestrated motion, once per interaction, nowhere else in the app. Everything else is instant.

Under `prefers-reduced-motion`, it becomes an immediate state change with no wipe.

Spend the boldness here and keep the rest quiet. No hover lifts on cards, no fade-up entrances on sections, no skeleton shimmer.

## Component notes

**ClaimCard** — plain-language claim in sans, then the verbatim quote in serif with a left rule in `--marker`, then clause number and page as quiet metadata, then the "show me" action. The quote is visually inset because it is someone else's words.

**RefusalCard** — must not look like an error. Same card shape, `--ink-soft` left rule instead of `--marker`. Heading: *"Your contract doesn't cover this."* Then the nearest clauses as links, then the questions to ask. Calm, useful, designed. This card gets a moment in the video, so make it good.

**MissingReport** — a list of 20 rows, each with a state (present / unclear / missing), the label, and on expansion the why-it-matters copy and the question to ask. Present rows link to the clause that satisfied them. Missing rows carry `--flag`. Do not use a percentage score or a grade — a contract is not a credit rating, and a fake score invites exactly the false precision this product exists to avoid.

**ConcernPicker** — six options, pick up to three, one screen, no wizard. Skippable.

## Empty and loading states

Write them as direction, not mood.

- Upload zone: *"Drop your employment agreement here. PDF, up to 15 MB."*
- Processing: real progress labels — *"Reading 24 pages" → "Finding clauses" → "Checking for missing terms"* — not a spinner and not a fake percentage.
- Scan detected: *"This looks like a scanned image, so there's no text to read. If you have the original PDF from HR, that will work."*
- Expired: *"This review expired after 30 minutes, which is how we keep your contract private. Upload it again to continue."*

## Copy rules

Sentence case everywhere. Active voice. Buttons say what happens: **Show me in the document**, **Delete now**, **Write the email**. The action keeps its name through the flow — the button that says **Delete now** produces a confirmation that says **Deleted**.

Never: "Analyzing your document with AI", "Powered by", "Insights", "Leverage", "Seamless".
