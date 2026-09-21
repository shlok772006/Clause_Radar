# Clause Radar — Start Here

This is the full spec pack for a 5-day solo build for PromptWars Virtual (Exclusive Edition), problem statement: **AI for legal assistance and access**.

Read this file end to end once. Then never read it again — the agent reads the rest.

---

## 1. What we are building, in one paragraph

**Clause Radar** reads an Indian employment agreement and tells you three things a general-purpose chatbot cannot: what your contract actually says (with the exact clause highlighted on the page as proof), what your contract *fails to say* that it should, and where it deviates from normal terms. It refuses to answer anything the document does not support. It ends by producing a negotiation email and a list of questions for a lawyer.

Tagline for the README and the video: **"The answer, the proof, and what's missing."**

---

## 2. Why this beats the "why not just use Gemini?" question

That question is the scoring axis. Our four answers, in order of strength:

1. **Absence detection.** A general assistant answers what is *in* the document. It will never spontaneously tell you your offer letter has no severance clause, no IP carve-out for prior work, and no cap on your indemnity. Clause Radar checks against a 20-point rubric and reports gaps as first-class findings. **This is the differentiator. Protect its build time above everything else.**
2. **Verification, not assertion.** Every claim carries a clause ID and a verbatim quote, and a server-side verifier checks the quote against the source before rendering. Claims that fail verification are destroyed, not displayed. Hallucination is handled by engineering, not by prompt wording.
3. **Calibrated refusal.** Ask about stock options when the document is silent and you get "not determinable from this document," the nearest related clause, and what to ask HR. We measure this in an eval harness and publish the number.
4. **Personalised lens + act layer.** You pick what you care about before you read; the dashboard ranks by that. Then you leave with an email to send, not a summary to forget.

Keep those four sentences memorised. They go in the README, the video narration, and the demo intro.

---

## 3. The user, pinned

**Priya, 23, first software job, Pune.** HR has sent a 24-page employment agreement as a PDF and wants it signed by Friday. She has no lawyer, no budget for one, and has never read a contract. She is worried about three things she cannot name precisely: whether she is locked in, what happens if she leaves, and whether she is signing away her side projects.

One user, one document type, one country. Do not broaden this. Narrow scope is what scores on "problem statement alignment."

---

## 4. The five-day shape

| Day | Outcome | Non-negotiable |
|---|---|---|
| 1 | Upload → parse → clause objects → two-pane viewer with click-to-highlight working | If highlighting does not work by end of Day 1, stop and fix it before anything else |
| 2 | Grounded Q&A + the verifier + refusal path | The verifier is a pure function with unit tests |
| 3 | Missing-clause engine + risk rules + dashboard | This is the winning feature; do not let it slip to Day 4 |
| 4 | Accessibility, translation, TTS, export, eval harness, deploy to Cloud Run | Test the **deployed URL**, not localhost |
| 5 | Three-contract regression, fix, record video, submit | Submit with 4+ hours of margin |

Full task breakdown with definitions of done: `10-BUILD-PLAN.md`.

---

## 5. How to drive Antigravity on this

The agent will do what you point it at. Point it at the docs, not at your memory of the docs.

**Setup, before you write any code:**

1. Create the repo. Copy `AGENTS.md` to the repo root. Copy every numbered doc into `docs/`.
2. Open the Manager surface and give it this as the first instruction:
   > Read `AGENTS.md` and `docs/`. Then produce an implementation plan for Task 1.1 through 1.6 in `docs/10-BUILD-PLAN.md`. Do not write code yet.
3. Read the plan it produces. **This is the highest-leverage ten minutes of your week.** If the plan is wrong, the code will be wrong five times faster than you can review it. Correct the plan, not the code.
4. Only then let it build.

**Working rules that will save you a day:**

- **One task per agent run.** Tasks in `10-BUILD-PLAN.md` are sized deliberately. Asking for a whole day at once produces a pile you cannot review.
- **Verify with the browser, not with the diff.** After each UI task, have the agent open the app and walk the flow. Agentic IDEs are much better at catching their own bugs when they can see the rendered result.
- **Make `npm run eval` the loop.** From Day 2 onward, the definition of done for anything touching answers is "eval harness still passes." Give the agent the command and let it iterate against it.
- **Never let the agent invent the domain config.** `05-DOMAIN-CONFIG.md` contains the clause rubric and risk rules as ready-to-paste files. They are the product. If the agent generates its own, you lose the differentiator to something generic.
- **Commit after every green task.** You need the ability to roll back a bad agent run in 10 seconds.
- **Keep the model choice pragmatic.** Use the strongest available model for the verifier and extraction work, and a cheaper one for boilerplate UI scaffolding.

---

## 6. The doc pack

| File | What it is | Who reads it |
|---|---|---|
| `AGENTS.md` | Repo rules, constraints, forbidden patterns | The agent, constantly |
| `01-PRD.md` | Product requirements, scope, user stories, cut list | You + agent |
| `02-ARCHITECTURE.md` | Stack, pipeline, module boundaries, file tree | The agent |
| `03-DATA-CONTRACTS.md` | Every TypeScript type and JSON schema | The agent, verbatim |
| `04-PROMPT-STRATEGY.md` | All six prompts, techniques, injection defence | You + agent |
| `05-DOMAIN-CONFIG.md` | 20-clause rubric + risk rules, paste-ready | Copy, don't regenerate |
| `06-EVAL-PLAN.md` | Test harness, metrics, fixtures | The agent |
| `07-SECURITY-PRIVACY.md` | Threat model and concrete controls | The agent |
| `08-ACCESSIBILITY.md` | WCAG AA checklist tied to the mission | The agent |
| `09-DESIGN-DIRECTION.md` | Tokens, type, layout, the one bold moment | The agent |
| `10-BUILD-PLAN.md` | 5 days as executable tasks with DoD | Both, daily |
| `11-DEMO-AND-SUBMISSION.md` | Video script, checklist, README template | You, Day 5 |

---

## 7. Four ways this goes wrong

1. **You build a chatbot.** Chat is a secondary tab. The document is the interface. If your first screen is a message box, you have built the thing the judges explicitly warned against.
2. **You spend Day 1 on prompts.** Prompts are roughly a tenth of the score. Timebox all prompt tuning to 90 minutes across the whole five days. The verifier is what fixes hallucination.
3. **You submit an "insurance" version early.** The **final** submission is scored, not the best one. Submit once, when it is done and tested. Any second submission must be strictly additive and verified first.
4. **It works on one PDF.** Test on three structurally different agreements before you record. A demo that breaks on an unseen document is the single most common failure in prototype rounds.
